import os
from typing import List, Dict, Any, Optional
from anthropic import AsyncAnthropic
from .base import AIProvider

class AnthropicDriver(AIProvider):
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20240620"):
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_message or "You are an autonomous agent.",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        """
        Uses Anthropic's native tool-use capability.
        """
        # Mapping standard tool format to Anthropic's expected format if needed
        # (Assuming the tools provided are already in a compatible JSON schema format)
        
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system="You are an autonomous agent. Choose the best tool for the goal.",
            tools=tools,
            messages=[{"role": "user", "content": f"Goal: {goal}\nContext: {context or 'None'}"}]
        )

        for block in response.content:
            if block.type == "tool_use":
                return {
                    "tool": block.name,
                    "arguments": block.input
                }
        
        return {"tool": None, "arguments": None, "content": response.content[0].text}

    async def validate_key(self) -> Optional[str]:
        try:
            # Anthropic doesn't have a simple 'models.list' like OpenAI in the same way, 
            # but we can try a basic health check or use their standard model naming.
            # For this MVP, we'll try to create a 0-token message if possible, 
            # or just assume specific ones if we can list them.
            # Actually, the python client supports models.list() in recent versions.
            models = await self.client.models.list()
            model_ids = [m.id for m in models.data]
            
            if "claude-3-5-sonnet-20240620" in model_ids: return "claude-3-5-sonnet-20240620"
            if "claude-3-opus-20240229" in model_ids: return "claude-3-opus-20240229"
            
            return model_ids[0] if model_ids else None
        except:
            return "claude-3-5-sonnet-20240620" # Fallback if list fails but we want to try the best
