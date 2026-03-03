from app.autonomy.planning import PlanningEngine
from app.autonomy.execution import ExecutionEngine
from app.services.tasks import TaskService
from app.services.entities import ConfigService

class AgentOrchestrator:
    """
    Coordinates AI models and tools to complete tasks.
    """
    def __init__(self, user_id: str, workspace_id: str):
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.task_service = TaskService()
        self.config_service = ConfigService()
        
        # Fetch real AI configuration
        self.config = self.config_service.get_ai_config(user_id)
        if not self.config:
            # Fallback to defaults if not configured
            self.config = {"mode": "api", "provider": "openai", "api_key": ""}

    async def run_task(self, task_id: str):
        """
        Main execution flow including planning and execution.
        """
        task = self.task_service.get(task_id)
        if not task: return

        # 1. Generate a plan
        plan_engine = PlanningEngine(self.config, user_id=self.user_id)
        plan = await plan_engine.generate_plan(task["goal"])

        # 2. Execute the plan
        exec_engine = ExecutionEngine(self.config, user_id=self.user_id)
        await exec_engine.execute_plan(self.workspace_id, task_id, plan)
