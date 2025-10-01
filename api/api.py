import asyncio
import json
import os
import threading
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

# YOLO11 and InsightFace imports
from ultralytics import YOLO
import onnxruntime as ort
import insightface
from insightface.app import FaceAnalysis

# Database and tutor-related imports remain unchanged
from db import DatabaseManager
from apiTutor import (
    test_creator,
    ai_tutor,
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# IoU Tracker class remains the same
class IoUTracker:
    """Ultra-simple IoU tracker. No external deps."""
    def __init__(self, iou_threshold=0.3, max_age=5):
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.tracks = {}
        self._next_id = 0

    @staticmethod
    def _iou(a, b):
        x1 = max(a[0], b[0]); y1 = max(a[1], b[1])
        x2 = min(a[2], b[2]); y2 = min(a[3], b[3])
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        union = (a[2]-a[0])*(a[3]-a[1]) + (b[2]-b[0])*(b[3]-b[1]) - inter
        return inter / (union + 1e-9)

    def update(self, detections):
        for t in self.tracks.values():
            t["age"] += 1

        matched_trk = set(); matched_det = set()
        for did, det in enumerate(detections):
            best_iou, best_tid = self.iou_threshold, None
            for tid, trk in self.tracks.items():
                if tid in matched_trk:
                    continue
                iou = self._iou(det["bbox"], trk["bbox"])
                if iou > best_iou:
                    best_iou, best_tid = iou, tid
            if best_tid is not None:
                matched_trk.add(best_tid); matched_det.add(did)
                trk = self.tracks[best_tid]
                trk["bbox"] = det["bbox"]; trk["age"] = 0
                det["track_id"] = best_tid
                det["reid_num"] = trk.get("reid")
                det["name"] = trk.get("name")

        for did, det in enumerate(detections):
            if did in matched_det:
                continue
            tid = self._next_id; self._next_id += 1
            self.tracks[tid] = {"bbox": det["bbox"], "age": 0,
                               "reid": None, "name": None}
            det["track_id"] = tid

        self.tracks = {tid: trk for tid, trk in self.tracks.items()
                      if trk["age"] < self.max_age}
        return detections


class FaceRecognitionAPI:
    def __init__(self,
                face_img_path="saved_faces",
                similarity_threshold=0.4,
                yolo_model_path="yolov12l-face.pt",  # Path to YOLO11 face model
                use_gpu=True):
        
        os.makedirs(face_img_path, exist_ok=True)
        self.face_img_path = face_img_path
        self.similarity_threshold = similarity_threshold
        self.use_gpu = use_gpu
        self._processing_lock = threading.Lock() # Add this lock

        # Initialize YOLO11 for face detection
        try:
            self.yolo_model = YOLO('yolov12l-face.pt')
            
            # Set device for YOLO
            if self.use_gpu:
                import torch
                if torch.cuda.is_available():
                    self.device = 'cuda'
                    logger.info("YOLO11 using CUDA GPU")
                else:
                    self.device = 'cpu'
                    logger.warning("CUDA not available, YOLO11 falling back to CPU")
            else:
                self.device = 'cpu'
                
        except Exception as e:
            logger.error(f"Error initializing YOLO11: {e}")
            raise

        # Initialize InsightFace with GPU support
        try:
            # Set GPU providers for ONNX Runtime
            providers = ['CPUExecutionProvider']
            if self.use_gpu:
                providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
                # Check if CUDA is available for ONNX Runtime
                available_providers = ort.get_available_providers()
                if 'CUDAExecutionProvider' in available_providers:
                    logger.info("InsightFace using CUDA GPU")
                else:
                    logger.warning("CUDA provider not available for ONNX Runtime, falling back to CPU")
                    providers = ['CPUExecutionProvider']
            
            # Initialize FaceAnalysis
            self.face_app = FaceAnalysis(
                name='buffalo_l',  # Use buffalo_l model for better accuracy
                providers=providers,
                allowed_modules=['detection', 'recognition']
            )
            self.face_app.prepare(ctx_id=0 if self.use_gpu else -1, det_size=(640, 640))
            
            logger.info(f"InsightFace initialized with providers: {providers}")
            
        except Exception as e:
            logger.error(f"Error initializing InsightFace: {e}")
            # Fallback to lighter model if buffalo_l fails
            try:
                self.face_app = FaceAnalysis(
                    name='buffalo_s',
                    providers=providers,
                    allowed_modules=['detection', 'recognition']
                )
                self.face_app.prepare(ctx_id=0 if self.use_gpu else -1, det_size=(640, 640))
                logger.info("Fallback to buffalo_s model successful")
            except Exception as e2:
                logger.error(f"Failed to initialize InsightFace completely: {e2}")
                raise

        # Initialize database manager and load in-memory caches
        self.db_manager = DatabaseManager()
        self.db_manager._connect()
        self.reid_counter = getattr(self, "reid_counter", 0)

        # Synchronous data structures
        self.known_faces = {}
        self.reid_embeddings = {}
        self.tracker = IoUTracker(iou_threshold=0.3, max_age=5)

        # Frame counter
        self.frame_count = 0

        # Load existing embeddings from database
        self._load_existing_embeddings()

        logger.info("Face Recognition API initialized with YOLO11 and InsightFace GPU support")

    def _load_existing_embeddings(self):
        """Load existing face embeddings from ChromaDB"""
        try:
            if not self.db_manager.face_db or self.db_manager.face_db.count() == 0:
                logger.info("No existing embeddings in database")
                return
            
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

    def detect_faces_yolo(self, frame):
        """Detect faces using YOLO11"""
        try:
            # Run YOLO detection
            results = self.yolo_model(frame, device=self.device, conf=0.4)
            
            detections = []
            for r in results:
                boxes = r.boxes
                if boxes is None:
                    continue
                    
                for box in boxes:
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                    
                    # Ensure coordinates are within frame boundaries
                    x1 = max(0, x1)
                    y1 = max(0, y1)
                    x2 = min(frame.shape[1], x2)
                    y2 = min(frame.shape[0], y2)
                    
                    # Extract face crop
                    face_crop = frame[y1:y2, x1:x2].copy()
                    
                    if face_crop.size > 0:
                        detection = {
                            "bbox": (x1, y1, x2, y2),
                            "face_crop": face_crop,
                            "confidence": float(box.conf[0]) if box.conf is not None else 0.99
                        }
                        detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"YOLO face detection error: {e}")
            return []

    def extract_embeddings_insightface(self, frame, detections):
        """Extract face embeddings using InsightFace"""
        try:
            # Use InsightFace to get embeddings for each detection
            for det in detections:
                x1, y1, x2, y2 = det["bbox"]
                face_crop = det["face_crop"]
                
                # Try to get embedding from InsightFace
                try:
                    # InsightFace expects BGR format
                    faces = self.face_app.get(face_crop)
                    
                    if faces and len(faces) > 0:
                        # Use the first face's embedding
                        face = faces[0]
                        det["encoding"] = face.embedding
                    else:
                        # Fallback: try with the full frame at the bbox location
                        faces = self.face_app.get(frame)
                        
                        # Find the face closest to our bbox
                        best_face = None
                        best_overlap = 0
                        
                        for face in faces:
                            face_bbox = face.bbox.astype(int)
                            fx1, fy1, fx2, fy2 = face_bbox
                            
                            # Calculate overlap
                            overlap_x1 = max(x1, fx1)
                            overlap_y1 = max(y1, fy1)
                            overlap_x2 = min(x2, fx2)
                            overlap_y2 = min(y2, fy2)
                            
                            if overlap_x2 > overlap_x1 and overlap_y2 > overlap_y1:
                                overlap_area = (overlap_x2 - overlap_x1) * (overlap_y2 - overlap_y1)
                                if overlap_area > best_overlap:
                                    best_overlap = overlap_area
                                    best_face = face
                        
                        if best_face is not None:
                            det["encoding"] = best_face.embedding
                        else:
                            # Generate a random embedding as fallback
                            det["encoding"] = np.random.randn(512).astype(np.float32)
                            logger.warning(f"Could not extract embedding for face at {det['bbox']}")
                            
                except Exception as e:
                    logger.error(f"Error extracting embedding for single face: {e}")
                    det["encoding"] = np.random.randn(512).astype(np.float32)
                
                # Ensure encoding is normalized
                if "encoding" in det and det["encoding"] is not None:
                    norm = np.linalg.norm(det["encoding"])
                    if norm > 0:
                        det["encoding"] = det["encoding"] / norm
                        
            return detections
            
        except Exception as e:
            logger.error(f"InsightFace embedding extraction error: {e}")
            # Add random embeddings as fallback
            for det in detections:
                if "encoding" not in det:
                    det["encoding"] = np.random.randn(512).astype(np.float32)
            return detections

    def detect_faces(self, frame):
        """Main face detection and embedding extraction pipeline"""
        # Step 1: Detect faces with YOLO11
        detections = self.detect_faces_yolo(frame)
        
        # Step 2: Extract embeddings with InsightFace
        if detections:
            detections = self.extract_embeddings_insightface(frame, detections)
        
        # Add track_id placeholder (will be updated by tracker)
        reid_num = self.db_manager.next_reid_num()
        for det in detections:
            det["track_id"] = reid_num
            
        return detections

    def process_frame_with_info(self, frame, use_tracking=True):
        with self._processing_lock:
            if frame is None:
                return None, {"head_count": 0, "names": [], "face_info": []}
    
            detections = self.detect_faces(frame)
            if use_tracking:
                detections = self.tracker.update(detections)
    
            display_frame = frame.copy()
            face_info, names = [], []
    
            for det in detections:
                track_id = det["track_id"]
                encoding = det.get("encoding")
                face_crop = det["face_crop"]
                confidence = det.get("confidence", 0.99)
    
                if encoding is None:
                    continue
                
                # Check if track already locked to a ReID
                if use_tracking and self.tracker.tracks[track_id].get("reid") is not None:
                    name = self.tracker.tracks[track_id]["name"]
                    reid_num = self.tracker.tracks[track_id]["reid"]
                else:
                    # One-time lookup/creation
                    matching_reid, sim = self._find_matching_reid(encoding)
                    if matching_reid is not None:
                        reid_num = matching_reid
                        name = self.db_manager.reid_name_map.get(f"reid_{reid_num}",
                                                                f"Unknown_{reid_num}")
                    else:
                        reid_num = self.db_manager.next_reid_num()
                        name = f"Unknown_{reid_num}"
                        cv2.imwrite(f"{self.face_img_path}/reid_{reid_num}.jpg", face_crop)
                        self.db_manager.add(embedding=encoding.tolist(),
                                          reid_num=reid_num,
                                          name=name)
                        self.reid_embeddings[reid_num] = encoding
                    
                    # Lock to track
                    if use_tracking:
                        self.tracker.tracks[track_id]["reid"] = reid_num
                        self.tracker.tracks[track_id]["name"] = name
    
                label = f"{name} (ID:{reid_num})"
                color = (0, 255, 0) if not name.startswith("Unknown") else (0, 0, 255)
                status = "recognized" if color == (0, 255, 0) else "unknown"
                names.append(name)
    
                x1, y1, x2, y2 = det["bbox"]
                face_info.append({
                    "detection_id": track_id,
                    "name": name,
                    "reid_num": reid_num,
                    "bbox": [x1, y1, x2, y2],
                    "confidence": float(confidence),
                    "status": status
                })
                
                # Draw bounding box and label
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                label_with_conf = f"{label} ({confidence:.2f})"
                cv2.putText(display_frame, label_with_conf, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
            self.frame_count += 1
            info = {
                "head_count": len(detections),
                "names": list(set(names)),
                "face_info": face_info,
                "tracking_enabled": use_tracking,
                "detector": "YOLO11",
                "recognizer": "InsightFace",
                "gpu_enabled": self.use_gpu
            }
            return display_frame, info

    def _calculate_similarity(self, encoding1, encoding2):
        """Calculate cosine similarity between two encodings"""
        return 1 - cosine(encoding1, encoding2)

    # In api.py FaceRecognitionAPI class
    def _find_matching_reid(self, encoding):
        """Find matching ReID using only ChromaDB."""
        try:
            if not self.db_manager.face_db or self.db_manager.face_db.count() == 0:
                return None, -1
    
            # Query ChromaDB for the closest match
            qr = self.db_manager.face_db.query(
                query_embeddings=[encoding.tolist()],
                n_results=1
            )
    
            ids = qr.get("ids", [[]])[0]
            distances = qr.get("distances")
            if distances is None or not distances or not distances[0]:
                return None, -1
            distances = distances[0]
    
            if ids and distances:
                distance = distances[0]
                # Convert L2 distance to cosine similarity
                similarity = 1 - (distance ** 2) / 2
    
                if similarity > self.similarity_threshold:
                    key = ids[0]
                    reid_num = int(key.split("_")[1])
                    return reid_num, similarity
    
            return None, -1 # Return -1 for similarity if no good match found
    
        except Exception as e:
            logger.error(f"Error in _find_matching_reid: {e}")
            return None, -1

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
        """Merge two ReID numbers"""
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
        gpu_status = "Enabled" if self.use_gpu else "Disabled"
        
        # Check actual GPU availability
        gpu_details = []
        try:
            import torch
            if torch.cuda.is_available():
                gpu_details.append(f"CUDA: {torch.cuda.get_device_name(0)}")
        except:
            pass
            
        if 'CUDAExecutionProvider' in ort.get_available_providers():
            gpu_details.append("ONNX Runtime: CUDA available")
        
        return {
            "known_faces_in_session": len(self.known_faces),
            "total_reid_database": len(self.reid_embeddings),
            "face_detector": "YOLO11",
            "face_recognizer": "InsightFace (buffalo_l/buffalo_s)",
            "similarity_threshold": self.similarity_threshold,
            "face_storage_path": self.face_img_path,
            "gpu_status": gpu_status,
            "gpu_details": gpu_details if gpu_details else ["No GPU detected"],
            "architecture": "Synchronous with GPU acceleration"
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
        """Find potential duplicate ReIDs"""
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
        self.tracker = IoUTracker(iou_threshold=0.3, max_age=5)
        logger.info("Tracker (session cache) reset successfully")


# Pydantic models
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
    ai_message_content = response['messages'][-1].content
    try:
        return json.loads(ai_message_content)
    except json.JSONDecodeError:
        return {"error": "Failed to parse agent's JSON response.", "raw_response": ai_message_content}

# FastAPI Setup
app = FastAPI(title="YOLO11 + InsightFace GPU Face Recognition API", version="5.0-gpu")
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

# Initialize the face recognition API with YOLO11 and InsightFace
face_api = FaceRecognitionAPI(
    face_img_path="saved_faces",
    similarity_threshold=0.4,
    yolo_model_path="yolo12l-face.pt",  # You'll need to download or train this model
    use_gpu=True
)
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
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        import asyncio
        loop = asyncio.get_event_loop()
        processed_frame, face_info = await loop.run_in_executor(
            None, face_api.process_frame_with_info, frame, use_tracking
        )
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
    loop = asyncio.get_event_loop()
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
                
                processed_frame, face_info = await loop.run_in_executor(
                    None, face_api.process_frame_with_info, frame, use_tracking
                )

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