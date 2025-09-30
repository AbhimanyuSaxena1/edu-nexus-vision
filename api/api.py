import os
import time
import threading
import queue
import cv2
import numpy as np
from ultralytics import YOLO
import torch
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import base64
import uuid
import requests
from tqdm import tqdm
from deepface import DeepFace

# These imports seem specific to another part of your project.
# Make sure the 'db.py' and 'apiTutor.py' files exist in your project directory.
from db import DatabaseManager
from apiTutor import (
    get_agent_response,
    TestRequest,
    TutorRequest,
    test_creator,
    ai_tutor,
)


def download_model(model_url: str, save_path: str = "yolov12l-face.pt") -> str:
    """Downloads the model from model_url only if it does not exist locally."""
    if os.path.exists(save_path):
        print(f"[INFO] Model already exists at: {save_path}")
        return save_path

    print(f"[INFO] Downloading model from {model_url}...")
    response = requests.get(model_url, stream=True)
    response.raise_for_status()

    total_size = int(response.headers.get("content-length", 0))
    block_size = 1024

    with (
        open(save_path, "wb") as file,
        tqdm(
            desc=save_path,
            total=total_size,
            unit="B",
            unit_scale=True,
            unit_divisor=1024,
        ) as bar,
    ):
        for data in response.iter_content(block_size):
            file.write(data)
            bar.update(len(data))

    print(f"[INFO] Model downloaded and saved to {save_path}")
    return save_path


