from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import Response
from app.core.auth_middleware import get_current_user
from app.services.whatsapp_service import get_whatsapp_service
from typing import Dict, Any

router = APIRouter(prefix="/api/workspaces/{workspace_id}/whatsapp", tags=["whatsapp"])

@router.get("/status")
async def get_whatsapp_status(
    workspace_id: str,
    current_user = Depends(get_current_user)
):
    """
    Check if WhatsApp is connected for this user/workspace.
    """
    service = await get_whatsapp_service(workspace_id) # Using workspace_id as the session key for isolation
    
    is_logged_in = await service.session_manager.is_logged_in()
    return {
        "status": "connected" if is_logged_in else "disconnected",
        "is_running": service.is_running
    }

@router.post("/start")
async def start_whatsapp_session(
    workspace_id: str,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """
    Launches the WhatsApp playwright session.
    """
    service = await get_whatsapp_service(workspace_id)
    if not service.session_manager.playwright:
        background_tasks.add_task(service.start)
        return {"status": "starting", "message": "WhatsApp session initialized. Please wait a few seconds and fetch the QR code."}
    return {"status": "already_running", "message": "Session is already active."}

@router.get("/qr")
async def get_whatsapp_qr(
    workspace_id: str,
    current_user = Depends(get_current_user)
):
    """
    Returns the QR code image bytes if waiting for login.
    """
    service = await get_whatsapp_service(workspace_id)
    if not service.session_manager.page:
        raise HTTPException(status_code=400, detail="Session not started. Call /start first.")
        
    is_logged_in = await service.session_manager.is_logged_in()
    if is_logged_in:
        return {"status": "connected", "message": "Already authenticated."}
        
    qr_bytes = await service.session_manager.get_qr_screenshot()
    if not qr_bytes:
        raise HTTPException(status_code=404, detail="QR code not found. WhatsApp Web might still be loading.")
        
    return Response(content=qr_bytes, media_type="image/png")

@router.post("/stop")
async def stop_whatsapp_session(
    workspace_id: str,
    current_user = Depends(get_current_user)
):
    """
    Stops the session.
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
        
    # Note: send_message currently expects active open chat. 
    # For full functionality, send_message should handle navigating to the contact first.
    await service.send_message(target, message)
    return {"status": "sent"}
