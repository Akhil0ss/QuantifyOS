from fastapi import APIRouter, Depends, HTTPException, Body
from app.core.auth_middleware import get_current_user
from app.autonomy.swarm import SwarmOrchestrator
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter(prefix="/api/swarm", tags=["swarm"])
swarm_engine = SwarmOrchestrator()

class SpawnRequest(BaseModel):
    parent_task_id: str
    role: str
    goal: str
    workspace_id: str

class MessageRequest(BaseModel):
    workspace_id: str
    receiver_id: str
    message: str

@router.get("/active")
async def get_active_agents(workspace_id: str, user = Depends(get_current_user)):
    # In a prod environment, we would verify the user has access to `workspace_id`.
    # Assuming the frontend sends a valid workspace_id for the user.
    if not workspace_id:
        raise HTTPException(status_code=400, detail="workspace_id is required")
    agents = swarm_engine.list_active_agents(workspace_id)
    return agents

@router.get("/messages")
async def get_swarm_messages(workspace_id: str, user = Depends(get_current_user)):
    if not workspace_id:
        raise HTTPException(status_code=400, detail="workspace_id is required")
    messages = swarm_engine.get_messages(workspace_id)
    return messages

@router.get("/logs")
async def get_swarm_logs(workspace_id: str, user = Depends(get_current_user)):
    if not workspace_id:
        raise HTTPException(status_code=400, detail="workspace_id is required")
    logs = swarm_engine.get_logs(workspace_id)
    return logs

@router.post("/spawn")
async def spawn_agent(request: SpawnRequest, user = Depends(get_current_user)):
    agent_id = swarm_engine.spawn_agent(
        workspace_id=request.workspace_id,
        parent_task_id=request.parent_task_id,
        role=request.role,
        goal=request.goal
    )
    return {"status": "success", "agent_id": agent_id}

@router.post("/message")
async def send_message(request: MessageRequest, user = Depends(get_current_user)):
    # Using 'user_interface' as a generic sender for manual interventions
    msg_id = swarm_engine.broadcast_message(
        workspace_id=request.workspace_id,
        sender_id="user_interface", 
        receiver_id=request.receiver_id,
        message=request.message
    )
    return {"status": "success", "message_id": msg_id}

@router.post("/terminate/{agent_id}")
async def terminate_agent(agent_id: str, workspace_id: str = Body(..., embed=True), user = Depends(get_current_user)):
    swarm_engine.terminate_agent(workspace_id, agent_id, reason="Terminated via User Command")
    return {"status": "success", "agent_id": agent_id}
