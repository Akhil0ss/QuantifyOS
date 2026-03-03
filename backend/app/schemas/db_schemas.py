from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    plan: str = "free"

class UserCreate(UserBase):
    id: str # Firebase UID

class UserInDB(UserBase):
    id: str
    created_at: datetime

class WorkspaceBase(BaseModel):
    name: str
    owner_id: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceInDB(WorkspaceBase):
    id: str
    created_at: datetime

class MembershipBase(BaseModel):
    user_id: str
    workspace_id: str
    role: str # admin, manager, user, viewer

class MembershipInDB(MembershipBase):
    id: str

class AIProviderConfig(BaseModel):
    id: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y%m%d%H%M%S"))
    mode: str # api, local, web
    provider: str # openai, anthropic, gemini, deepseek, ollama, chatgpt, claude
    api_key: Optional[str] = None
    model_name: str = "default"
    local_url: Optional[str] = "http://localhost:11434"
    web_session_id: Optional[str] = None
    performance_tier: str = "high" # high, medium, low

class AIConfigBase(BaseModel):
    user_id: str
    active_provider_id: Optional[str] = None
    fallback_pool: List[AIProviderConfig] = []
    routing_strategy: str = "manual" # manual, smart
    # Legacy fields for backward compatibility during migration
    mode: Optional[str] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    local_url: Optional[str] = None
    web_session_id: Optional[str] = None

class MemoryConfigBase(BaseModel):
    user_id: str
    storage_type: str # local, s3, firestore
    storage_credentials: Optional[Dict[str, Any]] = None

class BusinessConfigBase(BaseModel):
    user_id: str
    company_name: str = ""
    industry: str = ""
    target_audience: str = ""
    primary_directive: str = ""
    company_description: str = ""
    tone_of_voice: str = ""
    core_competitors: str = ""
    unique_value_proposition: str = ""
    risk_tolerance: str = "balanced"
    anti_directives: str = ""
    okrs: List[str] = []

class MessagingConfigBase(BaseModel):
    user_id: str
    whatsapp_session_path: Optional[str] = None
    whatsapp_active: bool = False

class LogBase(BaseModel):
    workspace_id: str
    user_id: str
    action: str
    details: str
    status: str
    time: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    goal: str