class FaceRecognitionAPI:
    def __init__(
        self,
        model_path="yolov12l-face.pt",
        face_img_path="saved_faces",
        embedding_model="VGG-Face",
    ):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")

        os.makedirs(face_img_path, exist_ok=True)
        self.face_img_path = face_img_path
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.model_path = model_path
        self.embedding_model_name = embedding_model

        print(f"Loading YOLO model on {self.device}...")
        self.model = YOLO(model_path)
        if self.device != "cpu":
            self.model.to(self.device)
        print("YOLO model loaded successfully")

        print(f"Warming up DeepFace model ('{self.embedding_model_name}')...")
        try:
            dummy_image = np.zeros((100, 100, 3), dtype=np.uint8)
            DeepFace.represent(
                dummy_image,
                model_name=self.embedding_model_name,
                enforce_detection=False,
            )
            print("DeepFace model warmed up successfully.")
        except Exception as e:
            print(f"Could not warm up DeepFace model: {e}")
            print("The model will be downloaded on the first actual request.")

        self.db_manager = DatabaseManager()
        self.db_manager._connect()

        self.encoding_queue = queue.Queue(maxsize=10)  # Increased queue size slightly
        self.result_queue = queue.Queue()

        # Thread-safe data structures
        self.known_faces = {}
        self.known_faces_lock = threading.Lock()

        self.processing_tracks = set()
        self.processing_lock = threading.Lock()

        # Lock for thread-safe database access
        self.db_lock = threading.Lock()

        # REMOVED: The threading.Event system was removed as it's no longer needed
        # with the non-blocking architecture.

        self.worker_thread = threading.Thread(target=self._encoding_worker, daemon=True)
        self.worker_thread.start()
        self.result_thread = threading.Thread(target=self._process_results, daemon=True)
        self.result_thread.start()

        print("Face Recognition API initialized")

    def _encoding_worker(self):
        """Single worker thread for face encoding using DeepFace"""
        while True:
            try:
                track_id, face_crop = self.encoding_queue.get(timeout=1)
                try:
                    embedding_objs = DeepFace.represent(
                        img_path=face_crop,
                        model_name=self.embedding_model_name,
                        enforce_detection=False,
                        detector_backend="skip",
                    )
                    if embedding_objs and "embedding" in embedding_objs[0]:
                        encoding = embedding_objs[0]["embedding"]
                        self.result_queue.put((track_id, encoding, face_crop))
                    else:
                        self.result_queue.put((track_id, None, face_crop))
                except Exception as e:
                    print(f"DeepFace encoding error for track_id {track_id}: {e}")
                    self.result_queue.put((track_id, None, None))
            except queue.Empty:
                continue

    def _process_results(self):
        """Process recognition results with proper synchronization"""
        while True:
            track_id = None
            try:
                result = self.result_queue.get(timeout=1)
                track_id, encoding, face_crop = result

                if encoding is None:
                    # Failed encoding - mark as complete and skip
                    with self.processing_lock:
                        self.processing_tracks.discard(track_id)
                    continue

                # Query database
                with self.db_lock:
                    reid_num, name = self.db_manager.query(embedding=encoding)

                # If not found, add new entry
                if reid_num is None:
                    reid_num = self.db_manager.next_reid_num()
                    name = f"Unknown_{reid_num}"
                    if face_crop is not None:
                        cv2.imwrite(
                            f"{self.face_img_path}/reid_{reid_num}.jpg", face_crop
                        )
                    with self.db_lock:
                        self.db_manager.add(
                            embedding=encoding, reid_num=reid_num, name=name
                        )
                    print(f"Added new face: ReID {reid_num}")

                # Update known faces with proper locking
                with self.known_faces_lock:
                    self.known_faces[track_id] = (name, reid_num)

                # Mark processing complete AFTER all operations
                with self.processing_lock:
                    self.processing_tracks.discard(track_id)

                # REMOVED: Signaling the completion event is no longer necessary.

            except queue.Empty:
                continue
            except Exception as e:
                print(f"Result processing error: {e}")
                if track_id:
                    # Ensure cleanup on error
                    with self.processing_lock:
                        self.processing_tracks.discard(track_id)

    def detect_faces_with_tracking(self, frame):
        """Detect faces in frame with tracking"""
        try:
            results = self.model.track(
                frame, persist=True, device=self.device, verbose=False
            )
            detections = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        try:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = float(box.conf[0])
                            track_id = (
                                int(box.id[0])
                                if hasattr(box, "id") and box.id is not None
                                else None
                            )
                            if conf > 0.5 and track_id is not None:
                                padding = 5
                                y1_pad, y2_pad = (
                                    max(0, y1 - padding),
                                    min(frame.shape[0], y2 + padding),
                                )
                                x1_pad, x2_pad = (
                                    max(0, x1 - padding),
                                    min(frame.shape[1], x2 + padding),
                                )
                                face_crop = frame[y1_pad:y2_pad, x1_pad:x2_pad].copy()
                                if face_crop.size > 0:
                                    detections.append(
                                        {
                                            "bbox": (x1, y1, x2, y2),
                                            "conf": conf,
                                            "face_crop": face_crop,
                                            "track_id": track_id,
                                        }
                                    )
                        except Exception as e:
                            print(f"Detection error: {e}")
            return detections
        except Exception as e:
            print(f"Face detection error: {e}")
            return []

    def detect_faces_simple(self, frame):
        """Simple face detection without tracking"""
        try:
            results = self.model(frame, device=self.device, verbose=False)
            detections = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        try:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = float(box.conf[0])
                            if conf > 0.5:
                                padding = 20
                                y1_pad, y2_pad = (
                                    max(0, y1 - padding),
                                    min(frame.shape[0], y2 + padding),
                                )
                                x1_pad, x2_pad = (
                                    max(0, x1 - padding),
                                    min(frame.shape[1], x2 + padding),
                                )
                                face_crop = frame[y1_pad:y2_pad, x1_pad:x2_pad].copy()
                                if face_crop.size > 0:
                                    detections.append(
                                        {
                                            "bbox": (x1, y1, x2, y2),
                                            "conf": conf,
                                            "face_crop": face_crop,
                                        }
                                    )
                        except Exception as e:
                            print(f"Simple detection error: {e}")
            return detections
        except Exception as e:
            print(f"Simple face detection error: {e}")
            return []

    def recognize_faces_sync(self, detections):
        """Synchronously recognize faces from detections using DeepFace"""
        names = []
        for detection in detections:
            try:
                face_crop = detection["face_crop"]
                embedding_objs = DeepFace.represent(
                    img_path=face_crop,
                    model_name=self.embedding_model_name,
                    enforce_detection=False,
                    detector_backend="skip",
                )
                if embedding_objs and "embedding" in embedding_objs[0]:
                    encoding = embedding_objs[0]["embedding"]
                    with self.db_lock:
                        _, name = self.db_manager.query(embedding=encoding)
                    names.append(name if name else "Unknown")
                else:
                    names.append("Unknown")
            except Exception as e:
                print(f"Sync recognition error: {e}")
                names.append("Unknown")
        return names

    # --- START: FULLY REVISED AND CORRECTED FUNCTION ---
    def process_frame_with_info(self, frame, use_tracking=True):
        """Process frame using a non-blocking architecture."""
        if frame is None:
            return None, {"head_count": 0, "names": [], "face_info": []}

        if use_tracking:
            detections = self.detect_faces_with_tracking(frame)

            # Process new faces for tracking in a non-blocking "fire-and-forget" way
            for detection in detections:
                track_id = detection["track_id"]

                with self.known_faces_lock:
                    is_known = track_id in self.known_faces
                with self.processing_lock:
                    is_processing = track_id in self.processing_tracks

                # If the face is new and not already being processed, queue it up
                if not is_known and not is_processing:
                    try:
                        self.encoding_queue.put_nowait(
                            (track_id, detection["face_crop"])
                        )
                        with self.processing_lock:
                            self.processing_tracks.add(track_id)
                    except queue.Full:
                        print(
                            "Encoding queue full, skipping face for track_id:", track_id
                        )

            # Build the response immediately without waiting for the results.
            # Results will appear in subsequent frames.
            display_frame = frame.copy()
            face_info = []
            names = []

            for detection in detections:
                x1, y1, x2, y2 = detection["bbox"]
                track_id = detection["track_id"]

                with self.known_faces_lock:
                    known = self.known_faces.get(track_id)
                with self.processing_lock:
                    is_processing = track_id in self.processing_tracks

                if known:
                    name, reid_num = known
                    label = f"{name} (ID:{reid_num})"
                    color, status = (0, 255, 0), "recognized"
                    names.append(name)
                elif is_processing:
                    name, reid_num = "Processing...", None
                    label, color, status = "Processing...", (0, 165, 255), "processing"
                    names.append("Processing...")
                else:
                    name, reid_num = "Unknown", None
                    label, color, status = "Unknown", (0, 0, 255), "unknown"
                    names.append("Unknown")

                face_info.append(
                    {
                        "track_id": track_id,
                        "name": name,
                        "reid_num": reid_num,
                        "bbox": [x1, y1, x2, y2],
                        "confidence": detection["conf"],
                        "status": status,
                    }
                )

                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(
                    display_frame,
                    label,
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2,
                )
        else:
            # Synchronous logic for non-tracking mode remains unchanged
            detections = self.detect_faces_simple(frame)
            names = self.recognize_faces_sync(detections)
            display_frame = frame.copy()
            face_info = []
            for i, (detection, name) in enumerate(zip(detections, names)):
                x1, y1, x2, y2 = detection["bbox"]
                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                label = name
                face_info.append(
                    {
                        "detection_id": i,
                        "name": name,
                        "bbox": [x1, y1, x2, y2],
                        "confidence": detection["conf"],
                        "status": "recognized" if name != "Unknown" else "unknown",
                    }
                )
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(
                    display_frame,
                    label,
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2,
                )

        info = {
            "head_count": len(detections),
            "names": list(set(n for n in names if n != "Processing...")),
            "face_info": face_info,
            "tracking_enabled": use_tracking,
        }
        return display_frame, info

    # --- END: FULLY REVISED AND CORRECTED FUNCTION ---

    def rename_person(self, reid_num, new_name):
        """Rename a person in the database"""
        if not new_name.strip():
            return False, "Name cannot be empty"
        try:
            reid_num = int(reid_num)
        except (ValueError, TypeError):
            return False, "Invalid ReID number"

        with self.db_lock:
            success = self.db_manager.update_name(reid_num, new_name)

        if success:
            with self.known_faces_lock:
                for track_id, (_, rid) in self.known_faces.items():
                    if rid == reid_num:
                        self.known_faces[track_id] = (new_name, reid_num)
            return True, f"Renamed ReID {reid_num} to {new_name}"
        return False, f"Failed to rename ReID {reid_num}"

    def get_status(self):
        """Get system status"""
        with self.processing_lock:
            processing_count = len(self.processing_tracks)
        with self.known_faces_lock:
            known_count = len(self.known_faces)

        return {
            "known_faces_in_session": known_count,
            "processing_tasks": processing_count,
            "encoding_queue_size": self.encoding_queue.qsize(),
            "device": self.device,
            "face_detector_model": os.path.basename(self.model_path),
            "face_embedding_model": self.embedding_model_name,
            "face_storage_path": self.face_img_path,
        }

    def get_all_faces(self):
        """Get all faces from database in a thread-safe manner"""
        faces = []
        with self.db_lock:
            if not (
                hasattr(self.db_manager, "reid_name_map")
                and self.db_manager.reid_name_map
            ):
                return []
            items = list(self.db_manager.reid_name_map.items())

        for key, name in items:
            try:
                reid_num = key.split("_")[1] if "_" in key else key
                faces.append({"reid_num": int(reid_num), "name": name})
            except (ValueError, IndexError) as e:
                print(f"Could not parse reid_num from key '{key}': {e}")
                continue
        return faces


