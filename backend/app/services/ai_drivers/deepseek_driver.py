import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from .base import AIProvider

class DeepSeekDriver(AIProvider):
    """
    DeepSeek Driver using its OpenAI-compatible API.
    """
    def __init__(self, api_key: str, model: str = "deepseek-chat"):
        self.client = AsyncOpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        self.model = model

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages
        )
        return response.choices[0].message.content

    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        """
        Uses DeepSeek's native tool-calling (via OpenAI compatible API).
        """
        messages = [
            {"role": "system", "content": "You are an autonomous agent. Choose the best tool for the goal."},
            {"role": "user", "content": f"Goal: {goal}\nContext: {context or 'None'}"}
        ]

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )

        message = response.choices[0].message
        if message.tool_calls:
            tool_call = message.tool_calls[0]
            return {
                "tool": tool_call.function.name,
                "arguments": tool_call.function.arguments
            }
        
        return {"tool": None, "arguments": None, "content": message.content}

    async def validate_key(self) -> Optional[str]:
        try:
            # DeepSeek uses OpenAI compatible API
            models = await self.client.models.list()
            model_ids = [m.id for m in models.data]
            
            if "deepseek-chat" in model_ids: return "deepseek-chat"
            if "deepseek-reasoner" in model_ids: return "deepseek-reasoner"
            
            return model_ids[0] if model_ids else "deepseek-chat"
        except:
            return None
