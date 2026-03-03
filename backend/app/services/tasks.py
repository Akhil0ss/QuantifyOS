from typing import Optional, Dict, Any, List
from app.services.base_rtdb import BaseRTDBService
from firebase_admin import db
import time

class TaskService(BaseRTDBService):
    def __init__(self):
        super().__init__("tasks")

    def create_task(self, workspace_id: str, goal: str) -> str:
        data = {
            "workspace_id": workspace_id,
            "goal": goal,
            "status": "pending",
            "result": None,
            "created_at": int(time.time() * 1000)
        }
        return self.push(data)

    def update_status(self, task_id: str, status: str, result: Optional[str] = None):
        data = {"status": status}
        if result is not None:
            data["result"] = result
        self.update(data, task_id)

    def get_workspace_tasks(self, workspace_id: str) -> List[Dict[str, Any]]:
        all_tasks = self.list_all()
        workspace_tasks = []
        for tid, data in all_tasks.items():
            if data.get("workspace_id") == workspace_id:
                data["id"] = tid
                workspace_tasks.append(data)
        return workspace_tasks
