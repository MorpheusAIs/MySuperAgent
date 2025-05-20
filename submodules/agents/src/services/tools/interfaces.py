"""
Core interfaces and base classes for the tools service.
These define the contract that all tool implementations must follow.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type

logger = logging.getLogger(__name__)


class Tool(ABC):
    """Base class for all tools."""

    name: str
    description: str
    parameters: Dict[str, Any]
    category: str
    version: str = "1.0.0"
    
    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the tool with the provided parameters.
        
        Args:
            **kwargs: The parameters for the tool execution.
            
        Returns:
            Dict[str, Any]: The result of the tool execution.
            
        Raises:
            ToolExecutionError: If the tool execution fails.
        """
        raise NotImplementedError("Tool must implement execute method")
    
    @property
    def schema(self) -> Dict[str, Any]:
        """
        Return JSONSchema for the tool.
        
        Returns:
            Dict[str, Any]: The tool schema in JSONSchema format.
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }


class ToolCategory:
    """Enum-like class for tool categories."""
    
    BLOCKCHAIN = "blockchain"
    DATA = "data"
    SOCIAL = "social"
    CONTENT = "content"
    SEARCH = "search"
    EXTERNAL = "external"
    
    @classmethod
    def all(cls) -> List[str]:
        """
        Get all available categories.
        
        Returns:
            List[str]: List of all categories.
        """
        return [
            cls.BLOCKCHAIN,
            cls.DATA,
            cls.SOCIAL,
            cls.CONTENT,
            cls.SEARCH,
            cls.EXTERNAL,
        ]


class ToolFactory:
    """Factory for creating tool instances based on configuration."""
    
    @staticmethod
    def create_tool(tool_config: Dict[str, Any]) -> Tool:
        """
        Create a tool instance from a config dictionary.
        
        Args:
            tool_config: Configuration dictionary for the tool.
            
        Returns:
            Tool: An instance of the tool.
            
        Raises:
            ValueError: If the tool class cannot be found or instantiated.
        """
        tool_path = tool_config.get("path")
        tool_class = tool_config.get("class")
        
        if not tool_path or not tool_class:
            raise ValueError("Tool config must include 'path' and 'class'")
        
        try:
            # Dynamically import the tool class
            module_parts = tool_path.split(".")
            module_path = ".".join(module_parts)
            module = __import__(module_path, fromlist=[tool_class])
            tool_cls = getattr(module, tool_class)
            
            # Create an instance of the tool
            return tool_cls(**tool_config.get("params", {}))
        except (ImportError, AttributeError) as e:
            logger.error(f"Failed to create tool from config: {e}")
            raise ValueError(f"Failed to create tool: {e}")