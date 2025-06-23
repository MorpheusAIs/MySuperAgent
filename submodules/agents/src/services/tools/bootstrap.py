"""
Bootstrap the tools registry.

This module provides functions to initialize the tools registry with all
available tools. It follows a pattern similar to the orchestrator's tool bootstrap.
"""

import logging
from typing import Dict, Optional, Type

from services.tools.interfaces import Tool
from services.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)


def bootstrap_tools() -> None:
    """
    Initialize the tool registry with all available tools.
    This will discover and register all tools from each category.
    """
    logger.info("Bootstrapping tools registry...")
    
    # Initialize the registry, which auto-discovers tools in the categories directories
    ToolRegistry.initialize()
    
    # Log the number of tools registered
    tools_count = len(ToolRegistry.all())
    logger.info(f"Bootstrapped {tools_count} tools")


def register_tool_manually(tool_class: Type[Tool]) -> None:
    """
    Manually register a specific tool class.
    Useful for testing or programmatically adding tools.
    
    Args:
        tool_class: The tool class to register.
    """
    try:
        tool_instance = tool_class()
        ToolRegistry.register(tool_instance)
        logger.debug(f"Manually registered tool: {tool_instance.name}")
    except Exception as e:
        logger.error(f"Failed to register tool {tool_class.__name__}: {e}")


def get_tools_for_agent(agent_name: str) -> Dict[str, Tool]:
    """
    Get the tools assigned to a specific agent.
    
    Args:
        agent_name: The name of the agent.
        
    Returns:
        Dict[str, Tool]: Dictionary of tool names to tool instances.
    """
    # This would typically use agent configuration to determine which tools to assign
    # For now, we'll use a simple mapping, but this should come from a configuration source
    
    # Default blockchain tools for the base agent
    if agent_name == "base_agent":
        tools = {}
        for tool_name in [
            "swap_assets", 
            "transfer_asset", 
            "get_balance", 
            "create_token",
            "request_eth_from_faucet",
            "deploy_nft",
            "mint_nft",
            "register_basename"
        ]:
            try:
                tools[tool_name] = ToolRegistry.get(tool_name)
            except Exception as e:
                logger.warning(f"Tool {tool_name} not found for agent {agent_name}: {e}")
        
        return tools
    
    # Return empty dict if agent not recognized
    return {}