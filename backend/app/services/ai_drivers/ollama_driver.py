import httpx
from typing import List, Dict, Any, Optional
from .base import AIProvider
import json

class OllamaDriver(AIProvider):
    """
    Ollama Driver for local model support.
    Uses Ollama's local API (typically at localhost:11434).
    """
    def __init__(self, local_model: str = "llama3", base_url: str = "http://localhost:11434"):
        self.local_model = local_model
        self.base_url = base_url

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.local_model,
                    "messages": [
                        {"role": "system", "content": system_message or "You are an autonomous agent."},
                        {"role": "user", "content": prompt}
                    ],
                    "stream": False
                }
            )
            data = response.json()
            return data["message"]["content"]

    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        """
        Since many local models don't have native tool calling, 
        we use prompt engineering to force structural output.
        """
        tools_desc = json.dumps(tools, indent=2)
        
        prompt = f"""
        Goal: {goal}
        Context: {context or 'None'}
        Available Tools:
        {tools_desc}

        You are an autonomous agent. Select a tool OR provide content.
        Your response MUST be strict JSON:
        {{ "tool": "tool_name", "arguments": {{"arg1": "val1"}} }}
        OR 
        {{ "tool": null, "content": "direct answer" }}
        """

        response_text = await self.generate_text(prompt, system_message="Respond ONLY with valid JSON.")
        
        try:
            # Attempt to parse JSON from the response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            return json.loads(response_text[start:end])
        except Exception as e:
            return {"tool": None, "arguments": None, "content": f"Failed to parse model output: {response_text}"}

    async def validate_key(self) -> Optional[str]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags")
                models = response.json().get("models", [])
                for m in models:
                    if m["name"].startswith(self.local_model):
                        return m["name"]
                return models[0]["name"] if models else self.local_model
        except:
            return self.local_model # Fallback if API isn't fully up yet or standard call fails
