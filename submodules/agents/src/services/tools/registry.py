"""
Tool registry – stores tool instances and exposes metadata so agents
can discover and use them.
"""

from __future__ import annotations

import importlib
import inspect
import logging
import os
from typing import Any, Dict, List, Optional, Type

from services.tools.exceptions import ToolNotFoundError
from services.tools.interfaces import Tool, ToolCategory

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Registry for managing available tools."""
    
    _tools: Dict[str, Tool] = {}
    _initialized: bool = False
    
    @classmethod
    def register(cls, tool: Tool) -> None:
        """
        Register a tool with the registry.
        
        Args:
            tool: The tool instance to register.
        """
        if tool.name in cls._tools:
            logger.warning(f"Tool with name '{tool.name}' already registered. Overwriting.")
        
        cls._tools[tool.name] = tool
        logger.debug(f"Registered tool: {tool.name} ({tool.__class__.__name__})")
    
    @classmethod
    def get(cls, name: str) -> Tool:
        """
        Get a tool by name.
        
        Args:
            name: The name of the tool to retrieve.
            
        Returns:
            Tool: The tool instance.
            
        Raises:
            ToolNotFoundError: If the tool is not found.
        """
        if name not in cls._tools:
            raise ToolNotFoundError(name)
        
        return cls._tools[name]
    
    @classmethod
    def get_by_category(cls, category: str) -> List[Tool]:
        """
        Get all tools in a category.
        
        Args:
            category: The category to filter by.
            
        Returns:
            List[Tool]: List of tools in the specified category.
        """
        return [tool for tool in cls._tools.values() if tool.category == category]
    
    @classmethod
    def all(cls) -> List[Tool]:
        """
        Get all registered tools.
        
        Returns:
            List[Tool]: List of all tool instances.
        """
        return list(cls._tools.values())
    
    @classmethod
    def all_names(cls) -> List[str]:
        """
        Get the names of all registered tools.
        
        Returns:
            List[str]: List of tool names.
        """
        return list(cls._tools.keys())
    
    @classmethod
    def schemas(cls) -> List[Dict[str, Any]]:
        """
        Get schemas for all registered tools.
        
        Returns:
            List[Dict[str, Any]]: List of tool schemas.
        """
        return [tool.schema for tool in cls._tools.values()]
    
    @classmethod
    def clear(cls) -> None:
        """Clear all registered tools."""
        cls._tools.clear()
        cls._initialized = False
    
    @classmethod
    def initialize(cls) -> None:
        """
        Initialize the registry by discovering and registering all tools.
        This will scan the tools directory and automatically register all tools.
        """
        if cls._initialized:
            logger.debug("Tool registry already initialized")
            return
        
        # Discover and register tools
        cls._discover_tools()
        cls._initialized = True
    
    @classmethod
    def _discover_tools(cls) -> None:
        """
        Discover and register all tools in the tools directory.
        """
        # Get the base path for the tools package
        import services.tools.categories as categories_package
        base_path = os.path.dirname(categories_package.__file__)
        
        # Loop through all category directories
        for category in ToolCategory.all():
            category_path = os.path.join(base_path, category)
            if not os.path.isdir(category_path):
                continue
            
            # Loop through all Python files in the category
            for filename in os.listdir(category_path):
                if not filename.endswith(".py") or filename.startswith("__"):
                    continue
                
                # Import the module
                module_name = filename[:-3]  # Remove .py extension
                module_path = f"services.tools.categories.{category}.{module_name}"
                
                try:
                    module = importlib.import_module(module_path)
                    
                    # Find all Tool classes in the module
                    for name, obj in inspect.getmembers(module):
                        if (
                            inspect.isclass(obj) 
                            and issubclass(obj, Tool) 
                            and obj != Tool 
                            and not inspect.isabstract(obj)
                        ):
                            # Create an instance and register it
                            try:
                                tool_instance = obj()
                                cls.register(tool_instance)
                            except Exception as e:
                                logger.error(f"Failed to register tool {name}: {e}")
                
                except Exception as e:
                    logger.error(f"Failed to import module {module_path}: {e}")