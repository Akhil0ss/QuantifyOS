import os
from playwright.async_api import async_playwright, BrowserContext
from typing import Optional, Dict, Any

class WebSessionManager:
    """
    Manages persistent web-based AI sessions (ChatGPT, Claude, etc.)
    using Playwright with a persistent user data directory.
    """
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.playwright = None
        self.browser_contexts: Dict[str, BrowserContext] = {}

    def _get_session_dir(self, provider: str) -> str:
        base_dir = f"sessions/{self.user_id}/web_{provider}"
        os.makedirs(base_dir, exist_ok=True)
        return base_dir

    async def launch_interactive_login(self, provider: str):
        """
        Launches a headful browser for the user to log in manually.
        """
        if not self.playwright:
            self.playwright = await async_playwright().start()

        session_dir = self._get_session_dir(provider)
        
        urls = {
            "chatgpt": "https://chatgpt.com",
            "claude": "https://claude.ai",
            "gemini_web": "https://gemini.google.com"
        }
        
        url = urls.get(provider, "https://chatgpt.com")
        
        # Launch in headful mode for interactive login
        context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=session_dir,
            headless=False,
            viewport={'width': 1280, 'height': 800}
        )
        
        page = await context.new_page()
        await page.goto(url)
        
        # We don't close the context here; we let the user log in.
        # The frontend will poll verify_session to check progress.
        return context

    async def verify_session(self, provider: str) -> Dict[str, Any]:
        """
        Verifies if the stored session is valid and detects subscription tier.
        """
        context = await self.get_session_context(provider, headless=True)
        page = context.pages[0] if context.pages else await context.new_page()
        
        urls = {
            "chatgpt": "https://chatgpt.com",
            "claude": "https://claude.ai",
            "gemini_web": "https://gemini.google.com"
        }
        
        try:
            if page.url == "about:blank" or urls[provider] not in page.url:
                await page.goto(urls[provider], timeout=15000)
            
            # Check for selectors indicating login
            # Selectors vary by provider
            checks = {
                "chatgpt": {
                    "logged_in": "#prompt-textarea",
                    "tier_plus": ".text-token-text-secondary:has-text('Plus')", # ChatGPT Plus indicator
                },
                "claude": {
                    "logged_in": 'div[contenteditable="true"]',
                    "tier_pro": "div:has-text('Pro')", # Claude Pro indicator
                }
            }
            
            config = checks.get(provider, checks["chatgpt"])
            
            # Wait for login indicator
            try:
                await page.wait_for_selector(config["logged_in"], timeout=5000)
                is_logged_in = True
            except:
                is_logged_in = False
            
            if not is_logged_in:
                return {"status": "disconnected", "tier": "Free"}
            
            # Detect tier
            tier = "Free"
            if provider == "chatgpt":
                plus_indicator = await page.query_selector(config["tier_plus"])
                if plus_indicator: tier = "Plus"
            elif provider == "claude":
                pro_indicator = await page.query_selector(config["tier_pro"])
                if pro_indicator: tier = "Pro"
                
            return {"status": "connected", "tier": tier}
            
        except Exception as e:
            return {"status": "error", "message": str(e), "tier": "Free"}

    async def get_session_context(self, provider: str, headless: bool = True) -> BrowserContext:
        """
        Gets or creates a persistent context for background interaction.
        """
        if provider in self.browser_contexts:
            return self.browser_contexts[provider]

        if not self.playwright:
            self.playwright = await async_playwright().start()

        session_dir = self._get_session_dir(provider)
        context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=session_dir,
            headless=headless,
            viewport={'width': 1280, 'height': 800}
        )
        self.browser_contexts[provider] = context
        return context

    async def stop_all(self):
        for context in self.browser_contexts.values():
            await context.close()
        if self.playwright:
            await self.playwright.stop()

# global manager instance
web_session_manager = None

def get_web_session_manager(user_id: str) -> WebSessionManager:
    global web_session_manager
    if not web_session_manager:
        web_session_manager = WebSessionManager(user_id)
    return web_session_manager
