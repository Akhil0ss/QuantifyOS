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
            "heartbeat": int(time.time() * 1000),
            "created_at": int(time.time() * 1000)
        }
        return self.push(data)

    def update_status(self, task_id: str, status: str, result: Optional[str] = None):
        data = {"status": status, "heartbeat": int(time.time() * 1000)}
        if result is not None:
            data["result"] = result
        self.update(data, task_id)

    def send_heartbeat(self, task_id: str):
        """Called periodically during execution to prove task is alive."""
        self.update({"heartbeat": int(time.time() * 1000)}, task_id)

    def get_workspace_tasks(self, workspace_id: str) -> List[Dict[str, Any]]:
        all_tasks = self.list_all()
        workspace_tasks = []
        for tid, data in all_tasks.items():
            if data.get("workspace_id") == workspace_id:
                data["id"] = tid
                workspace_tasks.append(data)
        return workspace_tasks

    def get_stalled_tasks(self, timeout_seconds: int = 120) -> List[Dict[str, Any]]:
        """Finds tasks marked 'running' but with no heartbeat for timeout_seconds."""
        all_tasks = self.list_all()
        stalled = []
        now_ms = int(time.time() * 1000)
        cutoff = timeout_seconds * 1000
        
        for tid, data in all_tasks.items():
            if data.get("status") == "running":
                last_beat = data.get("heartbeat", 0)
                if (now_ms - last_beat) > cutoff:
                    data["id"] = tid
                    stalled.append(data)
        return stalled

    async def auto_resume_stalled(self):
        """On startup, find stalled tasks and re-queue them."""
        stalled = self.get_stalled_tasks()
        if stalled:
            print(f"TASK QUEUE: Found {len(stalled)} stalled tasks. Re-queuing...")
            for task in stalled:
                self.update_status(task["id"], "pending", result="Auto-resumed: Task was stalled or server was restarted (Resilience Engine)")
                print(f"  → Re-queued: {task['id']} ({task.get('goal', '')[:50]})")
