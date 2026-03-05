from typing import Any, Dict, List, Optional
from app.core.firebase_admin_sdk import db_admin

class BaseRTDBService:
    """
    Base service for interacting with Firebase Realtime Database.
    """
    def __init__(self, path: str):
        self.path = path
        self.db = db_admin
        self.ref = db_admin.reference(path) if db_admin else None

    def get(self, child_path: str = "") -> Any:
        if not self.ref: return None
        ref = self.ref.child(child_path) if child_path else self.ref
        return ref.get()

    def set(self, data: Any, child_path: str = ""):
        if not self.ref: return
        ref = self.ref.child(child_path) if child_path else self.ref
        ref.set(data)

    def update(self, data: Dict[str, Any], child_path: str = ""):
        if not self.ref: return
        ref = self.ref.child(child_path) if child_path else self.ref
        ref.update(data)

    def push(self, data: Any, child_path: str = "") -> str:
        if not self.ref: return ""
        ref = self.ref.child(child_path) if child_path else self.ref
        new_ref = ref.push(data)
        return new_ref.key

    def remove(self, child_path: str = ""):
        if not self.ref: return
        ref = self.ref.child(child_path) if child_path else self.ref
        ref.delete()

    def list_all(self) -> Dict[str, Any]:
        if not self.ref: return {}
        return self.ref.get() or {}
