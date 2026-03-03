import asyncio
from typing import List, Dict, Any, Optional
from .base import AIProvider

class WebRouter(AIProvider):
    """
    Routes requests to a browser-based AI session using persistent Playwright contexts.
    """
    def __init__(self, provider: str, user_id: str = "default_user"):
        self.provider = provider
        self.user_id = user_id

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        from app.services.web_session import get_web_session_manager
        
        manager = get_web_session_manager(self.user_id)
        context = await manager.get_session_context(self.provider, headless=True)
        
        page = context.pages[0] if context.pages else await context.new_page()
        
        # Selectors vary by provider
        selectors = {
            "chatgpt": {
                "url": "https://chatgpt.com",
                "input": "#prompt-textarea",
                "send": 'button[data-testid="send-button"]',
                "response": ".markdown.prose"
            },
            "claude": {
                "url": "https://claude.ai",
                "input": 'div[contenteditable="true"]',
                "send": 'button[aria-label="Send Message"]',
                "response": ".font-claude-message"
            }
        }
        
        config = selectors.get(self.provider, selectors["chatgpt"])
        
        try:
            if page.url == "about:blank" or config["url"] not in page.url:
                await page.goto(config["url"])
            
            # Type prompt
            await page.wait_for_selector(config["input"], timeout=10000)
            await page.fill(config["input"], prompt)
            await page.press(config["input"], "Enter")
            
            # Wait for response (look for the last message bubble)
            await asyncio.sleep(5) # Basic wait for generation to start
            
            # Wait for the response element
            response_elements = await page.query_selector_all(config["response"])
            if response_elements:
                return await response_elements[-1].inner_text()
            
            return f"Error: Could not extract response from {self.provider}."
            
        except Exception as e:
            return f"Web AI Driver Error: {str(e)}"

    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        full_prompt = f"Goal: {goal}\nAvailable Tools: {str(tools)}\nRespond ONLY with the tool name and arguments if a tool is needed."
        response = await self.generate_text(full_prompt)
        return {"tool": None, "arguments": None, "content": response}

    async def validate_key(self) -> Optional[str]:
        # Web sessions don't have an API key to validate, return the provider name as valid
        return self.provider
