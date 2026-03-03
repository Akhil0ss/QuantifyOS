import json
import os
from datetime import datetime
from typing import List, Dict, Any
from app.services.tasks import TaskService
from app.services.telemetry import TelemetryService
from app.services.ai_drivers.router import ModelRouter
from app.services.entities import ConfigService
from app.core.saas import WorkspaceManager

class MonitoringEngine:
    """
    Strategic Monitoring: Analyzes system logs, task outcomes, and business objectives.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str):
        self.task_service = TaskService()
        self.telemetry = TelemetryService()
        self.config_service = ConfigService()
        self.user_id = user_id
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        
        # Isolated path management
        self.wm = WorkspaceManager("default") # Placeholder, will be updated in analyze_gaps
        self.gaps_file = "evolution_gaps.json"
        self.index_file = "capability_index.json"
        self.intel_file = "evolution_intelligence.json"
        self.reliability_file = "capability_reliability.json"
        self.trends_file = "trend_scores.json"

    def _get_capability_index(self, workspace_id: str) -> Dict[str, bool]:
        wm = WorkspaceManager(workspace_id)
        path = wm.get_path(self.index_file)
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return {}

    async def analyze_gaps(self, workspace_id: str) -> List[Dict[str, Any]]:
        """
        Scans tasks and aligns them with Business Objectives for strategic prioritization.
        """
        print(f"STRATEGIC MONITOR: Analyzing gaps for {workspace_id}...")
        
        # 1. Gather Context
        wm = WorkspaceManager(workspace_id)
        tasks = self.task_service.get_workspace_tasks(workspace_id)
        business_config = self.config_service.get_business_config(self.user_id) or {}
        capability_index = self._get_capability_index(workspace_id)
        
        # Load reliability metrics
        reliability = {}
        rel_path = wm.get_path(self.reliability_file)
        if os.path.exists(rel_path):
            with open(rel_path, "r") as f:
                reliability = json.load(f)
        
        # Load trend scores
        trends = {}
        trends_path = wm.get_path(self.trends_file)
        if os.path.exists(trends_path):
            with open(trends_path, "r") as f:
                trends = json.load(f)

        failed_tasks = [t for t in tasks if t.get("status") == "failed"]
        goals = [t.get("goal") for t in tasks]
        
        # Aggregate traces for failures
        traces_summary = []
        for task in failed_tasks:
            traces = self.telemetry.get_task_traces(workspace_id, task["id"])
            error_logs = [t for t in traces if t.get("category") == "error"]
            traces_summary.append({
                "goal": task["goal"],
                "errors": [e.get("action", "unknown error") for e in error_logs]
            })

        # 2. Strategic Scoring PROMPT
        prompt = f"""
        Analyze these system gaps through a "Strategic Intelligence" lens.
        
        BUSINESS PROFILE:
        - Industry: {business_config.get('industry')}
        - Primary Directive: {business_config.get('primary_directive')}
        - OKRs: {business_config.get('okrs')}
        
        CURRENT CAPABILITIES & RELIABILITY:
        INDEX: {json.dumps(capability_index, indent=2)}
        RELIABILITY: {json.dumps(reliability, indent=2)}
        TECHNOLOGY TRENDS: {json.dumps(trends, indent=2)}
        
        FAILED TASKS & ERRORS:
        {json.dumps(traces_summary, indent=2)}
        
        Your task is to identify and SCORE the top 2 capability gaps based on:
        1. Strategic Alignment (How much does this help the Primary Directive?)
        2. Task Frequency (How often is this goal attempted?)
        3. Failure Impact (How critical are these errors?)
        
        FORMAT: Return a JSON list of objects:
        {{
            "capability_name": "string",
            "description": "string",
            "priority_score": 0.0-1.0,
            "strategic_justification": "string",
            "is_duplicate": boolean
        }}
        """

        response = await self.provider.generate_text(
            prompt=prompt,
            system_message="You are the Strategic Evolution Controller. Focus on ROI and mission alignment."
        )

        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            gaps = json.loads(response[start:end])
            
            # Filter duplicates and low priority
            strategic_gaps = [g for g in gaps if not g.get("is_duplicate") and g.get("priority_score", 0) > 0.5]
            
            # Sort by priority
            strategic_gaps = sorted(strategic_gaps, key=lambda x: x.get("priority_score", 0), reverse=True)

            # Log Intelligence Decisions
            intelligence_log = []
            intel_path = wm.get_path(self.intel_file)
            if os.path.exists(intel_path):
                with open(intel_path, "r") as f:
                    intelligence_log = json.load(f)
            
            intelligence_log.append({
                "timestamp": datetime.now().isoformat(),
                "decision_point": "Gap Analysis",
                "scored_gaps": gaps,
                "selected_gaps": strategic_gaps
            })
            
            with open(intel_path, "w") as f:
                json.dump(intelligence_log, f, indent=2)

            gaps_path = wm.get_path(self.gaps_file)
            with open(gaps_path, "w", encoding="utf-8") as f:
                json.dump(strategic_gaps, f, indent=2)
                
            return strategic_gaps
        except Exception as e:
            print(f"MONITOR: Failed to parse strategic gaps: {e}")
            return []
