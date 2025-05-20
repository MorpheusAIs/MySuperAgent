"""
Utility functions for the tools service.
These provide common functionality used across different tools.
"""

import functools
import logging
from typing import Any, Callable, Dict, TypeVar

from services.tools.exceptions import ToolExecutionError

logger = logging.getLogger(__name__)

# Type variable for function return type
T = TypeVar("T")


def handle_tool_exceptions(tool_name: str) -> Callable:
    """
    Decorator to handle exceptions in tool execution.
    
    Args:
        tool_name: The name of the tool being executed.
        
    Returns:
        Callable: The decorated function.
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            try:
                return await func(*args, **kwargs)
            except ToolExecutionError as e:
                # Re-raise tool-specific exceptions
                e.tool_name = tool_name
                logger.error(f"Tool execution error ({tool_name}): {e.message}", exc_info=True)
                raise
            except Exception as e:
                # Wrap other exceptions in a ToolExecutionError
                logger.error(f"Tool execution error ({tool_name}): {str(e)}", exc_info=True)
                raise ToolExecutionError(str(e), tool_name)
        return wrapper
    return decorator


def log_tool_usage(tool_name: str, params: Dict[str, Any]) -> None:
    """
    Log usage of a tool for monitoring and debugging.
    
    Args:
        tool_name: The name of the tool being used.
        params: The parameters passed to the tool.
    """
    # Filter sensitive information from logs
    filtered_params = {
        k: v if not _is_sensitive_param(k) else "[REDACTED]"
        for k, v in params.items()
    }
    
    logger.info(
        f"Tool usage: {tool_name} with params: {filtered_params}"
    )


def _is_sensitive_param(param_name: str) -> bool:
    """
    Determine if a parameter might contain sensitive information.
    
    Args:
        param_name: The name of the parameter.
        
    Returns:
        bool: True if the parameter is sensitive, False otherwise.
    """
    sensitive_keywords = [
        "key", "token", "secret", "password", "auth", "credential", 
        "private", "apikey", "api_key"
    ]
    
    return any(keyword in param_name.lower() for keyword in sensitive_keywords)


def format_tool_result(result: Dict[str, Any]) -> str:
    """
    Format a tool result for display to a user.
    
    Args:
        result: The raw result from the tool.
        
    Returns:
        str: A formatted string representation of the result.
    """
    # Simple formatting for now, can be enhanced based on specific tool needs
    if not result:
        return "No results."
    
    if "message" in result:
        return result["message"]
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Default formatting for success results
    if "success" in result and result["success"]:
        if "data" in result:
            return f"Success: {result['data']}"
        return "Operation completed successfully."
    
    # Return a simple string representation of the result
    return str(result)