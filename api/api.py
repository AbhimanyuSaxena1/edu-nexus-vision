import os
import time
import threading
import queue
import cv2
import face_recognition
import numpy as np
from ultralytics import YOLO
import torch
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import base64
import io
from PIL import Image
from typing import Dict, List, Optional
from db import DatabaseManager
import requests
from tqdm import tqdm

def download_model(model_url: str, save_path: str = "yolov12l-face.pt") -> str:
    """
    Downloads the model from model_url only if it does not exist locally.

    Args:
        model_url (str): URL of the model file.
        save_path (str): Local file path to save the model.

    Returns:
        str: Path to the model file.
    """
    if os.path.exists(save_path):
        print(f"[INFO] Model already exists at: {save_path}")
        return save_path

    print(f"[INFO] Downloading model from {model_url}...")
    response = requests.get(model_url, stream=True)
    response.raise_for_status()  # Raise error if request failed

    total_size = int(response.headers.get("content-length", 0))
    block_size = 1024  # 1 KB

    with open(save_path, "wb") as file, tqdm(
        desc=save_path,
        total=total_size,
        unit="B",
        unit_scale=True,
        unit_divisor=1024,
    ) as bar:
        for data in response.iter_content(block_size):
            file.write(data)
            bar.update(len(data))

    print(f"[INFO] Model downloaded and saved to {save_path}")
    return save_path

