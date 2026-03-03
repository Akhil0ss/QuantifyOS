from typing import List, Dict, Any, Optional
from app.services.ai_drivers.router import ModelRouter
from app.capability.generator import ToolGenerator

class NeverSayNoEngine:
    """
    Handles retries and alternative strategies when a tool fails.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str = "default_user"):
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        self.tool_generator = ToolGenerator(provider_config, user_id=user_id)

    async def analyze_failure(self, goal: str, failed_step: Dict[str, Any], error: str) -> Dict[str, Any]:
        """
        Asks the AI why the step failed and what to do next.
        """
        prompt = f"""
        Goal: {goal}
        Failed Step: {failed_step['description']}
        Tool Used: {failed_step['tool']}
        Error: {error}

        Analyze this failure. Should we:
        1. retry (same tool, different args)?
        2. alternative (different existing tool)?
        3. generate (create a new tool because no existing tool works)?
        4. abort (goal is impossible)?

        Return JSON:
        {{"decision": "retry|alternative|generate|abort", "reason": "...", "next_action": "description of what to do"}}
        """

        response = await self.provider.generate_text(
            prompt=prompt,
            system_message="You are a failure analysis engine for an autonomous system."
        )

        try:
            return json.loads(response[response.find('{'):response.rfind('}')+1])
        except:
            return {"decision": "abort", "reason": "Analysis failed.", "next_action": "None"}
            
    async def try_generate_and_retry(self, tool_name: str, requirement: str) -> bool:
        """
        Triggers the ToolGenerator and confirms if it succeeded.
        """
        return await self.tool_generator.generate_tool(tool_name, requirement)
