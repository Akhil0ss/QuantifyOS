from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class AIProvider(ABC):
    """
    Abstract Base Class for all AI Providers (OpenAI, Anthropic, Gemini, DeepSeek, Local).
    Ensures a standardized interface for text generation and tool execution.
    """
    
    @abstractmethod
    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        """
        Simple text generation.
        """
        pass

    @abstractmethod
    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        """
        Asks the model to select and use a tool.
        Returns the tool name and arguments.
        """
        pass

    @abstractmethod
    async def validate_key(self) -> Optional[str]:
        """
        Validates the API key and returns the primary/best model name if successful.
        """
        pass
