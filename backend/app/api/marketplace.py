from fastapi import APIRouter, Depends
from app.core.auth_middleware import get_current_user
from app.core.tool_engine import registry
from typing import Dict, Any

router = APIRouter(prefix="/api/workspaces/{workspace_id}/marketplace", tags=["marketplace"])

@router.get("/catalog")
async def get_marketplace_catalog(workspace_id: str, current_user = Depends(get_current_user)):
    """
    Returns all registered and available tools in the marketplace.
    """
    registered_tools = registry.list_tools()
    
    tools = []
    for tool in registered_tools:
        category = "default"
        if "web" in tool.name or "search" in tool.name or "browser" in tool.name:
            category = "web"
        elif "mqtt" in tool.name or "modbus" in tool.name or "hardware" in tool.name:
            category = "hardware"
        elif "data" in tool.name or "csv" in tool.name or "file" in tool.name:
            category = "data"
        
        tools.append({
            "name": tool.name,
            "description": tool.description,
            "status": "installed",
            "category": category
        })

    # Also scan marketplace directory for uninstalled tools
    import os
    marketplace_dir = registry.marketplace.marketplace_dir
    if os.path.exists(marketplace_dir):
        for fname in os.listdir(marketplace_dir):
            if fname.endswith(".py") and not fname.startswith("__"):
                tool_name = fname[:-3]
                if tool_name not in [t["name"] for t in tools]:
                    tools.append({
                        "name": tool_name,
                        "description": f"Marketplace module: {tool_name}",
                        "status": "available",
                        "category": "default"
                    })

    return {"tools": tools}

@router.post("/install")
async def install_marketplace_tool(workspace_id: str, payload: Dict[str, Any], current_user = Depends(get_current_user)):
    """Triggers a marketplace scan and installs discovered tools."""
    registry.install_from_marketplace()
    return {"status": "installed", "total_tools": len(registry.list_tools())}
