import logging
from typing import List, Optional

from crewai import Agent
from crewai.tools import tool
from services.tools.categories.external.codex.tools import (
    ListTopTokensTool,
    GetTopHoldersPercentTool,
    SearchNftsTool,
)

logger = logging.getLogger(__name__)


# Create the tools using the tool decorator
@tool("List Top Tokens")
def list_top_tokens_tool(
    limit: Optional[int] = None, networks: Optional[List[str]] = None, resolution: Optional[str] = None
) -> str:
    """Get a list of trending tokens across specified networks."""
    tool = ListTopTokensTool()
    result = tool.execute(limit=limit, networks=networks, resolution=resolution)
    return result.get("formatted_response", "")


@tool("Get Top Holders Percentage")
def get_top_holders_percent_tool(token_name: str, network: str) -> str:
    """Get the percentage owned by top 10 holders for a token."""
    tool = GetTopHoldersPercentTool()
    result = tool.execute(tokenName=token_name, network=network)
    return result.get("formatted_response", "")


@tool("Search NFT Collections")
def search_nfts_tool(
    search: str,
    limit: Optional[int] = None,
    network_filter: Optional[List[int]] = None,
    filter_wash_trading: Optional[bool] = None,
    window: Optional[str] = None,
) -> str:
    """Search for NFT collections by name or address."""
    tool = SearchNftsTool()
    result = tool.execute(
        search=search,
        limit=limit,
        networkFilter=network_filter,
        filterWashTrading=filter_wash_trading,
        window=window,
    )
    return result.get("formatted_response", "")


# Create the agent directly
codex_agent = Agent(
    role="Codex Market Analyst",
    goal="Provide accurate cryptocurrency market data and NFT collection analysis",
    backstory="You are a specialized market analyst with expertise in "
    "cryptocurrency tokens, holder analysis, and NFT collections data from "
    "Codex.io.",
    verbose=True,
    tools=[list_top_tokens_tool, get_top_holders_percent_tool, search_nfts_tool],
    allow_delegation=False,
)
