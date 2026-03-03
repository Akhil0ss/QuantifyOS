import os
from playwright.async_api import async_playwright, BrowserContext
from typing import Optional

class WhatsAppSessionManager:
    """
    Manages persistent WhatsApp Web sessions using Playwright.
    """
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.session_dir = f"sessions/{user_id}/whatsapp"
        os.makedirs(self.session_dir, exist_ok=True)
        self.playwright = None
        self.browser = None
        self.context: Optional[BrowserContext] = None
        self.page = None

    async def start(self, headless: bool = True):
        """
        Launches the browser with a persistent context.
        """
        self.playwright = await async_playwright().start()
        # Using launch_persistent_context to keep cookies/localStorage
        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=self.session_dir,
            headless=headless,
            viewport={'width': 1280, 'height': 800}
        )
        self.page = await self.context.new_page()
        await self.page.goto("https://web.whatsapp.com")
        print(f"WhatsApp Web opened for user {self.user_id}")

    async def is_logged_in(self) -> bool:
        """
        Checks if the session is authenticated.
        """
        if not self.page: return False
        try:
            # Wait for a selector that only appears when logged in (e.g. search bar)
            await self.page.wait_for_selector('div[contenteditable="true"]', timeout=5000)
            return True
        except:
            return False

    async def get_qr_screenshot(self) -> Optional[bytes]:
        """
        Takes a screenshot of the QR code if not logged in.
        """
        if not self.page: return None
        try:
            qr_canvas = await self.page.wait_for_selector('canvas', timeout=5000)
            return await qr_canvas.screenshot()
        except:
            return None

    async def stop(self):
        if self.context:
            await self.context.close()
        if self.playwright:
            await self.playwright.stop()
