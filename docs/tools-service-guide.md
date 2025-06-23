# Tools Service Guide

## Overview

The Tools Service is a dedicated service for managing tools that can be used by agents. It provides a registry of tools that can be discovered and used by any agent, enabling better reusability, maintainability, and extensibility of tools across the platform.

## Key Features

- **Centralized Tool Registry**: All tools are registered in a central registry for easy discovery.
- **Categorized Tools**: Tools are organized by functional category (blockchain, data, social, etc.).
- **Dynamic Discovery**: Tools are automatically discovered and registered at runtime.
- **Standardized Interface**: All tools implement a consistent interface for execution.
- **Reusability**: Any agent can use any tool through a consistent interface.
- **Error Handling**: Standardized error handling and reporting across all tools.

## Directory Structure

The Tools Service is organized as follows:

```
/services/
  /tools/
    __init__.py                # Package initialization
    registry.py                # Tool registry implementation
    interfaces.py              # Core interfaces and base classes
    exceptions.py              # Tool-specific exceptions
    utils.py                   # Shared utility functions
    bootstrap.py               # Tool initialization functions
    
    /categories/               # Tools organized by category
      /blockchain/             # Blockchain-related tools
      /data/                   # Data retrieval and analysis tools
      /social/                 # Social media tools
      /content/                # Content generation tools
      /search/                 # Search and retrieval tools
      /external/               # External API integrations
```

## Creating a New Tool

To create a new tool, follow these steps:

1. **Choose a Category**: Identify which category your tool belongs to.

2. **Create a New Tool Class**: Create a new class that extends the `Tool` base class:

```python
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage

class YourTool(Tool):
    """Tool description."""
    
    name = "your_tool_name"
    description = "Description of what your tool does"
    category = "category_name"  # e.g., blockchain, data, social
    parameters = {
        "type": "object",
        "properties": {
            "param1": {"type": "string", "description": "Description of parameter 1"},
            "param2": {"type": "integer", "description": "Description of parameter 2"},
        },
        "required": ["param1"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the tool with the provided parameters."""
        log_tool_usage(self.name, kwargs)
        
        # Extract parameters
        param1 = kwargs.get("param1")
        param2 = kwargs.get("param2", 0)  # Default value for optional param
        
        # Implement the tool logic
        return await self._your_tool_implementation(param1, param2)
    
    @handle_tool_exceptions("your_tool_name")
    async def _your_tool_implementation(self, param1: str, param2: int) -> Dict[str, Any]:
        """
        Implement your tool logic here.
        
        Args:
            param1: First parameter
            param2: Second parameter
            
        Returns:
            Dict[str, Any]: Result of the tool execution
        """
        # Implement your tool logic here
        result = {"success": True, "param1": param1, "param2": param2}
        
        # Include a user-friendly message
        result["message"] = f"Successfully processed {param1} with {param2}."
        
        return result
```

3. **Register in __init__.py**: Add your tool to the category's `__init__.py` file:

```python
from services.tools.categories.your_category.your_module import YourTool

__all__ = [
    # ... existing tools
    "YourTool",
]
```

4. **Test Your Tool**: Create a test for your tool to ensure it works correctly.

## Using Tools in Agents

To use tools in your agents, follow these steps:

1. **Import the Tools Service**:

```python
from services.tools import bootstrap_tools, get_tools_for_agent, ToolRegistry
```

2. **Initialize Tools in Your Agent**:

```python
class YourAgent(AgentCore):
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        # Ensure tools are registered
        bootstrap_tools()
        
        # Get tool schemas for LLM
        self.tools_provided = config.get("tools", [])
        
        # Get actual tool instances
        self.tools = get_tools_for_agent("your_agent_name")
```

3. **Execute Tools in Your Agent**:

```python
async def _execute_tool(self, func_name: str, args: Dict[str, Any]) -> AgentResponse:
    """Execute a tool by name."""
    try:
        # Find the tool
        if func_name in self.tools:
            tool = self.tools[func_name]
            
            # Execute the tool
            result = await tool.execute(**args)
            
            # Process result and return response
            return AgentResponse.success(content=result.get("message", str(result)))
        else:
            return AgentResponse.needs_info(
                content=f"I don't know how to {func_name} yet. Please try a different action."
            )
    except Exception as e:
        logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
        return AgentResponse.error(error_message=str(e))
```

## Error Handling

The Tools Service provides standardized error handling through the `handle_tool_exceptions` decorator. This decorator catches exceptions and wraps them in a `ToolExecutionError` with appropriate context.

```python
@handle_tool_exceptions("your_tool_name")
async def your_function():
    # Your code here
    pass
```

## Tool Categories

Tools are organized into the following categories:

- **blockchain**: Tools for blockchain transactions and interactions
- **data**: Tools for data retrieval and analysis
- **social**: Tools for social media interactions
- **content**: Tools for content generation
- **search**: Tools for search and retrieval
- **external**: Tools that integrate with external APIs

## Best Practices

1. **Tool Naming**: Use clear, descriptive names for your tools.
2. **Error Handling**: Always use the `handle_tool_exceptions` decorator.
3. **Logging**: Use `log_tool_usage` to track tool usage.
4. **Parameter Validation**: Clearly document parameters and their requirements.
5. **User Messages**: Include user-friendly messages in your results.
6. **Documentation**: Document your tool with docstrings.

## Migrating Existing Agent Tools

To migrate tools from an existing agent to the Tools Service:

1. Create a new file for your tools in the appropriate category directory.
2. Convert each tool function to a class that extends `Tool`.
3. Implement the `execute` method for each tool.
4. Update your agent to use the Tools Service.
5. Test that everything still works correctly.

## Debugging Tools

For debugging tools, you can use the `ToolRegistry` directly:

```python
from services.tools import ToolRegistry, bootstrap_tools

# Initialize tools
bootstrap_tools()

# Get a specific tool
tool = ToolRegistry.get("your_tool_name")

# Execute the tool directly
result = await tool.execute(param1="value1", param2="value2")
print(result)
```