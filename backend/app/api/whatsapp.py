from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.core.auth_middleware import get_current_user
from app.services.whatsapp_service import get_whatsapp_service
from typing import Dict, Any
import asyncio

router = APIRouter(prefix="/api/workspaces/{workspace_id}/whatsapp", tags=["whatsapp"])

@router.get("/status")
async def get_whatsapp_status(
    workspace_id: str,
    current_user = Depends(get_current_user)
):
    """
    Check if WhatsApp is connected for this user/workspace.
    Returns detailed status: disconnected, starting, qr_ready, connected, error.
    """
    service = await get_whatsapp_service(workspace_id)
    
    # Check if session is starting up
    if service.session_manager.is_starting:
        return {
            "status": "starting",
            "is_running": True,
            "message": "Browser is launching, please wait..."
        }
    
    # Check for startup errors
    if service.session_manager.start_error:
        return {
            "status": "error",
            "is_running": False,
            "message": service.session_manager.start_error
        }
    
    # No page means not started
    if not service.session_manager.page:
        return {
            "status": "disconnected",
            "is_running": False
        }
    
    # Check if logged in
    is_logged_in = await service.session_manager.is_logged_in()
    if is_logged_in:
        return {
            "status": "connected",
            "is_running": True
        }
    
    # Page exists but not logged in — QR should be visible
    return {
        "status": "qr_ready",
        "is_running": True,
        "message": "WhatsApp Web loaded. Scan QR code to authenticate."
    }

@router.post("/start")
async def start_whatsapp_session(
    workspace_id: str,
    current_user = Depends(get_current_user)
):
    """
    Launches the WhatsApp playwright session using asyncio.create_task
    for proper async/await handling of Playwright operations.
    """
    service = await get_whatsapp_service(workspace_id)
    
    if service.session_manager.is_starting:
        return {"status": "starting", "message": "Session is already being initialized."}
    
    if service.session_manager.page:
        is_logged_in = await service.session_manager.is_logged_in()
        if is_logged_in:
            return {"status": "connected", "message": "Already connected."}
        return {"status": "qr_ready", "message": "Session active. Fetch QR code."}
    
    # Use asyncio.create_task for proper async Playwright handling
    asyncio.create_task(service.start())
    return {"status": "starting", "message": "WhatsApp session initializing. Poll /status for updates."}

@router.get("/qr")
async def get_whatsapp_qr(
    workspace_id: str,
    current_user = Depends(get_current_user)
):
    """
    Returns the QR code image bytes if waiting for login.
    Uses robust multi-selector fallback for QR detection.
    """
    service = await get_whatsapp_service(workspace_id)
    
    if service.session_manager.is_starting:
        raise HTTPException(status_code=202, detail="Session still initializing. Try again in a few seconds.")
    
    if not service.session_manager.page:
        raise HTTPException(status_code=400, detail="Session not started. Call /start first.")
        
    is_logged_in = await service.session_manager.is_logged_in()
    if is_logged_in:
        return {"status": "connected", "message": "Already authenticated."}
        
    qr_bytes = await service.session_manager.get_qr_screenshot()
    if not qr_bytes:
        raise HTTPException(status_code=404, detail="QR code not yet available. WhatsApp Web may still be loading.")
        
    return Response(content=qr_bytes, media_type="image/png")

@router.post("/stop")
async def stop_whatsapp_session(
    workspace_id: str,
    current_user = Depends(get_current_user)
):
    """
    Stops the session and cleans up resources.
    """
    service = await get_whatsapp_service(workspace_id)
    service.is_running = False
    await service.session_manager.stop()
    from app.services.whatsapp_service import whatsapp_manager
    if workspace_id in whatsapp_manager:
        del whatsapp_manager[workspace_id]
        
    return {"status": "stopped", "message": "WhatsApp session terminated."}

@router.post("/message")
async def send_whatsapp_message(
    workspace_id: str,
    payload: Dict[str, Any],
    current_user = Depends(get_current_user)
):
    """
    Sends a message via the active WhatsApp bridge.
    Expects {"to": "contact Name or Number", "message": "Hello!"}
    """
    service = await get_whatsapp_service(workspace_id)
    if not await service.session_manager.is_logged_in():
        raise HTTPException(status_code=401, detail="WhatsApp not connected.")
        
    target = payload.get("to")
    message = payload.get("message")
    
    if not target or not message:
        raise HTTPException(status_code=400, detail="Requires 'to' and 'message'.")
        
    await service.send_message(target, message)
    return {"status": "sent"}