class FaceRecognitionAPI:
    def __init__(self, model_path='yolov12l-face.pt', face_img_path="saved_faces"):
        # Initialize paths and device
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        os.makedirs(face_img_path, exist_ok=True)
        self.face_img_path = face_img_path
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.model_path = model_path  # Store model path as instance variable
        
        # Load YOLO model
        print(f"Loading YOLO model on {self.device}...")
        self.model = YOLO(model_path)
        if self.device != "cpu":
            self.model.to(self.device)
        print("Model loaded successfully")
        
        # Initialize database
        self.db_manager = DatabaseManager()
        self.db_manager._connect()
        
        # Thread-safe queues
        self.encoding_queue = queue.Queue(maxsize=5)
        self.result_queue = queue.Queue()
        
        # Tracking data
        self.known_faces = {}  # track_id -> (name, reid_num)
        self.processing_tracks = set()  # Currently processing track IDs
        self.track_timeout = 30  # Seconds to keep track info
        
        # Start worker threads
        self.worker_thread = threading.Thread(target=self._encoding_worker, daemon=True)
        self.worker_thread.start()
        self.result_thread = threading.Thread(target=self._process_results, daemon=True)
        self.result_thread.start()
        
        print("Face Recognition API initialized")

    def _encoding_worker(self):
        """Single worker thread for face encoding"""
        while True:
            try:
                # Get task from queue
                track_id, face_crop = self.encoding_queue.get(timeout=1)
                
                # Process face
                try:
                    face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
                    face_locations = face_recognition.face_locations(face_rgb)
                    
                    if face_locations:
                        encoding = face_recognition.face_encodings(face_rgb, face_locations)[0]
                        self.result_queue.put((track_id, encoding.tolist(), face_crop))
                    else:
                        self.result_queue.put((track_id, None, face_crop))
                        
                except Exception as e:
                    print(f"Encoding error: {e}")
                    self.result_queue.put((track_id, None, None))
                    
            except queue.Empty:
                continue

    def _process_results(self):
        """Process recognition results"""
        while True:
            try:
                result = self.result_queue.get(timeout=1)
                if len(result) == 2:
                    track_id, encoding = result
                    face_crop = None
                else:
                    track_id, encoding, face_crop = result
                
                # Remove from processing set
                self.processing_tracks.discard(track_id)
                
                if encoding is None:
                    continue
                    
                # Check database
                reid_num, name = self.db_manager.query(embedding=encoding)
                
                if reid_num is None:
                    # New face
                    reid_num = self.db_manager.next_reid_num()
                    name = f"Unknown_{reid_num}"
                    if face_crop is not None:
                        cv2.imwrite(f"{self.face_img_path}/reid_{reid_num}.jpg", face_crop)
                    self.db_manager.add(embedding=encoding, reid_num=reid_num, name=name)
                    print(f"Added new face: ReID {reid_num}")
                
                # Store result
                self.known_faces[track_id] = (name, reid_num)
                
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Result processing error: {e}")

    def detect_faces_with_tracking(self, frame):
        """Detect faces in frame with tracking"""
        try:
            results = self.model.track(frame, persist=True, device=self.device, verbose=False)
            detections = []
            
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        try:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = float(box.conf[0])
                            track_id = int(box.id[0]) if hasattr(box, 'id') and box.id is not None else None
                            
                            if conf > 0.5 and track_id is not None:
                                # Add padding to face crop
                                padding = 20
                                y1_pad = max(0, y1 - padding)
                                y2_pad = min(frame.shape[0], y2 + padding)
                                x1_pad = max(0, x1 - padding)
                                x2_pad = min(frame.shape[1], x2 + padding)
                                
                                face_crop = frame[y1_pad:y2_pad, x1_pad:x2_pad].copy()
                                
                                if face_crop.size > 0:
                                    detections.append({
                                        'bbox': (x1, y1, x2, y2),
                                        'conf': conf,
                                        'face_crop': face_crop,
                                        'track_id': track_id
                                    })
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
                                y1_pad = max(0, y1 - padding)
                                y2_pad = min(frame.shape[0], y2 + padding)
                                x1_pad = max(0, x1 - padding)
                                x2_pad = min(frame.shape[1], x2 + padding)
                                
                                face_crop = frame[y1_pad:y2_pad, x1_pad:x2_pad].copy()
                                
                                if face_crop.size > 0:
                                    detections.append({
                                        'bbox': (x1, y1, x2, y2),
                                        'conf': conf,
                                        'face_crop': face_crop
                                    })
                        except Exception as e:
                            print(f"Simple detection error: {e}")
            
            return detections
            
        except Exception as e:
            print(f"Simple face detection error: {e}")
            return []

    def recognize_faces_sync(self, detections):
        """Synchronously recognize faces from detections"""
        names = []
        
        for detection in detections:
            try:
                face_crop = detection['face_crop']
                face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(face_rgb)
                
                if face_locations:
                    encoding = face_recognition.face_encodings(face_rgb, face_locations)[0]
                    reid_num, name = self.db_manager.query(embedding=encoding.tolist())
                    
                    if name:
                        names.append(name)
                    else:
                        names.append("Unknown")
                else:
                    names.append("Unknown")
                    
            except Exception as e:
                print(f"Recognition error: {e}")
                names.append("Unknown")
        
        return names

    def process_frame_with_info(self, frame, use_tracking=True):
        """Process frame and return both visual result and face information"""
        if frame is None:
            return None, {"head_count": 0, "names": [], "face_info": []}
        
        if use_tracking:
            # Use tracking for persistent face recognition
            detections = self.detect_faces_with_tracking(frame)
            
            # Process new faces for tracking
            for detection in detections:
                track_id = detection['track_id']
                
                # Skip if already known or being processed
                if track_id in self.known_faces or track_id in self.processing_tracks:
                    continue
                    
                # Add to processing queue
                try:
                    self.encoding_queue.put_nowait((track_id, detection['face_crop']))
                    self.processing_tracks.add(track_id)
                except queue.Full:
                    print("Encoding queue full, skipping face")
            
            # Draw results and collect information
            display_frame = frame.copy()
            face_info = []
            names = []
            
            for detection in detections:
                x1, y1, x2, y2 = detection['bbox']
                track_id = detection['track_id']
                
                # Determine label and color
                if track_id in self.known_faces:
                    name, reid_num = self.known_faces[track_id]
                    label = f"{name} (ID:{reid_num})"
                    color = (0, 255, 0)  # Green
                    status = "recognized"
                    names.append(name)
                elif track_id in self.processing_tracks:
                    name = "Processing..."
                    reid_num = None
                    label = "Processing..."
                    color = (0, 165, 255)  # Orange
                    status = "processing"
                    names.append("Processing...")
                else:
                    name = "Unknown"
                    reid_num = None
                    label = "Unknown"
                    color = (0, 0, 255)  # Red
                    status = "unknown"
                    names.append("Unknown")
                
                # Add face info
                face_info.append({
                    "track_id": track_id,
                    "name": name,
                    "reid_num": reid_num,
                    "bbox": [x1, y1, x2, y2],
                    "confidence": detection['conf'],
                    "status": status
                })
                
                # Draw bounding box and label
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(display_frame, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        else:
            # Simple detection without tracking
            detections = self.detect_faces_simple(frame)
            names = self.recognize_faces_sync(detections)
            
            # Draw results
            display_frame = frame.copy()
            face_info = []
            
            for i, (detection, name) in enumerate(zip(detections, names)):
                x1, y1, x2, y2 = detection['bbox']
                
                # Determine color based on recognition
                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                label = name
                
                # Add face info
                face_info.append({
                    "detection_id": i,
                    "name": name,
                    "bbox": [x1, y1, x2, y2],
                    "confidence": detection['conf'],
                    "status": "recognized" if name != "Unknown" else "unknown"
                })
                
                # Draw bounding box and label
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(display_frame, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        # Prepare return info
        info = {
            "head_count": len(detections),
            "names": names,
            "face_info": face_info,
            "tracking_enabled": use_tracking
        }
        
        return display_frame, info

    def rename_person(self, reid_num, new_name):
        """Rename a person in the database"""
        if not new_name.strip():
            return False, "Name cannot be empty"
        
        try:
            reid_num = int(reid_num)
        except (ValueError, TypeError):
            return False, "Invalid ReID number"
        
        success = self.db_manager.update_name(reid_num, new_name)
        if success:
            # Update in-memory mappings
            for track_id, (name, rid) in self.known_faces.items():
                if rid == reid_num:
                    self.known_faces[track_id] = (new_name, reid_num)
            return True, f"Renamed ReID {reid_num} to {new_name}"
        else:
            return False, f"Failed to rename ReID {reid_num}"

    def get_status(self):
        """Get system status"""
        return {
            "known_faces": len(self.known_faces),
            "processing": len(self.processing_tracks),
            "queue_size": self.encoding_queue.qsize(),
            "device": self.device,
            "model_path": os.path.basename(self.model_path),
            "face_storage_path": self.face_img_path
        }

    def get_all_faces(self):
        """Get all faces from database"""
        try:
            if hasattr(self.db_manager, 'reid_name_map') and self.db_manager.reid_name_map:
                faces = []
                for key, name in self.db_manager.reid_name_map.items():
                    reid_num = key.split("_")[1] if "_" in key else key
                    faces.append({"reid_num": int(reid_num), "name": name})
                return faces
            return []
        except Exception as e:
            print(f"Error getting faces: {e}")
            return []

model_url = "https://github.com/YapaLab/yolo-face/releases/download/v0.0.0/yolov12l-face.pt"

# Initialize API system
face_api = FaceRecognitionAPI(model_path=download_model(model_url), face_img_path="saved_faces")

# Create FastAPI app
app = FastAPI(title="Enhanced Face Recognition API", version="2.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to convert image to base64
def image_to_base64(image):
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode('.jpg', image)
    img_bytes = buffer.tobytes()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    return img_base64

# Helper function to convert base64 to image
def base64_to_image(img_base64):
    """Convert base64 string to OpenCV image"""
    img_bytes = base64.b64decode(img_base64)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img

# API Endpoints

@app.post("/analyze_frame")
async def analyze_frame(file: UploadFile = File(...), use_tracking: bool = Form(True)):
    """
    Analyze a frame to get both visual result and detailed face information
    Combines headcount and face recognition functionality
    """
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Process frame with combined functionality
        processed_frame, face_info = face_api.process_frame_with_info(frame, use_tracking)
        
        # Convert processed frame to base64
        img_base64 = image_to_base64(processed_frame) if processed_frame is not None else None
        
        return JSONResponse(content={
            "image": img_base64,
            "head_count": face_info["head_count"],
            "names": face_info["names"],
            "face_info": face_info["face_info"],
            "tracking_enabled": face_info["tracking_enabled"],
            "message": f"Successfully analyzed frame with {face_info['head_count']} faces detected"
        })
        
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing frame: {str(e)}")

# Keep original endpoints for backward compatibility
@app.post("/process_frame")
async def process_frame(file: UploadFile = File(...)):
    """Process an image frame for face recognition (legacy endpoint)"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        processed_frame, _ = face_api.process_frame_with_info(frame, use_tracking=True)
        img_base64 = image_to_base64(processed_frame)
        
        return JSONResponse(content={
            "image": img_base64,
            "message": "Frame processed successfully"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing frame: {str(e)}")

@app.post("/headcount")
async def get_head_count(file: UploadFile = File(...)):
    """Get the head count and list of detected people names (legacy endpoint)"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        _, face_info = face_api.process_frame_with_info(frame, use_tracking=False)
        
        return JSONResponse(content={
            "head_count": face_info["head_count"],
            "names": face_info["names"],
            "message": f"Successfully detected {face_info['head_count']} faces"
        })
        
    except Exception as e:
        print(f"Headcount error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing head count: {str(e)}")

@app.post("/rename")
async def rename_person(reid_num: str = Form(...), new_name: str = Form(...)):
    """Rename a person in the database"""
    try:
        success, message = face_api.rename_person(reid_num, new_name)
        return JSONResponse(content={
            "success": success,
            "message": message
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error renaming person: {str(e)}")

@app.get("/status")
async def get_status():
    """Get system status"""
    try:
        status = face_api.get_status()
        return JSONResponse(content=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")

@app.get("/faces")
async def get_all_faces():
    """Get all faces in the database"""
    try:
        faces = face_api.get_all_faces()
        return JSONResponse(content={"faces": faces})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting faces: {str(e)}")

@app.post("/add_student")
async def add_student(
    reid_num: str = Form(...), 
    student_name: str = Form(...),
    student_id: str = Form(None)
):
    """Add an unknown face to the student database"""
    try:
        reid_num = int(reid_num)
        
        if not student_name.strip():
            raise HTTPException(status_code=400, detail="Student name cannot be empty")
        
        # Update the name in the face recognition database
        success = face_api.db_manager.update_name(reid_num, student_name)
        
        if success:
            # Update in-memory mappings
            for track_id, (name, rid) in face_api.known_faces.items():
                if rid == reid_num:
                    face_api.known_faces[track_id] = (student_name, reid_num)
            
            return JSONResponse(content={
                "success": True,
                "message": f"Successfully added {student_name} as ReID {reid_num}",
                "reid_num": reid_num,
                "name": student_name,
                "student_id": student_id
            })
        else:
            raise HTTPException(status_code=404, detail=f"ReID {reid_num} not found in database")
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ReID number")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding student: {str(e)}")

@app.get("/unknown_faces")
async def get_unknown_faces():
    """Get all unknown/unidentified faces that can be added as students"""
    try:
        unknown_faces = []
        
        # Get all faces from database
        if hasattr(face_api.db_manager, 'reid_name_map') and face_api.db_manager.reid_name_map:
            for key, name in face_api.db_manager.reid_name_map.items():
                reid_num = key.split("_")[1] if "_" in key else key
                
                # Check if this is an "Unknown_" face that hasn't been assigned to a student
                if name.startswith("Unknown_"):
                    # Check if face image exists
                    face_image_path = f"{face_api.face_img_path}/reid_{reid_num}.jpg"
                    has_image = os.path.exists(face_image_path)
                    
                    unknown_faces.append({
                        "reid_num": int(reid_num),
                        "name": name,
                        "has_image": has_image,
                        "image_path": face_image_path if has_image else None
                    })
        
        return JSONResponse(content={
            "unknown_faces": unknown_faces,
            "count": len(unknown_faces)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting unknown faces: {str(e)}")

@app.get("/face_image/{reid_num}")
async def get_face_image(reid_num: int):
    """Get the saved face image for a specific ReID number"""
    try:
        face_image_path = f"{face_api.face_img_path}/reid_{reid_num}.jpg"
        
        if not os.path.exists(face_image_path):
            raise HTTPException(status_code=404, detail="Face image not found")
        
        # Read and encode image as base64
        with open(face_image_path, "rb") as image_file:
            image_data = image_file.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        return JSONResponse(content={
            "reid_num": reid_num,
            "image": image_base64,
            "image_path": face_image_path
        })
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Face image not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving face image: {str(e)}")

@app.delete("/remove_face/{reid_num}")
async def remove_face(reid_num: int):
    """Remove a face from the database (for faces that shouldn't be added as students)"""
    try:
        # This would require implementing a delete method in your DatabaseManager
        # For now, we'll just rename it to indicate it's been dismissed
        current_name = f"Unknown_{reid_num}"
        dismissed_name = f"Dismissed_{reid_num}"
        
        success = face_api.db_manager.update_name(reid_num, dismissed_name)
        
        if success:
            # Update in-memory mappings
            for track_id, (name, rid) in face_api.known_faces.items():
                if rid == reid_num:
                    face_api.known_faces[track_id] = (dismissed_name, reid_num)
            
            return JSONResponse(content={
                "success": True,
                "message": f"Face ReID {reid_num} has been dismissed"
            })
        else:
            raise HTTPException(status_code=404, detail=f"ReID {reid_num} not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing face: {str(e)}")

# Update the root endpoint to include new endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Enhanced Face Recognition API with Student Management",
        "version": "2.1",
        "endpoints": {
            "analyze_frame": "/analyze_frame (POST) - Main endpoint with combined functionality",
            "process_frame": "/process_frame (POST) - Legacy tracking endpoint",
            "headcount": "/headcount (POST) - Legacy headcount endpoint",
            "rename": "/rename (POST) - Rename a person",
            "add_student": "/add_student (POST) - Add unknown face as student",
            "unknown_faces": "/unknown_faces (GET) - Get all unknown faces",
            "face_image": "/face_image/{reid_num} (GET) - Get face image",
            "remove_face": "/remove_face/{reid_num} (DELETE) - Dismiss unknown face",
            "status": "/status (GET) - System status",
            "faces": "/faces (GET) - All faces in database"
        },
        "features": [
            "Combined headcount and face recognition",
            "Optional tracking mode",
            "Detailed face information",
            "Real-time processing",
            "Person database management",
            "Student roster management",
            "Unknown face identification and addition"
        ]
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)