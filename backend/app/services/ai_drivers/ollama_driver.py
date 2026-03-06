import httpx
from typing import List, Dict, Any, Optional
from .base import AIProvider
import json
import asyncio
import uuid
from app.core.firebase_admin_sdk import db_admin

class OllamaDriver(AIProvider):
    """
    Ollama Driver for local model support.
    Uses Ollama's local API (typically at localhost:11434).
    If base_url is local and we are on the cloud (quantifyos backend),
    it ferries the request through the frontend via Firebase RTDB.
    """
    def __init__(self, local_model: str = "llama3", base_url: str = "http://localhost:11434", user_id: str = "default"):
        self.local_model = local_model
        self.base_url = base_url
        self.user_id = user_id
        
        # Check if URL is essentially localhost (needs tunneling)
        self.needs_tunnel = any(x in self.base_url for x in ["localhost", "127.0.0.1", "0.0.0.0"])

    async def _tunnel_request(self, payload: dict) -> str:
        """Ferry the request via Firebase RTDB to the connected frontend."""
        if not db_admin:
            raise Exception("Firebase DB not initialized. Cannot use local model tunnel.")
            
        req_id = str(uuid.uuid4())
        ref = db_admin.reference(f"tunnels/{self.user_id}/requests/{req_id}")
        
        # Post request to RTDB
        ref.set({
            "status": "pending",
            "url": f"{self.base_url}/api/chat",
            "payload": payload,
            "timestamp": { ".sv": "timestamp" }
        })
        
        # Wait for the frontend to complete the request
        max_retries = 120 # 60 seconds (0.5s intervals)
        for _ in range(max_retries):
            await asyncio.sleep(0.5)
            data = ref.get()
            if data and data.get("status") == "completed":
                response_text = data.get("response")
                # Clean up
                ref.delete()
                return response_text
            elif data and data.get("status") == "error":
                err = data.get("error", "Unknown tunnel error")
                ref.delete()
                raise Exception(f"Tunnel Error: {err}")
                
        # Timeout
        ref.delete()
        raise Exception("Local model tunnel timed out. Ensure your dashboard is open and connected.")

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        payload = {
            "model": self.local_model,
            "messages": [
                {"role": "system", "content": system_message or "You are an autonomous agent."},
                {"role": "user", "content": prompt}
            ],
            "stream": False
        }
        
        if self.needs_tunnel:
            return await self._tunnel_request(payload)
            
        # Direct fallback (if not local, or if running fully locally)
        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json=payload
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
        if self.needs_tunnel:
            # Tunnel validation not supported easily, assume provided model string is valid
            return self.local_model
            
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
