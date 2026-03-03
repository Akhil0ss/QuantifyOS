from fastapi import APIRouter, Depends, Body
from app.core.auth_middleware import get_current_user
import os
import json
import time
from typing import Dict, Any

router = APIRouter(prefix="/api/beta", tags=["Beta Mode"])

FEEDBACK_FILE = "user_feedback.json"

@router.get("/config")
async def get_beta_config(user = Depends(get_current_user)):
    """
    Returns beta-specific configuration.
    """
    return {
        "beta_mode": True,
        "version": "1.0 Stable (Beta)",
        "limits": {
            "max_agents": 5,
            "max_tasks_per_hour": 50
        }
    }

@router.post("/feedback")
async def submit_feedback(
    feedback: Dict[str, Any] = Body(...),
    user = Depends(get_current_user)
):
    """
    Stores user feedback, bug reports, and feature requests.
    """
    entry = {
        "uid": user["uid"],
        "email": user.get("email"),
        "timestamp": time.time(),
        "type": feedback.get("type", "comment"),
        "content": feedback.get("content", ""),
        "metadata": feedback.get("metadata", {})
    }
    
    feedbacks = []
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r") as f:
                feedbacks = json.load(f)
        except:
            feedbacks = []
            
    feedbacks.append(entry)
    
    with open(FEEDBACK_FILE, "w") as f:
        json.dump(feedbacks, f, indent=2)
        
    return {"status": "success", "message": "Feedback received. Thank you for building Quantify OS with us!"}