# --- FastAPI Setup ---
model_url = (
    "https://github.com/YapaLab/yolo-face/releases/download/v0.0.0/yolov12l-face.pt"
)
face_api = FaceRecognitionAPI(
    model_path=download_model(model_url),
    face_img_path="saved_faces",
    embedding_model="VGG-Face",  # You can try "Facenet512" or "ArcFace" for different accuracy/speed trade-offs
)

app = FastAPI(title="Corrected Face Recognition API", version="3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def image_to_base64(image):
    _, buffer = cv2.imencode(".jpg", image)
    return base64.b64encode(buffer).decode("utf-8")


@app.post("/analyze_frame")
async def analyze_frame(file: UploadFile = File(...), use_tracking: bool = Form(True)):
    """Analyze a frame to get both visual result and detailed face information"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        processed_frame, face_info = face_api.process_frame_with_info(
            frame, use_tracking
        )
        img_base64 = (
            image_to_base64(processed_frame) if processed_frame is not None else None
        )

        return JSONResponse(
            content={
                "image": img_base64,
                "head_count": face_info["head_count"],
                "names": face_info["names"],
                "face_info": face_info["face_info"],
                "tracking_enabled": face_info["tracking_enabled"],
                "message": f"Successfully analyzed frame with {face_info['head_count']} faces detected",
            }
        )
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing frame: {str(e)}")


# --- All other endpoints remain the same ---


@app.post("/rename")
async def rename_person(reid_num: str = Form(...), new_name: str = Form(...)):
    success, message = face_api.rename_person(reid_num, new_name)
    if not success and "Invalid" in message:
        raise HTTPException(status_code=400, detail=message)
    return JSONResponse(content={"success": success, "message": message})


@app.get("/status")
async def get_status():
    return JSONResponse(content=face_api.get_status())


@app.get("/faces")
async def get_all_faces():
    return JSONResponse(content={"faces": face_api.get_all_faces()})


@app.get("/unknown_faces")
async def get_unknown_faces():
    """Get all unknown/unidentified faces that can be added as students"""
    try:
        all_faces = face_api.get_all_faces()
        unknown_faces_list = []
        for face in all_faces:
            if face["name"].startswith("Unknown_"):
                reid_num = face["reid_num"]
                face_image_path = f"{face_api.face_img_path}/reid_{reid_num}.jpg"
                has_image = os.path.exists(face_image_path)
                unknown_faces_list.append(
                    {
                        "reid_num": reid_num,
                        "name": face["name"],
                        "has_image": has_image,
                    }
                )
        return JSONResponse(
            content={
                "unknown_faces": unknown_faces_list,
                "count": len(unknown_faces_list),
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting unknown faces: {str(e)}"
        )


@app.get("/face_image/{reid_num}")
async def get_face_image(reid_num: int):
    """Get the saved face image for a specific ReID number"""
    face_image_path = f"{face_api.face_img_path}/reid_{reid_num}.jpg"
    if not os.path.exists(face_image_path):
        raise HTTPException(status_code=404, detail="Face image not found")
    with open(face_image_path, "rb") as image_file:
        image_data = image_file.read()
    image_base64 = base64.b64encode(image_data).decode("utf-8")
    return JSONResponse(content={"reid_num": reid_num, "image": image_base64})


@app.post("/add_student")
async def add_student(reid_num: str = Form(...), student_name: str = Form(...)):
    """Rename an 'Unknown' face to a student's name."""
    success, message = face_api.rename_person(reid_num, student_name)
    if not success:
        # Check if the error was due to bad input or a system failure
        if "Invalid" in message or "empty" in message:
            raise HTTPException(status_code=400, detail=message)
        raise HTTPException(status_code=500, detail=message)
    return JSONResponse(
        content={
            "success": True,
            "message": f"Successfully added {student_name} (ReID: {reid_num})",
        }
    )


@app.delete("/remove_face/{reid_num}")
async def remove_face(reid_num: int):
    """Effectively remove a face by renaming it to 'Dismissed'."""
    success, message = face_api.rename_person(reid_num, f"Dismissed_{reid_num}")
    if not success:
        raise HTTPException(status_code=404, detail=f"ReID {reid_num} not found")
    return JSONResponse(
        content={
            "success": True,
            "message": f"Face ReID {reid_num} has been dismissed.",
        }
    )


@app.get("/")
async def root():
    return {"message": "Corrected Face Recognition API", "version": "3.0"}


if __name__ == "__main__":
    import uvicorn

    # Use reload=True for development to see changes without restarting server
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
    # ^^^ IMPORTANT: Replace "your_filename" with the actual name of your Python file (e.g., "main:app")
