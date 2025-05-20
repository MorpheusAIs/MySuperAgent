"""
Tools for retrieving token and NFT data from Codex.io API.
"""

import logging
from typing import Any, Dict, List, Optional

import aiohttp
from services.agents.codex.config import Config
from services.tools.categories.external.codex.models import NftSearchResponse, TokenFilterResult, TopHoldersResponse, TopTokensResponse
from services.tools.categories.external.codex.networks import NETWORK_TO_ID_MAPPING
from services.tools.categories.external.codex.tool_types import CodexToolType
from services.secrets import get_secret
from services.tools.exceptions import ToolExecutionError, ToolAuthenticationError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage

logger = logging.getLogger(__name__)


# Helper functions
async def _make_graphql_request(query: str, variables: Optional[Dict[str, Any]] = None) -> Any:
    """Make a GraphQL request to Codex API."""
    # Get API key from environment
    api_key = get_secret("CodexApiKey")
    if not api_key:
        raise ToolAuthenticationError("CODEX_API_KEY environment variable is not set", service="Codex.io")

    headers = {"Authorization": api_key, "Content-Type": "application/json"}

    data = {"query": query, "variables": variables or {}}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(Config.GRAPHQL_URL, json=data, headers=headers) as response:
                result = await response.json()

                if response.status != 200:
                    error_msg = result.get("message", str(result))
                    raise ToolExecutionError(f"API request failed with status {response.status}: {error_msg}", "codex")

                if "errors" in result:
                    error = result["errors"][0]
                    error_msg = error.get("message", "Unknown GraphQL error")
                    raise ToolExecutionError(f"GraphQL error: {error_msg}", "codex")

                return result["data"]
    except ToolExecutionError:
        raise
    except Exception as e:
        logger.error(f"API request failed: {str(e)}", exc_info=True)
        raise ToolExecutionError(f"Failed to fetch data: {str(e)}", "codex")


async def _filter_tokens(token_name: str, network: str) -> TokenFilterResult:
    """Helper function to find a token ID by name and network."""
    try:
        network_id = NETWORK_TO_ID_MAPPING.get(network)
        if not network_id:
            raise ToolExecutionError(f"Invalid network: {network}", "filter_tokens")

        variables = {
            "phrase": token_name,
            "filters": {
                "network": [network_id],
                "liquidity": {"gt": 100000},
                "txnCount24": {"gt": 200},
            },
            "limit": 1,
        }

        query = """
        query FilterTokens($phrase: String, $filters: TokenFilters, $limit: Int) {
            filterTokens(phrase: $phrase, filters: $filters, limit: $limit) {
                results {
                    buyCount1
                    high1
                    txnCount1
                    uniqueTransactions1
                    volume1
                    liquidity
                    marketCap
                    priceUSD
                    pair {
                        token0
                        token1
                    }
                    exchanges {
                        name
                    }
                    token {
                        address
                        decimals
                        id
                        name
                        networkId
                        symbol
                    }
                }
            }
        }
        """
        logger.info(f"Making GraphQL request to filter tokens with query: {query} and variables: {variables}")
        response = await _make_graphql_request(query, variables)
        logger.info(f"Received filter tokens response: {response}")

        results = response["filterTokens"]["results"]
        logger.info(f"Found {len(results)} matching tokens")

        if not results:
            logger.warning(f"No token found matching {token_name} on {network}")
            raise ToolExecutionError(f"No token found matching {token_name} on {network}", "filter_tokens")

        token_info = TokenFilterResult(**results[0])
        logger.info(f"Selected token info: {token_info}")
        return token_info

    except ToolExecutionError:
        raise
    except Exception as e:
        logger.error(f"Failed to filter tokens: {str(e)}", exc_info=True)
        raise ToolExecutionError(f"Failed to filter tokens: {str(e)}", "filter_tokens")


