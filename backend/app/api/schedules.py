from fastapi import APIRouter, Depends
from app.core.auth_middleware import get_current_user
from app.autonomy.scheduler import TaskScheduler
from typing import Dict, Any

router = APIRouter(prefix="/api/workspaces/{workspace_id}/schedules", tags=["schedules"])

@router.get("")
async def list_schedules(workspace_id: str, current_user = Depends(get_current_user)):
    """List all scheduled tasks for this workspace."""
    scheduler = TaskScheduler(current_user["uid"], workspace_id)
    return {"schedules": scheduler.list_schedules()}

@router.post("")
async def create_schedule(workspace_id: str, payload: Dict[str, Any], current_user = Depends(get_current_user)):
    """
    Create a new scheduled task.
    Body: { "goal": "...", "schedule_type": "daily|weekly|interval_hours|once_at", "config": { "hour": 9 } }
    """
    goal = payload.get("goal")
    schedule_type = payload.get("schedule_type")
    config = payload.get("config", {})
    
    if not goal or not schedule_type:
        return {"error": "goal and schedule_type are required"}
    
    scheduler = TaskScheduler(current_user["uid"], workspace_id)
    schedule_id = scheduler.create_schedule(goal, schedule_type, config)
    return {"status": "created", "schedule_id": schedule_id}

@router.delete("/{schedule_id}")
async def delete_schedule(workspace_id: str, schedule_id: str, current_user = Depends(get_current_user)):
    """Delete a scheduled task."""
    scheduler = TaskScheduler(current_user["uid"], workspace_id)
    scheduler.delete_schedule(schedule_id)
    return {"status": "deleted"}

@router.get("/suggestions")
async def get_suggestions(workspace_id: str, current_user = Depends(get_current_user)):
    """Get proactive suggestions for this workspace."""
    from app.services.base_rtdb import BaseRTDBService
    db = BaseRTDBService(f"suggestions/{workspace_id}")
    data = db.get() or {}
    suggestions = []
    for sid, sdata in data.items():
        sdata["id"] = sid
        suggestions.append(sdata)
    return {"suggestions": suggestions}
