import asyncio
import time
from typing import Optional, Set
from .whatsapp_session import WhatsAppSessionManager
from ..services.tasks import TaskService

class WhatsAppService:
    """
    Real WhatsApp service using Playwright persistent sessions.
    Full two-way communication: receive commands → execute → send results.
    """
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.session_manager = WhatsAppSessionManager(user_id)
        self.task_service = TaskService()
        self.is_running = False
        self._processed_messages: Set[str] = set()  # Deduplication set
        self._last_message_text: str = ""  # Track last seen message

    async def start(self):
        """Starts the session and the listener loop."""
        await self.session_manager.start(headless=True)
        if await self.session_manager.is_logged_in():
            self.is_running = True
            asyncio.create_task(self.listen_for_commands())
            print(f"WhatsApp listener started for user {self.user_id}")
        else:
            print(f"WhatsApp session not authenticated for user {self.user_id}. Please scan QR.")

    async def listen_for_commands(self):
        """
        Polls for new INCOMING messages with proper deduplication.
        Only processes messages that are new and from the user (incoming).
        """
        page = self.session_manager.page
        workspace_id = self.user_id  # Using user_id as workspace for now

        while self.is_running:
            try:
                # Get all incoming message bubbles (class: message-in)
                # Use multiple selector strategies for robustness
                incoming_selectors = [
                    '.message-in .copyable-text span.selectable-text',
                    '.message-in span[dir="ltr"]',
                    '.message-in ._ao3e',
                ]

                msg_text = None
                for selector in incoming_selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        if elements:
                            msg_text = await elements[-1].inner_text()
                            break
                    except:
                        continue

                if msg_text and msg_text.strip():
                    clean = msg_text.strip()
                    
                    # DEDUPLICATION: Create a unique key from text + approximate time bucket
                    # We use 30-second buckets to avoid reprocessing the same message
                    time_bucket = int(time.time() / 30)
                    dedup_key = f"{clean[:100]}_{time_bucket}"
                    
                    if dedup_key not in self._processed_messages and clean != self._last_message_text:
                        self._processed_messages.add(dedup_key)
                        self._last_message_text = clean
                        
                        # Keep dedup set from growing unbounded
                        if len(self._processed_messages) > 500:
                            self._processed_messages = set(list(self._processed_messages)[-100:])
                        
                        print(f"WhatsApp NEW message: {clean[:80]}")
                        
                        # --- Approval Logic ---
                        lower = clean.lower()
                        if lower in ["proceed", "approve", "go ahead", "ok", "yes", "do it"]:
                            all_tasks = self.task_service.get_workspace_tasks(workspace_id)
                            awaiting = sorted(
                                [t for t in all_tasks if t.get("status") == "awaiting_approval"],
                                key=lambda t: t.get("created_at", 0),
                                reverse=True
                            )
                            if awaiting:
                                target = awaiting[0]
                                self.task_service.update_status(target["id"], "approved")
                                from .orchestrator import run_autonomy_loop
                                asyncio.create_task(run_autonomy_loop(self.user_id, target["id"], workspace_id))
                                await self.send_message("Me", "✅ Approved. Executing now.")
                                await asyncio.sleep(10)
                                continue

                        # --- Create new task from message ---
                        task_id = self.task_service.create_task(workspace_id, clean)
                        from .orchestrator import run_autonomy_loop
                        asyncio.create_task(run_autonomy_loop(self.user_id, task_id, workspace_id))
                        
                        await self.send_message("Me", f"🧠 Got it. Working on: \"{clean[:60]}...\"")

                await asyncio.sleep(8)  # Poll every 8 seconds
            except Exception as e:
                print(f"WhatsApp listener error: {str(e)}")
                await asyncio.sleep(30)

    async def send_message(self, contact: str, message: str):
        """
        Sends a message using robust selector fallback.
        Uses type() instead of fill() for contenteditable divs.
        """
        if not self.session_manager.page:
            return
        page = self.session_manager.page

        try:
            # Navigate to "Me" chat (user's own chat / Saved Messages)
            # First try clicking the search box
            search_selectors = [
                'div[contenteditable="true"][data-tab="3"]',
                'div[title="Search input textbox"]',
                'div[role="textbox"][data-tab="3"]',
            ]

            search_box = None
            for sel in search_selectors:
                search_box = await page.query_selector(sel)
                if search_box:
                    break

            if search_box:
                await search_box.click()
                await asyncio.sleep(0.5)
                
                # Clear and type contact name
                await page.keyboard.press("Control+A")
                await page.keyboard.press("Backspace")
                await page.keyboard.type(contact, delay=50)
                await asyncio.sleep(2)
                
                # Click first search result
                result_selectors = [
                    'span[title*="Me"]',
                    '._ahlY',  # Chat list item
                    'div[role="listitem"]',
                ]
                for rsel in result_selectors:
                    try:
                        result = await page.query_selector(rsel)
                        if result:
                            await result.click()
                            await asyncio.sleep(1)
                            break
                    except:
                        continue

            # Now type in the message input box
            input_selectors = [
                'div[contenteditable="true"][data-tab="10"]',
                'div[contenteditable="true"][data-tab="1"]',
                'div[title="Type a message"]',
                'footer div[contenteditable="true"]',
                'div[role="textbox"][data-tab="10"]',
            ]

            input_box = None
            for sel in input_selectors:
                input_box = await page.query_selector(sel)
                if input_box:
                    break

            if input_box:
                await input_box.click()
                await asyncio.sleep(0.3)
                
                # Type message character by character (works with contenteditable)
                await page.keyboard.type(message, delay=10)
                await asyncio.sleep(0.3)
                await page.keyboard.press("Enter")
                
                print(f"WhatsApp: Message sent to {contact}")
            else:
                print(f"WhatsApp: Could not find message input box")

        except Exception as e:
            print(f"WhatsApp send failed: {str(e)}")

    async def notify_ceo_event(self, event_type: str, details: str):
        """Sends a CEO alert notification."""
        msg = f"🔔 *{event_type}*\n\n{details}\n\n_Reply to issue a command._"
        await self.send_message("Me", msg)


whatsapp_manager = {}

async def get_whatsapp_service(user_id: str) -> WhatsAppService:
    if user_id not in whatsapp_manager:
        whatsapp_manager[user_id] = WhatsAppService(user_id)
    return whatsapp_manager[user_id]
