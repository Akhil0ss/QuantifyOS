from fastapi import APIRouter, Depends, HTTPException
from app.core.auth_middleware import get_current_user
from app.core.role_middleware import RoleMiddleware
from app.services.replay_store import ReplayStore
from app.services.replay_engine import ReplayEngine
from typing import List, Dict, Any

router = APIRouter(prefix="/api/workspaces/{workspace_id}/replay", tags=["replay"])

@router.get("/sessions")
async def list_replay_sessions(
    workspace_id: str,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """Lists all available replay sessions in the workspace."""
    store = ReplayStore(workspace_id)
    return store.list_sessions()

@router.get("/sessions/{session_id}")
async def get_replay_session(
    workspace_id: str,
    session_id: str,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """Gets details for a specific replay session."""
    store = ReplayStore(workspace_id)
    session = store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    calls = store.get_llm_calls(session_id)
    session["llm_call_count"] = len(calls)
    return session

@router.post("/sessions/{session_id}/replay")
async def trigger_replay(
    workspace_id: str,
    session_id: str,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """
    Triggers deterministic replay for a past task execution.
    Returns the reproducibility report comparing outcomes.
    """
    engine = ReplayEngine(workspace_id)
    try:
        report = await engine.replay_task(session_id)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
