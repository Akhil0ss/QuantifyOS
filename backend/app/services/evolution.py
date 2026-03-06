from typing import Dict, Any, List
from app.services.base_rtdb import BaseRTDBService
import time
from datetime import datetime

class EvolutionService(BaseRTDBService):
    def __init__(self):
        super().__init__("evolution")

    def log_event(self, workspace_id: str, event_type: str, details: str, result: str = "success", extra: Dict[str, Any] = None):
        event = {
            "type": event_type,
            "details": details,
            "result": result,
            "timestamp": datetime.now().isoformat(),
            "unix_time": int(time.time() * 1000)
        }
        if extra:
            event.update(extra)
        
        # We use a push to create a list of history events
        self.push(event, f"{workspace_id}/history")
        
        # Also update the summary state for this workspace
        state = self.get(f"{workspace_id}/state") or {"daily_count": 0, "failure_count": 0, "last_reset": 0}
        
        # Simple daily reset check
        now = time.time()
        if now - state.get("last_reset", 0) > 86400:
            state["daily_count"] = 0
            state["failure_count"] = 0
            state["last_reset"] = now
            
        if result == "success":
            state["daily_count"] += 1
        else:
            state["failure_count"] += 1
            
        self.set(state, f"{workspace_id}/state")
        
        # Also log to global evolution for the public stats dashboard
        global_log = {
            "type": event_type,
            "workspace_id": workspace_id,
            "timestamp": event["timestamp"]
        }
        self.push(global_log, "global_evolution")

    def get_history(self, workspace_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        history_data = self.get(f"{workspace_id}/history") or {}
        # RTDB push returns a dict of {id: data}, we need to convert to list and sort
        events = list(history_data.values()) if isinstance(history_data, dict) else []
        events.sort(key=lambda x: x.get("unix_time", 0), reverse=True)
        return events[:limit]

    def get_state(self, workspace_id: str) -> Dict[str, Any]:
        return self.get(f"{workspace_id}/state") or {"daily_count": 0, "failure_count": 0, "active": True}

    def get_global_stats(self) -> Dict[str, Any]:
        global_data = self.get("global_evolution") or {}
        events = list(global_data.values()) if isinstance(global_data, dict) else []
        
        stats = {
            "bugsHealed": 0,
            "marketInsights": 0,
            "autonomousUpgrades": 0
        }
        
        for e in events:
            e_type = e.get("type")
            if e_type == "bug_fix": stats["bugsHealed"] += 1
            elif e_type == "market_feature_gap": stats["marketInsights"] += 1
            elif e_type == "autonomous_upgrade": stats["autonomousUpgrades"] += 1
            
        return stats
