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

class ToolRegistry:
    """
    Registry to manage and retrieve tools.
    """
    def __init__(self):
        self.tools: Dict[str, Tool] = {}

    def register_tool(self, tool: Tool):
        self.tools[tool.name] = tool
        print(f"Tool registered: {tool.name}")

    def get_tool(self, name: str) -> Optional[Tool]:
        return self.tools.get(name)

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
