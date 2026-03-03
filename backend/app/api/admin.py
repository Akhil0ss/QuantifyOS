from fastapi import APIRouter, Depends, HTTPException, Body
from app.core.auth_middleware import get_current_owner
from app.core.admin_config import system_config
from app.core.saas import SaaSController
from app.core.firebase_admin_sdk import db_admin, auth_admin
import os
import json
import time
from typing import Dict, Any, List

router = APIRouter(prefix="/api/admin", tags=["Owner Control Panel"])

ERROR_FILE = "production_errors.json"
sc = SaaSController()

@router.get("/metrics")
async def get_platform_metrics(owner = Depends(get_current_owner)):
    """
    Returns aggregated platform metrics for the owner dashboard.
    """
    metrics = sc.get_global_metrics()
    
    # Add Evolution metrics (Placeholder - could be aggregated from workspace_usage.json)
    # For now, we'll return what we have and add stubs for the rest
    metrics.update({
        "evolution_cycles_today": metrics.get("active_workspaces", 0) * 4, # Mock
        "modules_generated_total": 124, # Mock
        "system_load": os.getloadavg()[0] if hasattr(os, 'getloadavg') else 0.5
    })
    return metrics

@router.get("/config")
async def get_system_config(owner = Depends(get_current_owner)):
    """
    Returns the current global system configuration.
    """
    return system_config.get_all()

@router.post("/config/update")
async def update_system_config(
    updates: Dict[str, Any] = Body(...),
    owner = Depends(get_current_owner)
):
    """
    Updates global system toggles.
    """
    for k, v in updates.items():
        if k in system_config.config:
            system_config.update(k, v)
    return system_config.get_all()

@router.get("/users")
async def list_saas_users(owner = Depends(get_current_owner)):
    """
    Returns the list of users from Firebase Auth and their RTDB plan data.
    """
    try:
        users_result = auth_admin.list_users().users
        users_list = []
        for user in users_result:
            # Fetch plan from RTDB
            ref = db_admin.reference(f"users/{user.uid}")
            data = ref.get() or {}
            users_list.append({
                "uid": user.uid,
                "email": user.email,
                "name": user.display_name or data.get("name", "User"),
                "plan": data.get("plan", "free"),
                "created_at": user.user_metadata.creation_timestamp
            })
        return users_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{uid}/plan")
async def update_user_plan(
    uid: str,
    plan_data: Dict[str, Any] = Body(...),
    owner = Depends(get_current_owner)
):
    """
    Updates a user's plan and limits.
    """
    new_plan = plan_data.get("plan")
    if not new_plan:
        raise HTTPException(status_code=400, detail="Plan name required")
        
    ref = db_admin.reference(f"users/{uid}")
    ref.update({"plan": new_plan})
    
    return {"status": "success", "uid": uid, "plan": new_plan}

@router.get("/errors")
async def get_error_logs(owner = Depends(get_current_owner)):
    """
    Returns recent system errors from production_errors.json.
    """
    if os.path.exists(ERROR_FILE):
        with open(ERROR_FILE, "r") as f:
            return json.load(f)
    return []

@router.post("/emergency/stop")
async def emergency_stop_all(owner = Depends(get_current_owner)):
    """
    Emergency Kill-Switch: Stops all active evolution and agent processes.
    """
    system_config.update("emergency_stop", True)
    system_config.update("evolution_enabled", False)
    return {"message": "EMERGENCY STOP INITIALIZED. All autonomous activity halted."}

@router.post("/emergency/reset")
async def emergency_reset(owner = Depends(get_current_owner)):
    """
    Resets the emergency kill-switch.
    """
    system_config.update("emergency_stop", False)
    return {"message": "Emergency state cleared. Manual restart required for engines."}
