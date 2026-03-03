import json
import os
import uuid
import time
from typing import List, Dict, Any, Optional
from app.services.ai_drivers.router import ModelRouter
from app.core.tool_engine import registry
from app.core.saas import WorkspaceManager

class UniversalSolverEngine:
    """
    Level 10+ Autonomy: The "Never Say No" Solver.
    Decomposes any goal and ensures execution via matching or evolution.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str, workspace_id: str = "default"):
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        # SECURITY: Use workspace-scoped paths instead of global files
        self.wm = WorkspaceManager(workspace_id)
        self.index_file = self.wm.get_path("capability_index.json")
        self.log_file = self.wm.get_path("solver_logs.json")

    async def decompose_goal(self, goal: str, context: str = "") -> Dict[str, Any]:
        """
        Structured decomposition into steps with confidence scoring.
        """
        # Load Capability Index for awareness (workspace-scoped)
        capabilities = {}
        if os.path.exists(self.index_file):
            with open(self.index_file, "r") as f:
                capabilities = json.load(f)

        prompt = f"""
        GOAL: {goal}
        CONTEXT: {context}
        CURRENT CAPABILITIES: {json.dumps(list(capabilities.keys()))}

        As a Universal Task Solver, decompose this goal into structured executable steps.
        
        FORMAT: Return a JSON object:
        {{
            "goal": "{goal}",
            "confidence_score": 0.0-1.0,
            "steps": [
                {{
                    "step_id": 1,
                    "description": "Short description",
                    "required_capability": "name_of_capability_or_new",
                    "is_complex": false
                }}
            ],
            "strategic_rationale": "Why this plan will work"
        }}
        """

        response = await self.provider.generate_text(prompt)
        try:
            plan = json.loads(response[response.find('{'):response.rfind('}')+1])
            self._log_solver_event("decomposition", plan)
            return plan
        except Exception as e:
            return {"error": str(e), "steps": []}

    async def solve_recursively(self, step: Dict[str, Any], depth: int = 0) -> List[Dict[str, Any]]:
        """
        If a step is complex, break it down further.
        """
        if not step.get("is_complex") or depth > 3:
            return [step]

        print(f"SOLVER: Recursively decomposing complex step: {step['description']}")
        sub_plan = await self.decompose_goal(f"Sub-goal: {step['description']}", context=f"Parent Goal Part")
        
        all_steps = []
        for sub_step in sub_plan.get("steps", []):
            # Recurse if sub-step is also complex
            final_sub_steps = await self.solve_recursively(sub_step, depth + 1)
            all_steps.extend(final_sub_steps)
        
        return all_steps

    def _log_solver_event(self, event_type: str, data: Any):
        logs = []
        if os.path.exists(self.log_file):
            try:
                with open(self.log_file, "r") as f:
                    logs = json.load(f)
            except: pass
        
        logs.append({
            "timestamp": time.time(),
            "event_type": event_type,
            "workspace_id": self.workspace_id,
            "data": data
        })
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
        with open(self.log_file, "w") as f:
            json.dump(logs, f, indent=2)

if __name__ == "__main__":
    pass
