from fastapi import APIRouter, Depends, HTTPException, Body, Request
from app.core.auth_middleware import get_current_user
from app.services.hardware import HardwareService
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter(prefix="/api/hardware", tags=["hardware"])
hardware_service = HardwareService()

class RegisterDeviceRequest(BaseModel):
    workspace_id: str
    name: str
    type: str # 'sensor', 'actuator', 'hybrid'
    description: str = ""

@router.post("/register")
async def register_device(request: RegisterDeviceRequest, user = Depends(get_current_user)):
    device = hardware_service.register_device(
        workspace_id=request.workspace_id,
        name=request.name,
        device_type=request.type,
        description=request.description
    )
    return {"status": "success", "device": device}

@router.get("/list")
async def list_devices(workspace_id: str, user = Depends(get_current_user)):
    if not workspace_id:
        raise HTTPException(status_code=400, detail="workspace_id is required")
    devices = hardware_service.get_devices(workspace_id)
    return devices

@router.post("/command/{device_id}")
async def send_device_command(
    device_id: str, 
    workspace_id: str = Body(..., embed=True), 
    command: str = Body(..., embed=True),
    params: dict = Body({}, embed=True),
    user = Depends(get_current_user)
):
    hardware_service.send_command(workspace_id, device_id, command, params)
    return {"status": "success"}

# Unauthenticated Webhook Endpoint for Physical Devices!
@router.post("/webhook/{device_id}")
async def hardware_webhook(device_id: str, request: Request):
    """
    IoT devices hit this endpoint: POST /api/hardware/webhook/dev_123abc 
    Headers: Authorization: Bearer <secret_token>
    Body: JSON telemetry payload
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
        
    token = auth_header.split(" ")[1]
    payload = await request.json()
    
    success = hardware_service.verify_and_ingest_telemetry(device_id, token, payload)
    
    if not success:
        raise HTTPException(status_code=403, detail="Invalid token or device ID")
        
    return {"status": "accepted"}
