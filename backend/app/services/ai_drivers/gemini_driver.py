import os
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from .base import AIProvider

class GeminiDriver(AIProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        genai.configure(api_key=api_key)
        self.model_name = model if model != "default" else "gemini-1.5-pro"
        self.model = genai.GenerativeModel(self.model_name)

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        # Gemini handles system instructions in the constructor or a specific field
        # For simplicity in this driver, we prepand it
        full_prompt = f"{system_message}\n\n{prompt}" if system_message else prompt
        response = await self.model.generate_content_async(full_prompt)
        return response.text

    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        """
        Uses Gemini's native function calling.
        """
        # Convert OpenAI-style tools to Gemini tools if necessary
        # For now, we'll use a wrapper or prompt engineering if exact match is hard
        prompt = f"Goal: {goal}\nContext: {context or 'None'}"
        
        # Simple implementation using prompt engineering for now, 
        # as native Gemini tool conversion is more involved
        system_instruction = "You are an autonomous agent. Choose the best tool for the goal. Respond ONLY with valid JSON."
        tools_desc = str(tools)
        
        full_prompt = f"{system_instruction}\nAvailable Tools: {tools_desc}\n\n{prompt}\n\nRespond with: {{'tool': 'name', 'arguments': {{...}}}}"
        
        response = await self.model.generate_content_async(full_prompt)
        text = response.text
        
        try:
            import json
            start = text.find('{')
            end = text.rfind('}') + 1
            return json.loads(text[start:end])
        except:
            return {"tool": None, "arguments": None, "content": text}

    async def validate_key(self) -> Optional[str]:
        try:
            # We can verify the key by trying to list models
            # In google-generativeai, this is genai.list_models()
            models = genai.list_models()
            for m in models:
                if "gemini-1.5-pro" in m.name:
                    return "gemini-1.5-pro"
            return "gemini-1.5-pro" # Default if key is valid enough to not crash
        except:
            return None
