from typing import Optional, Dict, Any, List
from .base_rtdb import BaseRTDBService
from app.schemas.db_schemas import AIConfigBase, MemoryConfigBase, MessagingConfigBase, BusinessConfigBase
from firebase_admin import db
import time

class UserService(BaseRTDBService):
    def __init__(self):
        super().__init__("users")

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        users = self.list_all()
        for uid, data in users.items():
            if data.get("email") == email:
                data["id"] = uid
                return data
        return None

class WorkspaceService(BaseRTDBService):
    def __init__(self):
        super().__init__("workspaces")

    def create_workspace(self, owner_id: str, name: str) -> str:
        data = {
            "owner_id": owner_id,
            "name": name,
            "created_at": int(time.time() * 1000)
        }
        return self.push(data)

class ConfigService:
    def __init__(self):
        self.ai_configs = BaseRTDBService("ai_config")
        self.memory_configs = BaseRTDBService("memory_config")
        self.messaging_configs = BaseRTDBService("messaging_config")
        self.business_configs = BaseRTDBService("business_config")

    def get_ai_config(self, user_id: str):
        config = self.ai_configs.get(user_id)
        if not config:
            return None
        
        # Migration logic: if it's the old format, convert to fallback_pool
        if "fallback_pool" not in config:
            legacy_provider = {
                "id": "legacy_default",
                "mode": config.get("mode", "api"),
                "provider": config.get("provider", "openai"),
                "api_key": config.get("api_key"),
                "model_name": config.get("model_name", "default"),
                "local_url": config.get("local_url", "http://localhost:11434"),
                "web_session_id": config.get("web_session_id"),
                "performance_tier": "high"
            }
            new_config = {
                "user_id": user_id,
                "active_provider_id": "legacy_default",
                "fallback_pool": [legacy_provider],
                "routing_strategy": "manual"
            }
            # Update DB to new format
            self.ai_configs.set(new_config, user_id)
            return new_config
            
        return config

    def set_ai_config(self, config: AIConfigBase):
        # We ensure user_id is set and save to DB
        data = config.dict()
        # Clean up legacy fields if present in the data before saving
        legacy_fields = ["mode", "provider", "api_key", "model_name", "local_url", "web_session_id"]
        for field in legacy_fields:
            if field in data:
                del data[field]
        self.ai_configs.set(data, config.user_id)

    def get_memory_config(self, user_id: str):
        return self.memory_configs.get(user_id)

    def set_memory_config(self, config: MemoryConfigBase):
        self.memory_configs.set(config.dict(), config.user_id)

    def get_messaging_config(self, user_id: str):
        return self.messaging_configs.get(user_id)

    def set_messaging_config(self, config: MessagingConfigBase):
        self.messaging_configs.set(config.dict(), config.user_id)

    def get_business_config(self, user_id: str):
        return self.business_configs.get(user_id)

    def set_business_config(self, config: BusinessConfigBase):
        self.business_configs.set(config.dict(), config.user_id)
