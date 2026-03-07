import os
import importlib.util
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import json

class Tool(ABC):
    """
    Base class for all tools.
    """
    def __init__(self, name: str, description: str, parameters: Dict[str, Any]):
        self.name = name
        self.description = description
        self.parameters = parameters # JSON Schema format

    @abstractmethod
    async def run(self, **kwargs) -> Any:
        """
        Execute the tool logic.
        """
        pass

    def to_openai_tool(self) -> Dict[str, Any]:
        """
        Converts the tool definition to OpenAI's tool format.
        """
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }

class MarketplaceManager:
    """
    Dynamic tool discovery and installation from the /marketplace directory.
    """
    def __init__(self, marketplace_dir: str):
        self.marketplace_dir = marketplace_dir
        if not os.path.exists(self.marketplace_dir):
            os.makedirs(self.marketplace_dir)

    def discover_tools(self) -> List[Tool]:
        """
        Scans the marketplace for .py files and attempts to load Tool classes.
        """
        new_tools = []
        for filename in os.listdir(self.marketplace_dir):
            if filename.endswith(".py") and not filename.startswith("__"):
                module_path = os.path.join(self.marketplace_dir, filename)
                module_name = filename[:-3]
                
                try:
                    spec = importlib.util.spec_from_file_location(module_name, module_path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    
                    # Look for attributes that are instances of Tool or classes that inherit from Tool
                    for attr_name in dir(module):
                        attr = getattr(module, attr_name)
                        if isinstance(attr, Tool):
                            new_tools.append(attr)
                        elif isinstance(attr, type) and issubclass(attr, Tool) and attr is not Tool:
                            # If it's a class, try to instantiate it with default params or registry-led params
                            # Note: This expects tools to be instantiated as objects in the module or 
                            # we search specifically for a 'EXPORT_TOOLS' list.
                            pass
                            
                    # Optimized approach: Modules should define an 'UPGRADE_TOOLS' list
                    if hasattr(module, "UPGRADE_TOOLS"):
                        for t in module.UPGRADE_TOOLS:
                            if isinstance(t, Tool):
                                new_tools.append(t)
                                
                except Exception as e:
                    print(f"MARKETPLACE: Failed to load {filename}: {e}")
        
        return new_tools

class ToolRegistry:
    """
    Registry to manage and retrieve tools.
    """
    def __init__(self):
        self.tools: Dict[str, Tool] = {}
        # Market location is one level above quantifyos or configurable
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        market_path = os.path.join(base_dir, "marketplace")
        self.marketplace = MarketplaceManager(market_path)

    def register_tool(self, tool: Tool):
        self.tools[tool.name] = tool
        print(f"Tool registered: {tool.name}")

    def install_from_marketplace(self):
        """
        Trigger a re-scan of the marketplace and register discovered tools.
        """
        new_tools = self.marketplace.discover_tools()
        for t in new_tools:
            self.register_tool(t)

    def get_tool(self, name: str) -> Optional[Tool]:
        # Lazily check marketplace if tool not in memory?
        t = self.tools.get(name)
        if not t:
            self.install_from_marketplace()
            t = self.tools.get(name)
        return t

    def list_tools(self) -> List[Tool]:
        return list(self.tools.values())

    def get_openai_tools(self) -> List[Dict[str, Any]]:
        return [tool.to_openai_tool() for tool in self.tools.values()]

# Global registry instance
registry = ToolRegistry()

def init_tools():
    """
    Called once at application startup to populate the registry.
    """
    # Register core tools
    from app.tools.web_search import WEB_SEARCH_TOOLS
    for tool in WEB_SEARCH_TOOLS:
        registry.register_tool(tool)

    # Register structural self-refactoring tools
    from app.tools.code_editor import STRUCTURAL_TOOLS
    for tool in STRUCTURAL_TOOLS:
        registry.register_tool(tool)

    # Register industrial hardware tools
    try:
        from app.tools.hardware import HARDWARE_TOOLS
        for tool in HARDWARE_TOOLS:
            registry.register_tool(tool)
    except Exception as e:
        print(f"CORE: Failed to load hardware tools: {e}")
        
    # Initial marketplace scan
    registry.install_from_marketplace()
