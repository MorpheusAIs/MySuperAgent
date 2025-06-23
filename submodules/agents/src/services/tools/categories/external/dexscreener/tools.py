"""
Tools for fetching cryptocurrency token data from DexScreener.
"""

import logging
from typing import Any, Dict, List, Optional

import aiohttp
from services.agents.dexscreener.config import Config
from services.agents.dexscreener.models import (
    BoostedToken,
    BoostedTokenResponse,
    DexPair,
    DexPairSearchResponse,
    TokenProfile,
    TokenProfileResponse,
)
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage

logger = logging.getLogger(__name__)


# Helper functions
def filter_by_chain(tokens: List[Dict[str, Any]], chain_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Filter tokens by chain ID if provided."""
    if not chain_id:
        return tokens
    return [token for token in tokens if token.get("chainId", "").lower() == chain_id.lower()]


async def _make_request(endpoint: str) -> Dict[str, Any]:
    """Make an API request to DexScreener."""
    url = f"{Config.BASE_URL}{endpoint}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"API request failed with status {response.status}")
                return await response.json()
    except Exception as e:
        logger.error(f"API request failed: {str(e)}", exc_info=True)
        raise Exception(f"Failed to fetch data: {str(e)}")


class LatestTokenProfilesTool(Tool):
    """Tool for fetching latest token profiles from DexScreener."""
    
    name = "get_latest_token_profiles"
    description = "Get the latest token profiles from DexScreener"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {
            "chain_id": {
                "type": "string",
                "description": "Optional chain ID to filter results (e.g., 'solana', 'ethereum')",
            }
        },
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the latest token profiles tool.
        
        Args:
            chain_id: Optional chain ID to filter results
            
        Returns:
            Dict[str, Any]: The token profiles information
            
        Raises:
            ToolExecutionError: If the token profiles retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        chain_id = kwargs.get("chain_id")
        
        return await self._get_latest_token_profiles(chain_id)
    
    @handle_tool_exceptions("get_latest_token_profiles")
    async def _get_latest_token_profiles(self, chain_id: Optional[str] = None) -> Dict[str, Any]:
        """Get the latest token profiles, optionally filtered by chain."""
        try:
            endpoint = Config.ENDPOINTS["get_latest_token_profiles"]
            response = await _make_request(endpoint)
            tokens_data: List[Dict[str, Any]] = response if isinstance(response, list) else []
            filtered_tokens = filter_by_chain(tokens_data, chain_id)
            tokens = [TokenProfile(**token) for token in filtered_tokens]
            
            # Create response object
            api_result = TokenProfileResponse(tokens=tokens, chain_id=chain_id)
            
            # Return serialized response
            result = api_result.model_dump()
            result["message"] = api_result.formatted_response
            return result
            
        except Exception as e:
            raise ToolExecutionError(f"Failed to get token profiles: {str(e)}", self.name)


class LatestBoostedTokensTool(Tool):
    """Tool for fetching latest boosted tokens from DexScreener."""
    
    name = "get_latest_boosted_tokens"
    description = "Get the latest boosted tokens from DexScreener"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {
            "chain_id": {
                "type": "string",
                "description": "Optional chain ID to filter results (e.g., 'solana', 'ethereum')",
            }
        },
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the latest boosted tokens tool.
        
        Args:
            chain_id: Optional chain ID to filter results
            
        Returns:
            Dict[str, Any]: The boosted tokens information
            
        Raises:
            ToolExecutionError: If the boosted tokens retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        chain_id = kwargs.get("chain_id")
        
        return await self._get_latest_boosted_tokens(chain_id)
    
    @handle_tool_exceptions("get_latest_boosted_tokens")
    async def _get_latest_boosted_tokens(self, chain_id: Optional[str] = None) -> Dict[str, Any]:
        """Get the latest boosted tokens, optionally filtered by chain."""
        try:
            endpoint = Config.ENDPOINTS["get_latest_boosted_tokens"]
            response = await _make_request(endpoint)
            tokens_data: List[Dict[str, Any]] = response if isinstance(response, list) else []
            filtered_tokens = filter_by_chain(tokens_data, chain_id)
            tokens = [BoostedToken(**token) for token in filtered_tokens]
            
            # Create response object
            api_result = BoostedTokenResponse(tokens=tokens, chain_id=chain_id)
            
            # Return serialized response
            result = api_result.model_dump()
            result["message"] = api_result.formatted_response
            return result
            
        except Exception as e:
            raise ToolExecutionError(f"Failed to get boosted tokens: {str(e)}", self.name)


class TopBoostedTokensTool(Tool):
    """Tool for fetching top boosted tokens from DexScreener."""
    
    name = "get_top_boosted_tokens"
    description = "Get the tokens with most active boosts"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {
            "chain_id": {
                "type": "string",
                "description": "Optional chain ID to filter results (e.g., 'solana', 'ethereum')",
            }
        },
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the top boosted tokens tool.
        
        Args:
            chain_id: Optional chain ID to filter results
            
        Returns:
            Dict[str, Any]: The top boosted tokens information
            
        Raises:
            ToolExecutionError: If the top boosted tokens retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        chain_id = kwargs.get("chain_id")
        
        return await self._get_top_boosted_tokens(chain_id)
    
    @handle_tool_exceptions("get_top_boosted_tokens")
    async def _get_top_boosted_tokens(self, chain_id: Optional[str] = None) -> Dict[str, Any]:
        """Get tokens with most active boosts, optionally filtered by chain."""
        try:
            endpoint = Config.ENDPOINTS["get_top_boosted_tokens"]
            response = await _make_request(endpoint)
            tokens_data: List[Dict[str, Any]] = response if isinstance(response, list) else []
            filtered_tokens = filter_by_chain(tokens_data, chain_id)
            
            # Sort by total amount
            sorted_tokens = sorted(
                filtered_tokens,
                key=lambda x: float(x.get("totalAmount", 0) or 0),
                reverse=True,
            )
            tokens = [BoostedToken(**token) for token in sorted_tokens]
            
            # Create response object
            api_result = BoostedTokenResponse(tokens=tokens, chain_id=chain_id)
            
            # Return serialized response
            result = api_result.model_dump()
            result["message"] = api_result.formatted_response
            return result
            
        except Exception as e:
            raise ToolExecutionError(f"Failed to get top boosted tokens: {str(e)}", self.name)


class SearchDexPairsTool(Tool):
    """Tool for searching DEX pairs on DexScreener."""
    
    name = "search_dex_pairs"
    description = "Search for DEX trading pairs and their activity"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query (e.g., token symbol like 'ETH' or 'BTC')",
            }
        },
        "required": ["query"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the search DEX pairs tool.
        
        Args:
            query: Search query for DEX pairs
            
        Returns:
            Dict[str, Any]: The DEX pairs search results
            
        Raises:
            ToolExecutionError: If the DEX pairs search fails
        """
        log_tool_usage(self.name, kwargs)
        
        query = kwargs.get("query")
        if not query:
            raise ToolExecutionError("Search query must be provided", self.name)
        
        return await self._search_dex_pairs(query)
    
    @handle_tool_exceptions("search_dex_pairs")
    async def _search_dex_pairs(self, query: str) -> Dict[str, Any]:
        """Search for DEX pairs matching the query."""
        try:
            endpoint = f"{Config.ENDPOINTS['search_dex_pairs']}?q={query}"
            response = await _make_request(endpoint)
            pairs_data = response.get("pairs", [])
            pairs = [DexPair(**pair) for pair in pairs_data]
            
            # Create response object
            api_result = DexPairSearchResponse(pairs=pairs)
            
            # Return serialized response
            result = api_result.model_dump()
            result["message"] = api_result.formatted_response
            return result
            
        except Exception as e:
            raise ToolExecutionError(f"Failed to search DEX pairs: {str(e)}", self.name)