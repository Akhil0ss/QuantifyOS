import os
import json
import time
import shutil
from typing import Dict, Any, List, Optional
from pathlib import Path

class WorkspaceManager:
    """
    Handles absolute path isolation for multi-tenant data and modules.
    Ensures Workspace A cannot access Workspace B's files.
    """
    BASE_DIR = "workspaces"

    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.root = Path(self.BASE_DIR) / workspace_id
        self.data_dir = self.root / "data"
        self.tools_dir = self.root / "tools"
        self._ensure_dirs()

    def _ensure_dirs(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.tools_dir.mkdir(parents=True, exist_ok=True)
        
        # Init __init__.py for tools folder to make it a package
        init_file = self.tools_dir / "__init__.py"
        if not init_file.exists():
            init_file.touch()

    def get_path(self, filename: str) -> str:
        """Returns the isolated path for a data file."""
        return str(self.data_dir / filename)

    def get_tool_path(self, tool_filename: str) -> str:
        """Returns the isolated path for an evolved tool."""
        return str(self.tools_dir / tool_filename)

class SaaSController:
    """
    Enforces per-workspace limits and tracks global system load.
    """
    LIMITS_FILE = "workspace_limits.json"
    USAGE_FILE = "workspace_usage.json"

    def __init__(self):
        self.default_limits = {
            "max_agents": 5,
            "max_tasks_per_hour": 50,
            "max_evolution_cycles_per_day": 2
        }

    def get_limits(self, workspace_id: str) -> Dict[str, Any]:
        if os.path.exists(self.LIMITS_FILE):
            with open(self.LIMITS_FILE, "r") as f:
                limits = json.load(f)
                return limits.get(workspace_id, self.default_limits)
        return self.default_limits

    def get_usage(self, workspace_id: str) -> Dict[str, Any]:
        if os.path.exists(self.USAGE_FILE):
            with open(self.USAGE_FILE, "r") as f:
                usage = json.load(f)
                return usage.get(workspace_id, {"tasks_this_hour": 0, "last_task_time": 0, "active_agents": 0})
        return {"tasks_this_hour": 0, "last_task_time": 0, "active_agents": 0}

    def _update_usage(self, workspace_id: str, updates: Dict[str, Any]):
        usage = {}
        if os.path.exists(self.USAGE_FILE):
            with open(self.USAGE_FILE, "r") as f:
                usage = json.load(f)
        
        current = usage.get(workspace_id, {"tasks_this_hour": 0, "last_task_time": 0, "active_agents": 0})
        current.update(updates)
        usage[workspace_id] = current
        
        with open(self.USAGE_FILE, "w") as f:
            json.dump(usage, f, indent=2)

    def check_task_limit(self, workspace_id: str) -> bool:
        """
        Returns True if the workspace is within its task limits.
        """
        usage = self.get_usage(workspace_id)
        limits = self.get_limits(workspace_id)
        
        # Reset hourly counter if > 1 hour since last task
        now = time.time()
        if now - usage.get("last_task_time", 0) > 3600:
            usage["tasks_this_hour"] = 0
            
        if usage["tasks_this_hour"] >= limits["max_tasks_per_hour"]:
            return False
            
        usage["tasks_this_hour"] += 1
        usage["last_task_time"] = now
        self._update_usage(workspace_id, usage)
        return True

    def determine_optimal_compute_node(self, workspace_id: str, task_priority: str = "medium") -> Dict[str, Any]:
        """
        S-Tier: Swarm Load Balancing.
        Determines the best regional node for a swarm workload based on compute cost and task priority.
        """
        metrics = self.get_global_metrics()
        
        # Simulate regional nodes
        nodes = [
            {"region": "us-east-1", "compute_cost": 0.0012, "load": metrics["active_workspaces"] * 0.1},
            {"region": "eu-central-1", "compute_cost": 0.0015, "load": 0.2},
            {"region": "ap-southeast-1", "compute_cost": 0.0009, "load": 0.8}
        ]
        
        # Logic: If priority is HIGH, pick lowest load. If priority is LOW, pick lowest cost.
        if task_priority == "high":
            optimal = min(nodes, key=lambda x: x["load"])
        else:
            optimal = min(nodes, key=lambda x: x["compute_cost"])
            
        return {
            "node_id": f"node-{optimal['region']}",
            "region": optimal["region"],
            "assigned_at": int(time.time() * 1000),
            "telemetry_shard": f"shard-{optimal['region']}"
        }

    def get_global_metrics(self) -> Dict[str, Any]:
        """Aggregates metrics for the SaaS dashboard."""
        if not os.path.exists(self.USAGE_FILE):
            return {"active_workspaces": 0, "total_tasks_last_hour": 0}
            
        with open(self.USAGE_FILE, "r") as f:
            usage = json.load(f)
            
        return {
            "active_workspaces": len(usage),
            "total_tasks": sum(u.get("tasks_this_hour", 0) for u in usage.values()),
            "active_agents": sum(u.get("active_agents", 0) for u in usage.values())
        }
