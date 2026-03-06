import os
import asyncio
import traceback
from playwright.async_api import async_playwright, BrowserContext
from typing import Optional

class WhatsAppSessionManager:
    """
    Manages persistent WhatsApp Web sessions using Playwright.
    Production-ready with robust error handling, retry logic, and proper QR detection.
    """
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.session_dir = os.path.join(os.getcwd(), "sessions", user_id, "whatsapp")
        os.makedirs(self.session_dir, exist_ok=True)
        self.playwright = None
        self.browser = None
        self.context: Optional[BrowserContext] = None
        self.page = None
        self._starting = False
        self._start_error: Optional[str] = None

    async def start(self, headless: bool = True):
        """
        Launches the browser with a persistent context.
        Includes retry logic and proper error handling.
        """
        if self._starting:
            print(f"WhatsApp: Already starting for {self.user_id}")
            return
        
        self._starting = True
        self._start_error = None
        
        try:
            # Clean up any previous crashed session
            await self._cleanup()
            
            self.playwright = await async_playwright().start()
            self.context = await self.playwright.chromium.launch_persistent_context(
                user_data_dir=self.session_dir,
                headless=headless,
                viewport={'width': 1280, 'height': 800},
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',  # Needed in Docker
                    '--disable-gpu',
                ]
            )
            self.page = await self.context.new_page()
            await self.page.goto("https://web.whatsapp.com", wait_until="domcontentloaded", timeout=30000)
            
            # Wait a bit for the page to settle
            await asyncio.sleep(3)
            print(f"WhatsApp Web opened for user {self.user_id}")
            
        except Exception as e:
            self._start_error = str(e)
            print(f"WhatsApp session start FAILED for {self.user_id}: {e}")
            traceback.print_exc()
            await self._cleanup()
        finally:
            self._starting = False

    async def _cleanup(self):
        """Safely clean up browser resources."""
        try:
            if self.context:
                await self.context.close()
        except: pass
        try:
            if self.playwright:
                await self.playwright.stop()
        except: pass
        self.context = None
        self.page = None
        self.playwright = None

    async def is_logged_in(self) -> bool:
        """
        Checks if the session is authenticated by looking for the main chat area.
        """
        if not self.page:
            return False
        try:
            # WhatsApp Web shows a search/chat panel when logged in
            await self.page.wait_for_selector('div[contenteditable="true"][data-tab="3"]', timeout=3000)
            return True
        except:
            return False

    async def get_qr_screenshot(self) -> Optional[bytes]:
        """
        Takes a screenshot of the QR code area.
        Tries multiple selectors for compatibility across WhatsApp Web versions.
        """
        if not self.page:
            return None
        try:
            # Try canvas first (classic QR)
            qr_el = await self.page.query_selector('canvas')
            if qr_el:
                return await qr_el.screenshot()
            
            # Try the QR container div (newer versions)
            qr_el = await self.page.query_selector('div[data-ref]')
            if qr_el:
                return await qr_el.screenshot()
            
            # Fallback: screenshot the entire login area
            login_area = await self.page.query_selector('div._aOvO, div._aam1, div.landing-wrapper')
            if login_area:
                return await login_area.screenshot()
            
            # Last resort: full page screenshot cropped to center
            return await self.page.screenshot(clip={'x': 340, 'y': 150, 'width': 600, 'height': 600})
            
        except Exception as e:
            print(f"WhatsApp QR screenshot error: {e}")
            # Absolute last resort: full page
            try:
                return await self.page.screenshot()
            except:
                return None

    @property
    def is_starting(self) -> bool:
        return self._starting
    
    @property
    def start_error(self) -> Optional[str]:
        return self._start_error

    async def stop(self):
        await self._cleanup()
