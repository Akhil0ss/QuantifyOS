import os
from typing import List, Dict, Any, Optional
from openai import OpenAI, AsyncOpenAI
from .base import AIProvider

class OpenAIDriver(AIProvider):
    def __init__(self, api_key: str = None, model: str = "gpt-4o"):
        key_to_use = api_key or os.environ.get("OPENAI_API_KEY", "dummy-key-to-prevent-crash")
        self.client = AsyncOpenAI(api_key=key_to_use)
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
        Uses OpenAI's native tool-calling capability.
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
            # We assume our logic handles one tool at a time for simplicity in this phase
            tool_call = message.tool_calls[0]
            return {
                "tool": tool_call.function.name,
                "arguments": tool_call.function.arguments
            }
        
        return {"tool": None, "arguments": None, "content": message.content}

    async def validate_key(self) -> Optional[str]:
        try:
            # Try to list models to verify the key
            models = await self.client.models.list()
            model_ids = [m.id for m in models.data]
            
            # Prefer 4o, then o1, then 3.5
            if "gpt-4o" in model_ids: return "gpt-4o"
            if "o1-preview" in model_ids: return "o1-preview"
            if "gpt-3.5-turbo" in model_ids: return "gpt-3.5-turbo"
            
            return model_ids[0] if model_ids else None
        except:
            return None