class ListTopTokensTool(Tool):
    """Tool for retrieving trending tokens from Codex.io."""
    
    name = CodexToolType.LIST_TOP_TOKENS.value
    description = "Get a list of trending tokens across specified networks"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "description": "Maximum number of tokens to return (max 50)",
            },
            "networks": {
                "type": "array", 
                "items": {"type": "string"},
                "description": "List of network names to filter by (Ethereum, Solana, etc.)",
            },
            "resolution": {
                "type": "string",
                "description": "Time frame for trending results (1, 5, 15, 30, 60, 240, 720, or 1D)",
            },
        },
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the list top tokens tool.
        
        Args:
            limit: Maximum number of tokens to return
            networks: List of network names to filter by
            resolution: Time frame for trending results
            
        Returns:
            Dict[str, Any]: The trending tokens information
            
        Raises:
            ToolExecutionError: If the trending tokens retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        limit = kwargs.get("limit")
        networks = kwargs.get("networks")
        resolution = kwargs.get("resolution")
        
        return await self._list_top_tokens(limit, networks, resolution)
    
    @handle_tool_exceptions("list_top_tokens")
    async def _list_top_tokens(
        self, 
        limit: Optional[int] = None,
        networks: Optional[List[str]] = None,
        resolution: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get list of trending tokens across specified networks."""
        try:
            # Map network names to IDs if networks are provided
            network_filter = []
            if networks:
                network_filter = [
                    NETWORK_TO_ID_MAPPING[network] for network in networks if network in NETWORK_TO_ID_MAPPING
                ]

            variables = {
                "limit": min(limit or 20, 50),  # Default 20, max 50
                "network_filter": network_filter,
                "resolution": resolution or "1D",  # Default to 1 day
            }

            query = """
            query ListTopTokens($limit: Int, $networkFilter: [Int!], $resolution: String) {
                listTopTokens(limit: $limit, networkFilter: $networkFilter, resolution: $resolution) {
                    address
                    createdAt
                    decimals
                    id
                    imageBannerUrl
                    imageLargeUrl
                    imageSmallUrl
                    imageThumbUrl
                    isScam
                    lastTransaction
                    liquidity
                    marketCap
                    name
                    networkId
                    price
                    priceChange
                    priceChange1
                    priceChange4
                    priceChange12
                    priceChange24
                    quoteToken
                    resolution
                    symbol
                    topPairId
                    txnCount1
                    txnCount4
                    txnCount12
                    txnCount24
                    uniqueBuys1
                    uniqueBuys4
                    uniqueBuys12
                    uniqueBuys24
                    uniqueSells1
                    uniqueSells4
                    uniqueSells12
                    uniqueSells24
                    volume
                }
            }
            """

            response = await _make_graphql_request(query, variables)
            api_result = TopTokensResponse(success=True, data=response["listTopTokens"])
            
            # Return serialized response
            result = api_result.model_dump()
            result["message"] = api_result.formatted_response
            return result
            
        except Exception as e:
            logger.error(f"Failed to get top tokens: {str(e)}", exc_info=True)
            raise ToolExecutionError(f"Failed to get top tokens: {str(e)}", self.name)


class GetTopHoldersPercentTool(Tool):
    """Tool for retrieving top holders percentage for a token from Codex.io."""
    
    name = CodexToolType.GET_TOP_HOLDERS_PERCENT.value
    description = "Get the top holders for a token. If no network is provided, then LEAVE IT AS NONE"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {
            "tokenName": {
                "type": "string",
                "description": "Token name to get top holders for",
            },
            "network": {
                "type": "string",
                "description": "Network to search for token on. Must be deliberately specified.",
            },
        },
        "required": ["tokenName", "network"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the top holders percentage tool.
        
        Args:
            tokenName: Token name to get top holders for
            network: Network to search for token on
            
        Returns:
            Dict[str, Any]: The top holders information
            
        Raises:
            ToolExecutionError: If the top holders retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        token_name = kwargs.get("tokenName")
        network = kwargs.get("network")
        
        if not token_name:
            raise ToolExecutionError("Token name must be provided", self.name)
            
        if not network:
            raise ToolExecutionError("Network must be provided", self.name)
            
        if network not in NETWORK_TO_ID_MAPPING:
            raise ToolExecutionError(f"Invalid network: {network}", self.name)
        
        return await self._get_top_holders_percent(token_name, network)
    
    @handle_tool_exceptions("get_top_holders_percent")
    async def _get_top_holders_percent(self, token_name: str, network: str) -> Dict[str, Any]:
        """Get percentage owned by top 10 holders for a token."""
        try:
            logger.info(f"Getting top holders percentage for token {token_name} on {network}")
            # Strip special characters from token name
            token_name = "".join(c for c in token_name if c.isalnum() or c.isspace())
            token_name = token_name.strip()

            if not token_name:
                raise ToolExecutionError("Token name cannot be empty after stripping special characters", self.name)

            logger.info(f"Sanitized token name: {token_name}")
            # First get the token info by filtering tokens
            logger.info("Filtering tokens to get token info")
            token_info = await _filter_tokens(token_name, network)
            logger.info(f"Found token info: {token_info}")

            if not token_info.token:
                raise ToolExecutionError("Token info missing token details", self.name)

            # Then get top holders percentage using token ID
            variables = {"tokenId": token_info.token.id}
            logger.info(f"Getting top holders with variables: {variables}")

            query = """
            query GetTop10HoldersPercent($tokenId: String!) {
                top10HoldersPercent(tokenId: $tokenId)
            }
            """

            logger.info("Making GraphQL request for top holders percentage")
            response = await _make_graphql_request(query, variables)
            logger.info(f"Received top holders response: {response}")

            percentage = response["top10HoldersPercent"]
            logger.info(f"Top 10 holders own {percentage}% of token {token_name}")

            api_result = TopHoldersResponse(success=True, data=percentage, token_info=token_info)
            
            # Return serialized response
            result = api_result.model_dump()
            result["message"] = api_result.formatted_response
            return result
            
        except Exception as e:
            logger.error(f"Failed to get top holders percentage: {str(e)}", exc_info=True)
            raise ToolExecutionError(f"Failed to get top holders percentage: {str(e)}", self.name)


class SearchNftsTool(Tool):
    """Tool for searching NFT collections from Codex.io."""
    
    name = CodexToolType.SEARCH_NFTS.value
    description = "Search for NFT collections by name or address"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {
            "search": {
                "type": "string",
                "description": "Query string to search for",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results to return",
            },
            "networkFilter": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "List of network IDs to filter by",
            },
            "filterWashTrading": {
                "type": "boolean",
                "description": "Whether to filter collections linked to wash trading",
            },
            "window": {
                "type": "string",
                "description": "Time frame for stats (1h, 4h, 12h, or 1d)",
            },
        },
        "required": ["search"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the search NFTs tool.
        
        Args:
            search: Query string to search for
            limit: Maximum number of results to return
            networkFilter: List of network IDs to filter by
            filterWashTrading: Whether to filter collections linked to wash trading
            window: Time frame for stats
            
        Returns:
            Dict[str, Any]: The NFT search results
            
        Raises:
            ToolExecutionError: If the NFT search fails
        """
        log_tool_usage(self.name, kwargs)
        
        search = kwargs.get("search")
        limit = kwargs.get("limit")
        network_filter = kwargs.get("networkFilter")
        filter_wash_trading = kwargs.get("filterWashTrading")
        window = kwargs.get("window")
        
        if not search:
            raise ToolExecutionError("Search query must be provided", self.name)
        
        return await self._search_nfts(search, limit, network_filter, filter_wash_trading, window)
    
    @handle_tool_exceptions("search_nfts")
    async def _search_nfts(
        self,
        search: str,
        limit: Optional[int] = None,
        network_filter: Optional[List[int]] = None,
        filter_wash_trading: Optional[bool] = None,
        window: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Search for NFT collections by name or address."""
        try:
            variables = {
                "search": search,
                "limit": limit or 20,  # Default to 20 results
                "networkFilter": network_filter or [],
                "filterWashTrading": filter_wash_trading or False,
                "window": window or "1d",  # Default to 1 day
            }

            query = """
            query SearchNFTs($search: String!, $limit: Int, $networkFilter: [Int!], $filterWashTrading: Boolean,
            $window: String) {
                searchNfts(search: $search, limit: $limit, networkFilter: $networkFilter,
                filterWashTrading: $filterWashTrading, window: $window) {
                    hasMore
                    items {
                        address
                        average
                        ceiling
                        floor
                        id
                        imageUrl
                        name
                        networkId
                        symbol
                        tradeCount
                        tradeCountChange
                        volume
                        volumeChange
                        window
                    }
                }
            }
            """

            response = await _make_graphql_request(query, variables)
            api_result = NftSearchResponse(
                success=True,
                hasMore=response["searchNfts"]["hasMore"],
                items=response["searchNfts"]["items"],
            )
            
            # Return serialized response
            result = api_result.model_dump()
            result["message"] = api_result.formatted_response
            return result
            
        except Exception as e:
            logger.error(f"Failed to search NFTs: {str(e)}", exc_info=True)
            raise ToolExecutionError(f"Failed to search NFTs: {str(e)}", self.name)