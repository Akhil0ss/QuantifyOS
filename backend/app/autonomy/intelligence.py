import json
import os
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.saas import WorkspaceManager

class IntelligenceEngine:
    """
    Measures and tracks the system's intelligence, performance, and growth.
    """
    METRICS_FILE = "intelligence_metrics.json"
    GROWTH_FILE = "capability_growth.json"
    HISTORY_FILE = "intelligence_history.json"

    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.wm = WorkspaceManager(workspace_id)

    def record_task_result(self, success: bool, execution_time: float, confidence: float = 1.0):
        """Records the outcome of a task execution."""
        metrics = self._get_metrics()
        
        total = metrics.get("tasks_total", 0) + 1
        successful = metrics.get("tasks_successful", 0) + (1 if success else 0)
        
        metrics["tasks_total"] = total
        metrics["tasks_successful"] = successful
        metrics["task_success_rate"] = round(successful / total, 2)
        
        # Rolling average for execution time
        avg_time = metrics.get("avg_execution_time", 0)
        metrics["avg_execution_time"] = round((avg_time * (total - 1) + execution_time) / total, 2)
        
        # Confidence alignment (how close was execution to predicted confidence)
        # Placeholder for complex logic
        metrics["last_updated"] = datetime.now().isoformat()
        
        self._save_metrics(metrics)

    def record_evolution_result(self, success: bool):
        """Records the outcome of an evolution cycle."""
        metrics = self._get_metrics()
        
        total = metrics.get("evolution_total", 0) + 1
        successful = metrics.get("evolution_successful", 0) + (1 if success else 0)
        
        metrics["evolution_total"] = total
        metrics["evolution_successful"] = successful
        metrics["evolution_success_rate"] = round(successful / total, 2)
        
        self._save_metrics(metrics)

    def track_growth(self, capability_count: int, module_count: int, hardware_count: int, protocol_count: int):
        """Updates the system's growth statistics."""
        growth = {
            "total_capabilities": capability_count,
            "total_modules": module_count,
            "hardware_devices": hardware_count,
            "protocols_learned": protocol_count,
            "timestamp": datetime.now().isoformat()
        }
        
        path = self.wm.get_path(self.GROWTH_FILE)
        with open(path, "w") as f:
            json.dump(growth, f, indent=2)
            
        self._take_snapshot()

    def calculate_iq(self) -> int:
        """
        Calculates a global intelligence score (0-100).
        IQ = (SuccessRate * 40) + (CapabilityDensity * 40) + (Reliability * 20)
        """
        metrics = self._get_metrics()
        growth = self._get_growth()
        
        success_factor = metrics.get("task_success_rate", 0) * 40
        
        # Capability density (relative to a target of 100 base capabilities)
        cap_factor = min((growth.get("total_capabilities", 0) / 100) * 40, 40)
        
        # Reliability based on evolution success
        rel_factor = metrics.get("evolution_success_rate", 0) * 20
        
        score = int(success_factor + cap_factor + rel_factor)
        return min(max(score, 0), 100)

    def get_intelligence_status(self) -> Dict[str, Any]:
        """Returns comprehensive intelligence status."""
        score = self.calculate_iq()
        history = self._get_history()
        
        last_score = history[-1]["score"] if history else score
        improvement = score - last_score
        
        return {
            "intelligence_score": score,
            "improvement_delta": improvement,
            "metrics": self._get_metrics(),
            "growth": self._get_growth(),
            "status": "evolving" if improvement >= 0 else "stagnant"
        }

    def _get_metrics(self) -> Dict[str, Any]:
        path = self.wm.get_path(self.METRICS_FILE)
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return {
            "tasks_total": 0,
            "tasks_successful": 0,
            "task_success_rate": 0.0,
            "avg_execution_time": 0.0,
            "evolution_total": 0,
            "evolution_successful": 0,
            "evolution_success_rate": 0.0
        }

    def _save_metrics(self, metrics: Dict[str, Any]):
        path = self.wm.get_path(self.METRICS_FILE)
        with open(path, "w") as f:
            json.dump(metrics, f, indent=2)

    def _get_growth(self) -> Dict[str, Any]:
        path = self.wm.get_path(self.GROWTH_FILE)
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return {}

    def _get_history(self) -> List[Dict[str, Any]]:
        path = self.wm.get_path(self.HISTORY_FILE)
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return []

    def _take_snapshot(self):
        """Takes a periodic snapshot of the intelligence score."""
        score = self.calculate_iq()
        history = self._get_history()
        
        # Only snapshot once per day (simulated here)
        history.append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "score": score
        })
        
        path = self.wm.get_path(self.HISTORY_FILE)
        with open(path, "w") as f:
            json.dump(history[-30:], f, indent=2) # Keep last 30 days
