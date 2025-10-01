import os
import threading
import chromadb


class DatabaseManager:
    def __init__(self, db_path: str = "./face_data_db") -> None:
        self.db_path = db_path
        self.client = None
        self.face_db = None
        self._reid_counter = 0 # Initialize counter
        self.reid_name_map = {}
        self._lock = threading.Lock()

    def _connect(self) -> None:
        """Establishes connection to ChromaDB database."""
        if self.client is not None:
            return
        try:
            os.makedirs(self.db_path, exist_ok=True)
            self.client = chromadb.PersistentClient(path=self.db_path)
            self.face_db = self.client.get_or_create_collection("face_db")
            self._load_existing()
            print(f"ChromaDB ready")
        except Exception as e:
            print(f"DB failed ({e}) - using memory")

    def _load_existing(self):
        """Load existing face data from database."""
        try:
            if self.face_db:
                result = self.face_db.get(include=["metadatas"])
                ids = result["ids"]
                metadatas = result["metadatas"]

                for i, key in enumerate(ids):
                    name = "Unknown"
                    if metadatas and i < len(metadatas):
                        name = metadatas[i].get("name", f"unknown_{i}") or "Unknown"
                    self.reid_name_map[key] = name
                if self.reid_name_map:
                    # Logic to find the highest existing ID just once on startup
                    nums = [int(k.split("_")[1]) for k in self.reid_name_map if "_" in k]
                    self._reid_counter = max(nums) if nums else 0
                    print(f"Loaded {len(self.reid_name_map)} faces. Next ReID will start from {self._reid_counter + 1}")
        except Exception as e:
            print(f"Loading existing failed: {e}")

    def query(self, embedding, threshold: float = 0.25):
        try:
            with self._lock:
                if not self.face_db or self.face_db.count() == 0:
                    return None, None

                qr = self.face_db.query(query_embeddings=[embedding], n_results=5, include=["metadatas"])
                ids = qr.get("ids", [[]])[0]
                distances = (qr.get("distances") or [[]])[0]
                metadatas_result = qr.get("metadatas", [[]])
                metas = metadatas_result[0] if metadatas_result is not None else []

                candidates = []
                for i, key in enumerate(ids):
                    if i < len(distances) and distances[i] < threshold:
                        reid_val = metas[i].get("reid", key.split("_")[1])
                        try:
                            reid = int(reid_val)
                        except:
                            reid = -1
                        name = metas[i].get("name") or self.reid_name_map.get(key, f"unknown_{reid}")
                        candidates.append((distances[i], reid, name))

                if candidates:
                    candidates.sort(key=lambda x: x[0])
                    return candidates[0][1], candidates[0][2]

                return None, None
        except Exception as e:
            print(f"DB query error: {e}")
            return None, None

    def add(self, embedding, reid_num: int, name: str) -> bool:
        """Add new face to database."""
        key = f"reid_{reid_num}"  # Removed uuid
        try:
            with self._lock:
                if not self.face_db:
                    return False

                self.face_db.add(
                    ids=[key], embeddings=[embedding], metadatas=[{"name": name}]
                )
                self.reid_name_map[key] = name
                return True
        except Exception as e:
            print(f"DB add error: {e}")
            return False

    def update_name(self, reid_num: int, new_name: str) -> bool:
        """Update all entries matching a ReID number."""
        try:
            with self._lock:
                if not self.face_db:
                    print("ERROR: face_db not initialized")
                    return False

                keys_to_update = [k for k in self.reid_name_map if k.startswith(f"reid_{reid_num}")]
                if not keys_to_update:
                    print(f"No keys found for ReID {reid_num}")
                    return False

                for key in keys_to_update:
                    self.face_db.update(ids=[key], metadatas=[{"name": new_name}])
                    self.reid_name_map[key] = new_name

                print(f"Updated ReID {reid_num} name to: {new_name}")
                return True
        except Exception as e:
            print(f"DB update error: {e}")
            return False

    def next_reid_num(self) -> int:
        """Get next available ReID number efficiently."""
        with self._lock:
            self._reid_counter += 1
            return self._reid_counter