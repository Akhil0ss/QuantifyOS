import time
import uuid
from typing import Dict, Any, List
from app.services.base_rtdb import BaseRTDBService

class TelemetryService(BaseRTDBService):
    """
    Handles granular execution traces, thought processes, and system logs.
    """
    def __init__(self):
        super().__init__("telemetry")

    def log_process(self, workspace_id: str, task_id: str, action: str, details: Any, category: str = "execution"):
        """
        category: 'thought', 'tool_call', 'tool_result', 'system', 'error'
        """
        log_id = str(uuid.uuid4())
        
        # We store nested objects inside the trace string for the frontend to parse
        log_entry = {
            "id": log_id,
            "task_id": task_id,
            "action": action,
            "details": details,
            "category": category,
            "timestamp": int(time.time() * 1000)
        }
        
        # Save to /telemetry/{workspace_id}/tasks/{task_id}/{log_id}
        self.set(log_entry, f"{workspace_id}/tasks/{task_id}/{log_id}")

    def get_task_traces(self, workspace_id: str, task_id: str) -> List[Dict[str, Any]]:
        traces = self.get(f"{workspace_id}/tasks/{task_id}")
        if not traces:
            return []
            
        traces_list = list(traces.values())
        return sorted(traces_list, key=lambda x: x.get("timestamp", 0))

    def log_system_event(self, workspace_id: str, source: str, message: str, level: str = "info"):
        log_id = str(uuid.uuid4())
        log_entry = {
            "id": log_id,
            "source": source,
            "message": message,
            "level": level,
            "timestamp": int(time.time() * 1000)
        }
        self.set(log_entry, f"{workspace_id}/system/{log_id}")

    def get_system_logs(self, workspace_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        logs = self.get(f"{workspace_id}/system")
        if not logs:
            return []
            
        logs_list = list(logs.values())
        logs_list = sorted(logs_list, key=lambda x: x.get("timestamp", 0), reverse=True)
        return logs_list[:limit]
