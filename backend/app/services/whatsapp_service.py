import asyncio
from typing import Optional
from .whatsapp_session import WhatsAppSessionManager
from ..agents.orchestrator import AgentOrchestrator
from ..services.tasks import TaskService

class WhatsAppService:
    """
    Real WhatsApp service using Playwright persistent sessions.
    """
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.session_manager = WhatsAppSessionManager(user_id)
        self.task_service = TaskService()
        self.is_running = False

    async def start(self):
        """
        Starts the session and the listener loop.
        """
        await self.session_manager.start(headless=True)
        if await self.session_manager.is_logged_in():
            self.is_running = True
            asyncio.create_task(self.listen_for_commands())
            print(f"WhatsApp listener started for user {self.user_id}")
        else:
            print(f"WhatsApp session not authenticated for user {self.user_id}. Please scan QR.")

    async def listen_for_commands(self):
        """
        Polls for new messages in the currently open chat.
        (Simplified version: looks for message bubbles with specific text)
        """
        page = self.session_manager.page
        orchestrator = AgentOrchestrator(self.user_id, self.user_id) # Using workspace_id for both

        while self.is_running:
            try:
                # 1. Find the last message (using a common selector for incoming message bubbles)
                # In a real implementation, we'd use more robust selectors or WhatsApp API
                last_msg_selector = ".message-in span.selectable-text"
                msg_elements = await page.query_selector_all(last_msg_selector)
                
                if msg_elements:
                    last_msg = await msg_elements[-1].inner_text()
                    
                    # Logic: In conversational mode, every message is a potential command or reply
                    # We skip messages that we already processed or that are repetitive (simplified)
                    print(f"WhatsApp Message Detected: {last_msg}")
                    
                    print(f"WhatsApp Message Detected: {last_msg}")
                    
                    # --- Phase 27: WhatsApp Approval Logic ---
                    clean_msg = last_msg.strip().lower()
                    if clean_msg in ["proceed", "approve", "go ahead", "ok"]:
                        # Find the most recent task awaiting approval
                        all_tasks = self.task_service.get_workspace_tasks(self.user_id)
                        awaiting_tasks = sorted(
                            [t for t in all_tasks if t.get("status") == "awaiting_approval"],
                            key=lambda t: t.get("created_at", 0),
                            reverse=True
                        )
                        
                        if awaiting_tasks:
                            target_task = awaiting_tasks[0]
                            target_id = target_task["id"]
                            print(f"WhatsApp Approval detected for task {target_id}")
                            
                            self.task_service.update_status(target_id, "approved")
                            from .orchestrator import run_autonomy_loop
                            asyncio.create_task(run_autonomy_loop(self.user_id, target_id, self.user_id))
                            
                            await self.send_message("Me", "Confirmation received. I am proceeding with the execution now.")
                            continue # Skip task creation
                    
                    # Standard conversational task creation
                    task_id = self.task_service.create_task(self.user_id, last_msg)
                    from .orchestrator import run_autonomy_loop
                    asyncio.create_task(run_autonomy_loop(self.user_id, task_id, self.user_id))
                    
                    # Notify receipt naturally
                    await self.send_message("Me", f"Got it. I'll get started on '{last_msg}' immediately.")

                await asyncio.sleep(10) # Poll every 10 seconds
            except Exception as e:
                print(f"Error in WhatsApp listener: {str(e)}")
                await asyncio.sleep(30)

    async def send_message(self, contact: str, message: str):
        """
        Sends a message by searching for the contact first, then typing.
        """
        if not self.session_manager.page: return
        page = self.session_manager.page
        
        try:
            # 1. Click search box
            search_selector = 'div[contenteditable="true"][data-tab="3"]'
            await page.click(search_selector)
            
            # 2. Type contact name/number
            await page.fill(search_selector, "") # Clear first
            await page.type(search_selector, contact)
            await asyncio.sleep(2) # Wait for results
            
            # 3. Press Enter to select first result
            await page.press(search_selector, "Enter")
            await asyncio.sleep(1)
            
            # 4. selector for the chat input area
            input_selector = 'div[contenteditable="true"][data-tab="10"]'
            await page.fill(input_selector, message)
            await page.press(input_selector, "Enter")
            print(f"WhatsApp Message sent to {contact}")
            
        except Exception as e:
            print(f"Failed to send WhatsApp message: {str(e)}")

    async def notify_ceo_event(self, event_type: str, details: str):
        """
        Specific helper for CEO notifications.
        Defaults to sending to the primary linked device (self).
        """
        msg = f"🔔 *CEO ALERT: {event_type}*\n\n{details}\n\n_Reply with 'Run: [Goal]' to issue a command._"
        await self.send_message("Me", msg) # "Me" usually targets the user's own chat in some setups, or a pinned chat.


whatsapp_manager = {}

async def get_whatsapp_service(user_id: str) -> WhatsAppService:
    if user_id not in whatsapp_manager:
        whatsapp_manager[user_id] = WhatsAppService(user_id)
    return whatsapp_manager[user_id]
