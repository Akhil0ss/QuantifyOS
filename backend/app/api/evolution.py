from fastapi import APIRouter, Depends, BackgroundTasks
from app.core.auth_middleware import get_current_user
from app.services.evolution import EvolutionService
from typing import Dict, Any

router = APIRouter(prefix="/api/evolution", tags=["evolution"])

app_router_instance = router # To be used if needed

@router.get("/status")
async def get_evolution_status(user = Depends(get_current_user)):
    user_id = user["uid"]
    workspace_id = f"default-{user_id}"
    service = EvolutionService()
    
    state = service.get_state(workspace_id)
    history = service.get_history(workspace_id)
    
    return {
        "active": state.get("failure_count", 0) < 3,
        "daily_count": state.get("daily_count", 0),
        "failure_count": state.get("failure_count", 0),
        "last_cycle": history[0]["timestamp"] if history else None,
        "history": history
    }

@router.post("/run")
async def run_evolution_cycle_manual(background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    """
    Manually triggers an evolution cycle.
    """
    from app.autonomy.evolution_orchestrator import run_global_evolution
    user_id = user["uid"]
    # Usually workspace_id would come from URL, but for simplicity we'll use the default format
    workspace_id = f"default-{user_id}"
    
    background_tasks.add_task(run_global_evolution, user_id, workspace_id)
    return {"status": "success", "message": "Evolution engine engaged. Monitoring capability gaps..."}

@router.post("/kill")
async def workspace_kill_switch(user = Depends(get_current_user)):
    """
    Emergency Kill-Switch for the current workspace.
    Stops all active evolution processes for this user.
    """
    from app.core.firebase_admin_sdk import db_admin
    user_id = user["uid"]
    # We'll use the memberships to find the active workspace (simplified for this impl)
    membership_ref = db_admin.reference(f"memberships/{user_id}")
    memberships = membership_ref.get() or {}
    
    for workspace_id in memberships.keys():
        db_admin.reference(f"workspace_states/{workspace_id}/kill_switch").set(True)
    
    return {"message": "WORKSPACE KILL SWITCH ACTIVATED. Evolution halted for all owned workspaces."}

@router.post("/reset")
async def workspace_kill_reset(user = Depends(get_current_user)):
    """
    Resets the kill switch for the current workspace.
    """
    from app.core.firebase_admin_sdk import db_admin
    user_id = user["uid"]
    membership_ref = db_admin.reference(f"memberships/{user_id}")
    memberships = membership_ref.get() or {}
    
    for workspace_id in memberships.keys():
        db_admin.reference(f"workspace_states/{workspace_id}/kill_switch").set(False)
    
    return {"message": "Kill switch cleared. Manual restart or wait for next cycle."}

@router.get("/stats")
async def get_evolution_stats(user = Depends(get_current_user)):
    service = EvolutionService()
    stats = service.get_global_stats()
    return stats
