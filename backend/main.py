import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── SECURITY: Production Safety Guard ──
# Crash immediately if TEST_MODE is enabled in production.
_ENV = os.environ.get("QUANTIFY_ENV", "production")
if _ENV == "production" and os.getenv("TEST_MODE") == "true":
    print("\n" + "=" * 60)
    print("CRITICAL SECURITY ERROR")
    print("TEST_MODE=true is FORBIDDEN in production.")
    print("Remove TEST_MODE or set QUANTIFY_ENV=development.")
    print("=" * 60 + "\n")
    sys.exit(1)

from fastapi import FastAPI, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from app.core.auth_middleware import get_current_user, get_dev_test_token
from app.core.firebase_admin_sdk import db_admin
from firebase_admin import db as rtdb
from app.api.config import router as config_router
from app.api.tasks import router as task_router
from app.api.wallet import router as wallet_router
from app.api.swarm import router as swarm_router
from app.api.hardware import router as hardware_router
from app.api.marketplace import router as marketplace_router
from app.api.users import router as users_router
from app.api.whatsapp import router as whatsapp_router
from app.api.evolution import router as evolution_router
from app.api.system import router as system_router
from app.api.saas import router as saas_router
from app.api.security import router as security_router
from app.api.intelligence import router as intelligence_router
from app.api.capabilities import router as capabilities_router
from app.api.beta import router as beta_router
from app.api.admin import router as admin_router
from app.api.billing import router as billing_router
from app.api.backups import router as backups_router
from app.api.notifications import router as notifications_router
from app.api.replay import router as replay_router
from app.api.deploy_webhook import router as deploy_router
from app.core.rate_limiter import RateLimitMiddleware
from app.core.stability_engine import StabilityMiddleware

VERSION = "1.0 Stable"
ENV = _ENV

app = FastAPI(
    title="Quantify OS API",
    version=VERSION,
    docs_url=None if ENV == "production" else "/docs",
    redoc_url=None if ENV == "production" else "/redoc"
)

# Store dev test token on app state (only usable in non-production)
app.state.dev_test_token = get_dev_test_token() if ENV != "production" else None
app.include_router(config_router)
app.include_router(task_router)
app.include_router(wallet_router)
app.include_router(swarm_router)
app.include_router(hardware_router)
app.include_router(marketplace_router)
app.include_router(users_router)
app.include_router(whatsapp_router)
app.include_router(evolution_router)
app.include_router(system_router)
app.include_router(saas_router)
app.include_router(security_router)
app.include_router(intelligence_router)
app.include_router(capabilities_router)
app.include_router(beta_router)
app.include_router(admin_router)
app.include_router(billing_router)
app.include_router(backups_router)
app.include_router(notifications_router)
app.include_router(replay_router)
app.include_router(deploy_router)

# Enable CORS for the Next.js frontend (dev + production)
_cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]
# Add production origins from environment
_extra_origins = os.getenv("CORS_ORIGINS", "")
if _extra_origins:
    _cors_origins.extend([o.strip() for o in _extra_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting (100 requests/minute per client)
app.add_middleware(RateLimitMiddleware, requests_per_minute=100, burst_limit=20)

# Global Stability Guard — catches ALL unhandled exceptions, prevents crashes
app.add_middleware(StabilityMiddleware)

@app.on_event("startup")
async def startup_event():
    """
    Initializes background processes on server start.
    """
    import asyncio
    from app.autonomy.evolution_orchestrator import run_global_evolution
    # We use a default user/workspace ID for the global loop for now
    # In multi-tenant, this would loop through active workspaces
    asyncio.create_task(run_global_evolution("Me", "default-Me"))
    
    from app.autonomy.stability import start_stability_monitor
    asyncio.create_task(start_stability_monitor())
    
    print("Global Evolution & Stability Engine Started")

@app.get("/api/health")
async def public_health():
    """
    Public health check heartbeat for cloud load balancers.
    """
    return {"status": "ok", "timestamp": int(__import__("time").time() * 1000)}

# Production Logging Optimization
if ENV == "production":
    import logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    # Filter out noisy Uvicorn logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

@app.get("/")
async def root():
    return {
        "os": "Quantify OS",
        "version": VERSION,
        "status": "stable",
        "mode": ENV
    }

@app.get("/api/user/me")
async def get_me(user = Depends(get_current_user)):
    """
    Returns the current authenticated user's profile from RTDB.
    """
    user_id = user["uid"]
    ref = db_admin.reference(f"users/{user_id}")
    user_data = ref.get()
    
    if not user_data:
        # --- PUBLIC BETA ONBOARDING ---
        user_data = {
            "email": user.get("email"),
            "name": user.get("name", "Beta User"),
            "plan": "beta",
            "beta_mode": True,
            "created_at": int(__import__("time").time() * 1000)
        }
        ref.set(user_data)
        
        # 1. Provision Default Workspace
        workspace_id = f"default-{user_id}"
        workspace_ref = db_admin.reference(f"workspaces/{workspace_id}")
        workspace_ref.set({
            "name": "My Beta Workspace",
            "owner": user_id,
            "created_at": int(__import__("time").time() * 1000)
        })
        
        # 2. Grant Membership
        db_admin.reference(f"memberships/{user_id}/{workspace_id}").set("admin")
        
        # 3. Set Beta Limits (5 Agents, 50 Tasks/hr)
        from app.core.saas import SaaSController, WorkspaceManager
        sc = SaaSController()
        limits_ref = db_admin.reference(f"workspace_limits/{workspace_id}")
        limits_ref.set(sc.default_limits) # Uses 5 / 50 from saas.py
        
        # 4. Initialize Local Directory
        WorkspaceManager(workspace_id) # Creates folders
        
        return user_data
    
    return user_data

@app.get("/api/workspaces")
async def get_workspaces(user = Depends(get_current_user)):
    """
    Returns the list of workspaces the user is a member of from RTDB.
    """
    user_id = user["uid"]
    # memberships: /memberships/{user_id}/{workspace_id} = {role}
    membership_ref = db_admin.reference(f"memberships/{user_id}")
    memberships = membership_ref.get() or {}
    
    workspaces = []
    for workspace_id, role in memberships.items():
        workspace_doc = db_admin.reference(f"workspaces/{workspace_id}").get()
        if workspace_doc:
            workspace_doc["id"] = workspace_id
            workspace_doc["role"] = role
            workspaces.append(workspace_doc)
            
    return workspaces

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
