"""
Exception classes for the tools service.
These provide structured error handling specific to tool operations.
"""

from typing import Any, Dict, Optional


class ToolError(Exception):
    """Base exception for all tool-related errors."""
    
    def __init__(self, message: str, tool_name: Optional[str] = None):
        self.message = message
        self.tool_name = tool_name
        super().__init__(self.message)


class ToolExecutionError(ToolError):
    """Exception raised when a tool execution fails."""
    
    def __init__(
        self, 
        message: str, 
        tool_name: Optional[str] = None, 
        details: Optional[Dict[str, Any]] = None
    ):
        self.details = details or {}
        super().__init__(message, tool_name)


class ToolNotFoundError(ToolError):
    """Exception raised when a requested tool is not found in the registry."""
    
    def __init__(self, tool_name: str):
        super().__init__(f"Tool not found: {tool_name}", tool_name)


class ToolConfigurationError(ToolError):
    """Exception raised when a tool is improperly configured."""
    
    def __init__(self, message: str, tool_name: Optional[str] = None):
        super().__init__(message, tool_name)


class ToolValidationError(ToolError):
    """Exception raised when tool parameters fail validation."""
    
    def __init__(
        self, 
        message: str, 
        tool_name: Optional[str] = None, 
        parameter: Optional[str] = None, 
        value: Optional[Any] = None
    ):
        self.parameter = parameter
        self.value = value
        super().__init__(message, tool_name)


class ToolAuthenticationError(ToolError):
    """Exception raised when a tool fails to authenticate with a service."""
    
    def __init__(self, message: str, tool_name: Optional[str] = None, service: Optional[str] = None):
        self.service = service
        super().__init__(message, tool_name)


class ToolRateLimitError(ToolError):
    """Exception raised when a tool hits rate limits on an external service."""
    
    def __init__(
        self, 
        message: str, 
        tool_name: Optional[str] = None, 
        retry_after: Optional[int] = None
    ):
        self.retry_after = retry_after
        super().__init__(message, tool_name)