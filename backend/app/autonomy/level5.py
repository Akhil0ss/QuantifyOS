from typing import List, Dict, Any, Optional
from app.services.ai_drivers.router import ModelRouter
from app.services.tasks import TaskService

class AutonomyLevel5:
    """
    Detects patterns and suggests proactive tasks.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str = "default_user"):
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        self.task_service = TaskService()

    async def detect_patterns(self, workspace_id: str) -> List[Dict[str, Any]]:
        """
        Analyzes historical tasks for repetition.
        """
        tasks = self.task_service.get_workspace_tasks(workspace_id)
        task_history = "\n".join([f"- {t['goal']} ({t['status']})" for t in tasks[-20:]]) # last 20 tasks

        prompt = f"""
        Task History:
        {task_history}

        Analyze this history for patterns. For example, if the user often asks to 'Summarize emails' or 'Check stock prices'. 
        Detect recurring goals and suggest automated schedules.
        
        Return JSON list:
        [
            {{"pattern": "...", "suggestion": "Goal to automate", "frequency": "daily|weekly|event-based"}}
        ]
        """

        response = await self.provider.generate_text(
            prompt=prompt,
            system_message="You are a Level 5 autonomy pattern detection engine."
        )

        try:
            return json.loads(response[response.find('['):response.rfind(']')+1])
        except:
            return []

    async def proactive_trigger(self, suggestion: Dict[str, Any]):
        """
        Logic to autonomously start a task based on a detected pattern.
        """
        print(f"Level 5 - Proactive Trigger: Starting task '{suggestion['suggestion']}'")
        # In a real app, this would create a new task with a 'proactive' tag
        pass
