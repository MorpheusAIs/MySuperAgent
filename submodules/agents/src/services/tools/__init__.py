"""
Tools Service for MySuperAgent.

This package provides a registry of tools that can be used by agents.
Tools are organized by category and provide standardized interfaces.
"""

from services.tools.bootstrap import bootstrap_tools, get_tools_for_agent, register_tool_manually
from services.tools.interfaces import Tool, ToolCategory, ToolFactory
from services.tools.registry import ToolRegistry
from services.tools.exceptions import (
    ToolError,
    ToolExecutionError,
    ToolNotFoundError,
    ToolConfigurationError,
    ToolValidationError,
    ToolAuthenticationError,
    ToolRateLimitError
)

__all__ = [
    "Tool",
    "ToolCategory",
    "ToolFactory",
    "ToolRegistry",
    "ToolError",
    "ToolExecutionError",
    "ToolNotFoundError",
    "ToolConfigurationError",
    "ToolValidationError",
    "ToolAuthenticationError",
    "ToolRateLimitError",
    "bootstrap_tools",
    "get_tools_for_agent",
    "register_tool_manually",
]

# Initialize the tools registry when the package is imported
bootstrap_tools()