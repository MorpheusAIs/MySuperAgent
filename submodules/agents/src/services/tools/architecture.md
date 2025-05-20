# Tools Service Architecture

## Overview

The Tools Service is designed to decouple tool implementations from agents, allowing tools to be shared, maintained, and extended independently. This service follows a registry pattern similar to the existing orchestrator's tool registry but provides more robust categorization, versioning, and discovery capabilities.

## Design Goals

1. **Separation of Concerns**: Decouple tool implementations from agent implementations
2. **Reusability**: Allow any agent to use any tool 
3. **Maintainability**: Centralize tool implementations for easier updates and fixes
4. **Discoverability**: Provide clear documentation and metadata for each tool
5. **Extensibility**: Make it easy to add new tools without modifying existing code
6. **Backwards Compatibility**: Support existing agent implementations during transition

## Directory Structure

```
/services/
  /tools/
    __init__.py
    registry.py                 # Central tool registry
    interfaces.py               # Core interfaces and base classes
    exceptions.py               # Tool-specific exceptions
    utils.py                    # Shared utility functions
    
    /categories/               # Tools organized by category
      __init__.py
      
      /blockchain/             # Blockchain-related tools
        __init__.py
        base.py                # Base blockchain tools
        ethereum.py            # Ethereum-specific tools
        
      /data/                   # Data retrieval and analysis tools
        __init__.py
        crypto_data.py         # Cryptocurrency data tools
        market_data.py         # Market data tools
        
      /social/                 # Social media tools
        __init__.py
        twitter.py             # Twitter/X tools
        
      /content/                # Content generation tools
        __init__.py
        text_generation.py     # Text generation tools
        image_generation.py    # Image generation tools
        
      /search/                 # Search and retrieval tools
        __init__.py
        web_search.py          # Web search tools
        
      /external/               # External API integrations
        __init__.py
        rugcheck.py            # Rugcheck API tools
        dexscreener.py         # Dexscreener API tools
        elfa.py                # Elfa API tools
```

## Core Components

### Tool Class

Each tool will be implemented as a standalone class that extends a base `Tool` class:

```python
class Tool:
    """Base class for all tools."""
    
    name: str
    description: str
    parameters: Dict[str, Any]
    category: str
    version: str = "1.0.0"
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the tool with the provided parameters."""
        raise NotImplementedError("Tool must implement execute method")
        
    @property
    def schema(self) -> Dict[str, Any]:
        """Return JSONSchema for the tool."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "category": self.category,
            "version": self.version,
        }
```

### Registry

The `ToolRegistry` will maintain a catalog of all registered tools:

```python
class ToolRegistry:
    """Registry for managing available tools."""
    
    _tools: Dict[str, Tool] = {}
    
    @classmethod
    def register(cls, tool: Tool) -> None:
        """Register a tool with the registry."""
        cls._tools[tool.name] = tool
        
    @classmethod
    def get(cls, name: str) -> Tool:
        """Get a tool by name."""
        return cls._tools[name]
        
    @classmethod
    def get_by_category(cls, category: str) -> List[Tool]:
        """Get all tools in a category."""
        return [tool for tool in cls._tools.values() if tool.category == category]
        
    @classmethod
    def all(cls) -> List[Tool]:
        """Get all registered tools."""
        return list(cls._tools.values())
        
    @classmethod
    def schemas(cls) -> List[Dict[str, Any]]:
        """Get schemas for all registered tools."""
        return [tool.schema for tool in cls._tools.values()]
```

### Tool Categories

Tools will be organized by functional categories:
- **Blockchain**: Tools for blockchain transactions and interactions
- **Data**: Tools for data retrieval and analysis
- **Social**: Tools for social media interactions
- **Content**: Tools for content generation
- **Search**: Tools for search and retrieval
- **External**: Tools that integrate with external APIs

## Integration with Agents

Agents will now depend on the tools service rather than implementing tools themselves:

1. Agents will declare which tools they need in their config
2. The agent framework will inject the required tools during initialization
3. Tool execution will be delegated to the tools service

```python
# Example of an agent using the tools service
class YourAgent(AgentCore):
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        # Get required tools from registry
        self.tools = [ToolRegistry.get(tool_name) for tool_name in config.get("required_tools", [])]
        self.tools_provided = [tool.schema for tool in self.tools]
        
    async def _execute_tool(self, func_name: str, args: Dict[str, Any]) -> AgentResponse:
        """Execute a tool by name."""
        try:
            # Find the tool
            tool = next((t for t in self.tools if t.name == func_name), None)
            if not tool:
                return AgentResponse.error(error_message=f"Tool {func_name} not found")
                
            # Execute the tool
            result = await tool.execute(**args)
            
            # Process result and return response
            return AgentResponse.success(content=result)
        except Exception as e:
            return AgentResponse.error(error_message=str(e))
```

## Migration Strategy

1. Create the new tools service directory structure
2. Implement the core interfaces and registry
3. Migrate tools from one agent at a time, starting with the base_agent
4. Update each agent to use the tools service
5. Test and validate each migration
6. Update documentation and examples

## Benefits of the New Architecture

1. **Better Code Organization**: Tools are categorized by function
2. **Reduced Duplication**: Common tools are implemented once
3. **Easier Maintenance**: Updates can be made in one place
4. **Improved Testing**: Tools can be tested independently of agents
5. **Better Discovery**: Tools can be browsed and documented centrally
6. **Enhanced Collaboration**: Multiple developers can work on tools independently