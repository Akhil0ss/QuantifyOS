from fastapi import APIRouter, Depends, Body
from app.core.auth_middleware import get_current_user
from app.services.users import UserService
from typing import Dict, Any

router = APIRouter(prefix="/api/user", tags=["users"])
user_service = UserService()

@router.get("/autonomy")
async def get_autonomy_prefs(current_user = Depends(get_current_user)):
    """
    Gets the currently authenticated user's autonomy preferences.
    """
    return user_service.get_autonomy_preferences(current_user["uid"])

@router.put("/autonomy")
async def update_autonomy_prefs(
    prefs: Dict[str, Any] = Body(...),
    current_user = Depends(get_current_user)
):
    """
    Updates the autonomy preferences for the user.
    """
    return user_service.update_autonomy_preferences(current_user["uid"], prefs)
