from fastapi import APIRouter, Depends, HTTPException
from app.core.auth_middleware import get_current_user
from app.services.entities import ConfigService
from app.schemas.db_schemas import AIConfigBase, MemoryConfigBase, BusinessConfigBase
from typing import Dict, Any
import asyncio

router = APIRouter(prefix="/api/config", tags=["config"])
config_service = ConfigService()

@router.get("/ai")
async def get_ai_config(user = Depends(get_current_user)):
    user_id = user["uid"]
    config = config_service.get_ai_config(user_id)
    if not config:
        return {"provider": "openai", "model": "gpt-4o", "api_key": ""}
    return config

@router.post("/ai")
async def save_ai_config(config: Dict[str, Any], user = Depends(get_current_user)):
    user_id = user["uid"]
    config["user_id"] = user_id
    # Use schema for validation
    ai_config = AIConfigBase(**config)
    config_service.set_ai_config(ai_config)
    return {"status": "success"}

@router.get("/memory")
async def get_memory_config(user = Depends(get_current_user)):
    user_id = user["uid"]
    config = config_service.get_memory_config(user_id)
    if not config:
        return {"storage_type": "local"}
    return config

@router.post("/memory")
async def save_memory_config(config: Dict[str, Any], user = Depends(get_current_user)):
    user_id = user["uid"]
    config["user_id"] = user_id
    memory_config = MemoryConfigBase(**config)
    config_service.set_memory_config(memory_config)
    return {"status": "success"}

@router.get("/business")
async def get_business_config(user = Depends(get_current_user)):
    user_id = user["uid"]
    config = config_service.get_business_config(user_id)
    if not config:
        return {}
    return config

@router.post("/business")
async def save_business_config(config: Dict[str, Any], user = Depends(get_current_user)):
    user_id = user["uid"]
    config["user_id"] = user_id
    business_config = BusinessConfigBase(**config)
    config_service.set_business_config(business_config)
    return {"status": "success"}

@router.post("/ai/web-connect")
async def web_ai_connect(provider: str, user = Depends(get_current_user)):
    from app.services.web_session import get_web_session_manager
    user_id = user["uid"]
    manager = get_web_session_manager(user_id)
    # This launches the headful browser on the user's machine (local dev)
    asyncio.create_task(manager.launch_interactive_login(provider))
    return {"status": "success", "message": f"Login window for {provider} opened."}

@router.get("/ai/web-status")
async def get_web_ai_status(provider: str, user = Depends(get_current_user)):
    from app.services.web_session import get_web_session_manager
    user_id = user["uid"]
    manager = get_web_session_manager(user_id)
    status_info = await manager.verify_session(provider)
    return status_info

@router.post("/ai/auto-detect")
async def auto_detect_model(data: Dict[str, str], user = Depends(get_current_user)):
    from app.services.ai_drivers.router import ModelRouter
    provider_name = data.get("provider")
    api_key = data.get("api_key")
    
    if not provider_name or not api_key:
        return {"status": "error", "message": "Provider and API Key required"}
        
    try:
        # We use ModelRouter to get a temporary driver instance
        driver = ModelRouter.get_provider_from_config({"mode": "api", "provider": provider_name, "api_key": api_key})
        detected_model = await driver.validate_key()
        
        if detected_model:
            return {"status": "success", "model_name": detected_model}
        else:
            return {"status": "error", "message": "Invalid API Key or no models found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
