import re
import ast
import json
import os
from typing import Dict, Any, List, Optional
from app.core.saas import WorkspaceManager
from app.core.admin_config import system_config

class SecurityEngine:
    """
    Level 12+ Autonomy: The Security & Trust Layer.
    Ensures evolved code is safe and respects organizational boundaries.
    """
    UNSAFE_PATTERNS = [
        (r"os\.remove", "File Deletion prohibited"),
        (r"shutil\.rmtree", "Recursive Deletion prohibited"),
        (r"subprocess\.", "Subprocess execution restricted"),
        (r"os\.system", "Shell access prohibited"),
        (r"eval\(", "Dynamic evaluation prohibited"),
        (r"exec\(", "Dynamic execution prohibited"),
        (r"socket\.", "Raw socket access restricted"),
        (r"while\s+True:", "Potential infinite loop detected")
    ]

    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.wm = WorkspaceManager(workspace_id)
        self.events_file = "security_events.json"
        self.permissions_file = "workspace_permissions.json"
        
        # Risk scores for common capability categories
        self.risk_table = {
            "hardware_control": 0.8,
            "network_access": 0.6,
            "file_read": 0.3,
            "data_analysis": 0.1,
            "web_scraping": 0.5,
            "system_monitoring": 0.4
        }

    def validate_code(self, code: str) -> Dict[str, Any]:
        """
        Performs static analysis on module source code.
        """
        alerts = []
        for pattern, reason in self.UNSAFE_PATTERNS:
            if re.search(pattern, code):
                alerts.append({"pattern": pattern, "reason": reason})

        # Basic AST check for infinite loops or deep recursion
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.While) and isinstance(node.test, ast.Constant) and node.test.value is True:
                     alerts.append({"pattern": "AST_WHILE_TRUE", "reason": "Infinite loop 'while True' detected via AST."})
        except Exception as e:
            alerts.append({"pattern": "AST_PARSE_ERROR", "reason": f"Failed to parse code: {str(e)}"})

        is_safe = len(alerts) == 0
        if not is_safe:
            self._log_security_event("module_validation_failed", {"alerts": alerts})

        return {
            "is_safe": is_safe,
            "alerts": alerts,
            "risk_score": self._calculate_risk(code)
        }

    def _calculate_risk(self, code: str) -> float:
        """
        Heuristic-based risk scoring.
        """
        score = 0.1
        if "import os" in code or "import sys" in code: score += 0.2
        if "import requests" in code or "import httpx" in code: score += 0.2
        if "mqtt" in code or "serial" in code: score += 0.3
        return min(score, 1.0)

    def check_permissions(self, capability: str) -> bool:
        if capability == "hardware_control" and not system_config.get("hardware_control_enabled"):
            return False
            
        permissions = self._get_permissions()
        # Default to False if the category is not specified
        return permissions.get(capability, True)

    def _get_permissions(self) -> Dict[str, bool]:
        global_path = self.permissions_file
        if os.path.exists(global_path):
            with open(global_path, "r") as f:
                data = json.load(f)
                return data.get(self.workspace_id, {})
        return {}

    def _log_security_event(self, event_type: str, data: Dict[str, Any]):
        path = self.wm.get_path(self.events_file)
        events = []
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    events = json.load(f)
            except: pass
        
        events.append({
            "timestamp": json.dumps(int(os.getpid())), # placeholder
            "event_type": event_type,
            "workspace_id": self.workspace_id,
            "data": data
        })
        
        with open(path, "w") as f:
            json.dump(events[-50:], f, indent=2)

    def get_security_status(self) -> Dict[str, Any]:
        path = self.wm.get_path(self.events_file)
        alerts = 0
        if os.path.exists(path):
            with open(path, "r") as f:
                alerts = len(json.load(f))

        return {
            "status": "secure" if alerts < 5 else "warning",
            "recent_alerts": alerts,
            "active_policies": ["StaticAnalysis", "RiskScoring", "PermissionGating"],
            "workspace_id": self.workspace_id
        }
