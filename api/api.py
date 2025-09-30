import json
import os
import time
import cv2
import numpy as np
import base64
import uuid
from pydantic import BaseModel
import requests
import logging
from tqdm import tqdm
from scipy.spatial.distance import cosine
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# New import for face_recognition
import face_recognition

# Database and tutor-related imports remain unchanged
from db import DatabaseManager
from apiTutor import (
    test_creator,
    ai_tutor,
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FaceRecognitionAPI:
    def __init__(self,
                 face_img_path="saved_faces",
                 similarity_threshold=0.4,  # Lower = more strict, Higher = more lenient
                 ):
        os.makedirs(face_img_path, exist_ok=True)
        self.face_img_path = face_img_path
        self.similarity_threshold = similarity_threshold

        # Initialize database manager and load in-memory caches
        self.db_manager = DatabaseManager()
        self.db_manager._connect()

        # Synchronous data structures
        self.known_faces = {}  # track_id -> (name, reid_num, encoding)
        self.reid_embeddings = {}  # reid_num -> encoding

        # Frame counter (optional - kept for compatibility with original code)
        self.frame_count = 0

        # Load existing embeddings from database
        self._load_existing_embeddings()

        logger.info("Face Recognition API initialized with face_recognition library.")

    def _load_existing_embeddings(self):
        """Load existing face embeddings from ChromaDB"""
        try:
            if not self.db_manager.face_db or self.db_manager.face_db.count() == 0:
                logger.info("No existing embeddings in database")
                return
            
            # Get all embeddings from ChromaDB
            result = self.db_manager.face_db.get(include=["embeddings", "metadatas"])
            ids = result.get("ids", [])
            embeddings = result.get("embeddings", [])
            metadatas = result.get("metadatas", [])
            
            for i, key in enumerate(ids):
                try:
                    reid_num = int(key.split("_")[1]) if "_" in key else int(key)
                    if embeddings is not None and i < len(embeddings) and embeddings[i] is not None:
                        self.reid_embeddings[reid_num] = np.array(embeddings[i])
                except (ValueError, IndexError) as e:
                    logger.error(f"Error loading embedding for {key}: {e}")
                    continue
            
            logger.info(f"Loaded {len(self.reid_embeddings)} existing face embeddings from ChromaDB")
        except Exception as e:
            logger.error(f"Error loading existing embeddings: {e}")

    def _calculate_similarity(self, encoding1, encoding2):
        """Calculate cosine similarity between two encodings"""
        return 1 - cosine(encoding1, encoding2)

    def _find_matching_reid(self, encoding):
        """Find matching ReID using ChromaDB and in-memory cache"""
        try:
            # First try ChromaDB query (if available and populated)
            if self.db_manager.face_db and self.db_manager.face_db.count() > 0:
                chroma_threshold = (2 - 2 * self.similarity_threshold) ** 0.5
                
                qr = self.db_manager.face_db.query(
                    query_embeddings=[encoding.tolist()],
                    n_results=1
                )
                
                ids = qr.get("ids", [[]])[0]
                distances = qr.get("distances", [[]])
                if distances is not None and len(distances) > 0:
                    distances = distances[0]
                else:
                    distances = []

                if ids and distances:
                    distance = distances[0]
                    similarity = 1 - (distance ** 2) / 2
                    
                    if similarity > self.similarity_threshold:
                        key = ids[0]
                        reid_num = int(key.split("_")[1]) if "_" in key else int(key)
                        return reid_num, similarity
            
            # Fallback to check in-memory embeddings for this session
            best_match_reid = None
            best_similarity = -1
            
            for reid_num, stored_encoding in self.reid_embeddings.items():
                similarity = self._calculate_similarity(encoding, stored_encoding)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match_reid = reid_num
            
            if best_similarity > self.similarity_threshold:
                return best_match_reid, best_similarity
            
            return None, best_similarity
            
        except Exception as e:
            logger.error(f"Error in _find_matching_reid: {e}")
            return None, -1

    def detect_faces(self, frame):
        """
        Detect faces in the frame using the face_recognition library.
        Returns a list of detections containing bbox, encoding, face_crop, and a unique track_id.
        """
        try:
            # face_recognition uses (top, right, bottom, left)
            face_locations = face_recognition.face_locations(frame)
            encodings = face_recognition.face_encodings(frame, face_locations)
            
            detections = []
            for i, ((top, right, bottom, left), encoding) in enumerate(zip(face_locations, encodings)):
                face_crop = frame[top:bottom, left:right].copy()
                detections.append({
                    "bbox": (left, top, right, bottom),  # Converted to (x1, y1, x2, y2)
                    "encoding": encoding,
                    "face_crop": face_crop,
                    "track_id": i
                })
            return detections
        except Exception as e:
            logger.error(f"Face detection error using face_recognition: {e}")
            return []

    def recognize_faces_sync(self, detections):
        """Synchronously recognize faces from detections using face_recognition encodings"""
        names = []
        for detection in detections:
            track_id = detection["track_id"]
            try:
                encoding = detection["encoding"]
                face_crop = detection.get("face_crop")
                matching_reid, similarity = self._find_matching_reid(encoding)
                
                if matching_reid is not None:
                    key = f"reid_{matching_reid}"
                    name = self.db_manager.reid_name_map.get(key, f"Unknown_{matching_reid}")
                    names.append(name)
                else:
                    # Handle a completely new face
                    reid_num = self.db_manager.next_reid_num()
                    name = f"Unknown_{reid_num}"
                    
                    if face_crop is not None:
                        cv2.imwrite(f"{self.face_img_path}/reid_{reid_num}.jpg", face_crop)
                    
                    success = self.db_manager.add(
                        embedding=encoding.tolist(),
                        reid_num=reid_num,
                        name=name
                    )
                    
                    if success:
                        self.reid_embeddings[reid_num] = encoding
                        self.known_faces[track_id] = (name, reid_num, encoding)
                        logger.info(f"Added new face for detection {track_id}: ReID {reid_num} (sim: {similarity:.3f})")
                    else:
                        self.known_faces[track_id] = ("Unknown", None, None)
                        logger.error(f"Failed to add face to database for detection {track_id}")
            except Exception as e:
                logger.error(f"Sync recognition error: {e}")
                names.append("Unknown")
        return names

    def process_frame_with_info(self, frame, use_tracking=True):
        """
        Process a frame using face_recognition. If use_tracking is True, the recognized face data
        is cached for the session. In this simplified version, detection is performed every time.
        """
        if frame is None:
            return None, {"head_count": 0, "names": [], "face_info": []}

        # Detect faces using face_recognition
        detections = self.detect_faces(frame)

        display_frame = frame.copy()
        face_info = []
        names = []

        # In this version, both 'tracking' and non-tracking modes perform similar detection.
        # When use_tracking is True, we attempt to cache the recognized face for each detection.
        for detection in detections:
            track_id = detection["track_id"]
            encoding = detection["encoding"]
            face_crop = detection["face_crop"]

            # If tracking mode and face not already recognized, detect and store mapping
            if use_tracking and track_id not in self.known_faces:
                matching_reid, similarity = self._find_matching_reid(encoding)
                if matching_reid is not None:
                    key = f"reid_{matching_reid}"
                    name = self.db_manager.reid_name_map.get(key, f"Unknown_{matching_reid}")
                    self.known_faces[track_id] = (name, matching_reid, encoding)
                    logger.info(f"Matched detection {track_id} to existing ReID {matching_reid} (sim: {similarity:.3f})")
                else:
                    reid_num = self.db_manager.next_reid_num()
                    name = f"Unknown_{reid_num}"
                    cv2.imwrite(f"{self.face_img_path}/reid_{reid_num}.jpg", face_crop)
                    
                    success = self.db_manager.add(
                        embedding=encoding.tolist(),
                        reid_num=reid_num,
                        name=name
                    )
                    
                    if success:
                        self.reid_embeddings[reid_num] = encoding
                        self.known_faces[track_id] = (name, reid_num, encoding)
                        logger.info(f"Added new face for detection {track_id}: ReID {reid_num} (sim: {similarity:.3f})")
                    else:
                        self.known_faces[track_id] = ("Unknown", None, None)
                        logger.error(f"Failed to add face to database for detection {track_id}")

            # Build response using either cached or fresh recognition
            if track_id in self.known_faces:
                name, reid_num, _ = self.known_faces[track_id]
                if name != "Unknown":
                    label = f"{name} (ID:{reid_num})"
                    color = (0, 255, 0)
                    names.append(name)
                    status = "recognized"
                else:
                    label, color, status = "Unknown", (0, 0, 255), "unknown"
                    names.append("Unknown")
            else:
                name, reid_num = "Unknown", None
                label, color, status = "Unknown", (0, 0, 255), "unknown"
                names.append("Unknown")

            x1, y1, x2, y2 = detection["bbox"]
            face_info.append({
                "detection_id": track_id, "name": name, "reid_num": reid_num,
                "bbox": [x1, y1, x2, y2], "confidence": None, "status": status,
            })

            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                display_frame, label, (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2
            )

        self.frame_count += 1
        info = {
            "head_count": len(detections),
            "names": list(set(names)),
            "face_info": face_info,
            "tracking_enabled": use_tracking,
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
            for track_id, (_, rid, emb) in self.known_faces.items():
                if rid == reid_num:
                    self.known_faces[track_id] = (new_name, reid_num, emb)
            return True, f"Renamed ReID {reid_num} to {new_name}"
        return False, f"Failed to rename ReID {reid_num}"
    
    def merge_reid(self, source_reid_num, target_reid_num):
        """Merge two ReID numbers (for handling duplicates)"""
        try:
            source_reid_num = int(source_reid_num)
            target_reid_num = int(target_reid_num)
        except (ValueError, TypeError):
            return False, "Invalid ReID numbers"
        
        if source_reid_num == target_reid_num:
            return False, "Source and target ReID cannot be the same"
        
        source_key = f"reid_{source_reid_num}"
        target_key = f"reid_{target_reid_num}"
        
        if source_key not in self.db_manager.reid_name_map:
            return False, f"Source ReID {source_reid_num} not found"
        if target_key not in self.db_manager.reid_name_map:
            return False, f"Target ReID {target_reid_num} not found"
        
        target_name = self.db_manager.reid_name_map[target_key]
        success = self.db_manager.update_name(source_reid_num, f"Merged_to_{target_reid_num}")
    
        if success:
            for track_id, (name, rid, emb) in list(self.known_faces.items()):
                if rid == source_reid_num:
                    self.known_faces[track_id] = (target_name, target_reid_num, emb)
            
            if source_reid_num in self.reid_embeddings:
                del self.reid_embeddings[source_reid_num]
            
            return True, f"Merged ReID {source_reid_num} into {target_reid_num}"
        
        return False, f"Failed to merge ReID {source_reid_num}"

    def get_status(self):
        """Get system status"""
        return {
            "known_faces_in_session": len(self.known_faces),
            "total_reid_database": len(self.reid_embeddings),
            "processing_tasks": 0,
            "encoding_queue_size": 0,
            "result_queue_size": 0,
            "face_detector": "face_recognition (HOG/CNN based)",
            "similarity_threshold": self.similarity_threshold,
            "face_storage_path": self.face_img_path,
            "architecture": "Synchronous"
        }

    def get_all_faces(self):
        """Get all faces from database"""
        faces = []
        if not (hasattr(self.db_manager, "reid_name_map") and self.db_manager.reid_name_map):
            return []
        items = list(self.db_manager.reid_name_map.items())

        for key, name in items:
            try:
                reid_num = key.split("_")[1] if "_" in key else key
                faces.append({"reid_num": int(reid_num), "name": name})
            except (ValueError, IndexError) as e:
                logger.error(f"Could not parse reid_num from key '{key}': {e}")
                continue
        return faces
    
    def find_potential_duplicates(self, similarity_threshold=None):
        """Find potential duplicate ReIDs based on embedding similarity"""
        if similarity_threshold is None:
            similarity_threshold = self.similarity_threshold + 0.1
            
        duplicates = []
        reid_list = list(self.reid_embeddings.items())
        
        for i in range(len(reid_list)):
            for j in range(i + 1, len(reid_list)):
                reid1, enc1 = reid_list[i]
                reid2, enc2 = reid_list[j]
                
                similarity = self._calculate_similarity(enc1, enc2)
                
                if similarity > similarity_threshold:
                    name1 = self.db_manager.reid_name_map.get(f"reid_{reid1}", "Unknown")
                    name2 = self.db_manager.reid_name_map.get(f"reid_{reid2}", "Unknown")
                
                    duplicates.append({
                        "reid1": reid1, "name1": name1,
                        "reid2": reid2, "name2": name2,
                        "similarity": float(similarity)
                    })
        
        duplicates.sort(key=lambda x: x["similarity"], reverse=True)
        return duplicates

    def reset_tracker(self):
        """Reset the session cache for detected faces"""
        self.frame_count = 0
        self.known_faces.clear()
        logger.info("Tracker (session cache) reset successfully")

class TutorRequest(BaseModel):
    topic: str
    thread_id: str | None = None

class TestRequest(BaseModel):
    thread_id: str
    prompt: str = "Yes, please create a test."

def get_agent_response(agent, message, thread_id):
    """Helper function to invoke an agent and parse its JSON response."""
    config = {"configurable": {"thread_id": thread_id}}
    response = agent.invoke({"messages": [("user", message)]}, config)
    # The response content is in the 'messages' list, typically the last one from the assistant
    ai_message_content = response['messages'][-1].content
    try:
        # The agent should respond with a JSON string, so we parse it
        return json.loads(ai_message_content)
    except json.JSONDecodeError:
        # If parsing fails, return the raw content with an error message
        return {"error": "Failed to parse agent's JSON response.", "raw_response": ai_message_content}

# --- FastAPI Setup ---
app = FastAPI(title="face_recognition Face Recognition API (Synchronous)", version="4.0-sync")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def image_to_base64(image):
    _, buffer = cv2.imencode(".jpg", image)
    return base64.b64encode(buffer.tobytes()).decode("utf-8")

# Initialize the face recognition API with face_recognition backend
face_api = FaceRecognitionAPI(face_img_path="saved_faces", similarity_threshold=0.4)

@app.post("/explain")
def explain_topic(request: TutorRequest):
    """
    Endpoint to get an explanation for a given topic.
    Creates a new conversation thread if no thread_id is provided.
    """
    thread_id = request.thread_id or str(uuid.uuid4())
    response_data = get_agent_response(ai_tutor, request.topic, thread_id)
    return {"thread_id": thread_id, "response": response_data}

@app.post("/create_test")
def create_test(request: TestRequest):
    """
    Endpoint to create a test based on the conversation in the given thread.
    """
    response_data = get_agent_response(test_creator, request.prompt, request.thread_id)
    return {"thread_id": request.thread_id, "response": response_data}

@app.post("/analyze_frame")
async def analyze_frame(file: UploadFile = File(...), use_tracking: bool = Form(True)):
    """Analyze a frame using face_recognition"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        processed_frame, face_info = face_api.process_frame_with_info(frame, use_tracking)
        img_base64 = image_to_base64(processed_frame) if processed_frame is not None else None

        return JSONResponse(content={
            "image": img_base64,
            "head_count": face_info["head_count"],
            "names": face_info["names"],
            "face_info": face_info["face_info"],
            "tracking_enabled": face_info["tracking_enabled"],
            "message": f"Successfully analyzed frame with {face_info['head_count']} faces detected",
        })
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing frame: {str(e)}")

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
    """Get all unknown/unidentified faces"""
    try:
        all_faces = face_api.get_all_faces()
        unknown_faces_list = []
        for face in all_faces:
            if face["name"].startswith("Unknown_"):
                reid_num = face["reid_num"]
                face_image_path = f"{face_api.face_img_path}/reid_{reid_num}.jpg"
                has_image = os.path.exists(face_image_path)
                unknown_faces_list.append({
                    "reid_num": reid_num,
                    "name": face["name"],
                    "has_image": has_image,
                })
        return JSONResponse(content={
            "unknown_faces": unknown_faces_list,
            "count": len(unknown_faces_list),
        })
    except Exception as e:
        logger.error(f"Error getting unknown faces: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting unknown faces: {str(e)}")

@app.get("/face_image/{reid_num}")
async def get_face_image(reid_num: int):
    """Get saved face image for a ReID number"""
    face_image_path = f"{face_api.face_img_path}/reid_{reid_num}.jpg"
    if not os.path.exists(face_image_path):
        raise HTTPException(status_code=404, detail="Face image not found")
    with open(face_image_path, "rb") as image_file:
        image_data = image_file.read()
    image_base64 = base64.b64encode(image_data).decode("utf-8")
    return JSONResponse(content={"reid_num": reid_num, "image": image_base64})

@app.post("/add_student")
async def add_student(reid_num: str = Form(...), student_name: str = Form(...)):
    """Rename an 'Unknown' face to a student's name"""
    success, message = face_api.rename_person(reid_num, student_name)
    if not success:
        if "Invalid" in message or "empty" in message:
            raise HTTPException(status_code=400, detail=message)
        raise HTTPException(status_code=500, detail=message)
    return JSONResponse(content={
        "success": True,
        "message": f"Successfully added {student_name} (ReID: {reid_num})",
    })

@app.delete("/remove_face/{reid_num}")
async def remove_face(reid_num: int):
    """Remove a face by renaming it to 'Dismissed'"""
    success, message = face_api.rename_person(reid_num, f"Dismissed_{reid_num}")
    if not success:
        raise HTTPException(status_code=404, detail=f"ReID {reid_num} not found")
    return JSONResponse(content={
        "success": True,
        "message": f"Face ReID {reid_num} has been dismissed.",
    })

@app.websocket("/ws/analyze")
async def websocket_analyze_frame(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket client connected.")
    try:
        while True:
            data = await websocket.receive_json()
            image_b64 = data.get("image")
            use_tracking = data.get("use_tracking", True)

            if not image_b64:
                await websocket.send_json({"error": "No image data provided."})
                continue
            
            try:
                img_bytes = base64.b64decode(image_b64)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    await websocket.send_json({"error": "Invalid image data."})
                    continue
                
                processed_frame, face_info = face_api.process_frame_with_info(frame, use_tracking)

                processed_image_b64 = image_to_base64(processed_frame) if processed_frame is not None else None
                
                await websocket.send_json({
                    "image": processed_image_b64,
                    "head_count": face_info["head_count"],
                    "names": face_info["names"],
                    "face_info": face_info["face_info"],
                    "tracking_enabled": face_info["tracking_enabled"],
                })
            
            except (ValueError, TypeError) as e:
                logger.error(f"Error decoding base64 image: {e}")
                await websocket.send_json({"error": "Base64 decoding failed."})
            except Exception as e:
                logger.error(f"Error during frame processing: {e}")
                await websocket.send_json({"error": f"An unexpected error occurred: {str(e)}"})

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"An unexpected error occurred in the WebSocket handler: {e}")
        await websocket.close(code=1011, reason="Server error")

@app.post("/merge_reid")
async def merge_reid(source_reid: int = Form(...), target_reid: int = Form(...)):
    """Merge two ReID numbers (source becomes target)"""
    success, message = face_api.merge_reid(source_reid, target_reid)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return JSONResponse(content={
        "success": True,
        "message": message
    })

@app.get("/roster")
async def get_roster():
    """Get the list of all known/enrolled students."""
    try:
        all_faces = face_api.get_all_faces()
        student_roster = [
            face for face in all_faces
            if not face["name"].startswith("Unknown_") and not face["name"].startswith("Dismissed_")
        ]
        return JSONResponse(content={"roster": student_roster})
    except Exception as e:
        logger.error(f"Error getting roster: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting roster: {str(e)}")

@app.post("/reset_tracker")
async def reset_tracker():
    """Reset the session cache for face recognition"""
    try:
        face_api.reset_tracker()
        return JSONResponse(content={
            "success": True,
            "message": "Tracker reset successfully"
        })
    except Exception as e:
        logger.error(f"Error resetting tracker: {e}")
        raise HTTPException(status_code=500, detail=f"Error resetting tracker: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "face_recognition Face Recognition API (Synchronous)",
        "version": "4.0-sync",
        "warning": "This synchronous version is NOT recommended for real-time video streams due to performance bottlenecks."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)