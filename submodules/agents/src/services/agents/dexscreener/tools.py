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
from services.agents.dexscreener.tool_types import DexScreenerToolType

logger = logging.getLogger(__name__)


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


async def get_latest_token_profiles(
    chain_id: Optional[str] = None,
) -> TokenProfileResponse:
    """Get the latest token profiles, optionally filtered by chain."""
    try:
        response = await _make_request(Config.ENDPOINTS[DexScreenerToolType.GET_LATEST_TOKEN_PROFILES.value])
        tokens_data: List[Dict[str, Any]] = response if isinstance(response, list) else []
        filtered_tokens = filter_by_chain(tokens_data, chain_id)
        tokens = [TokenProfile(**token) for token in filtered_tokens]
        return TokenProfileResponse(tokens=tokens, chain_id=chain_id)
    except Exception as e:
        raise Exception(f"Failed to get token profiles: {str(e)}")


async def get_latest_boosted_tokens(
    chain_id: Optional[str] = None,
) -> BoostedTokenResponse:
    """Get the latest boosted tokens, optionally filtered by chain."""
    try:
        response = await _make_request(Config.ENDPOINTS[DexScreenerToolType.GET_LATEST_BOOSTED_TOKENS.value])
        tokens_data: List[Dict[str, Any]] = response if isinstance(response, list) else []
        filtered_tokens = filter_by_chain(tokens_data, chain_id)
        tokens = [BoostedToken(**token) for token in filtered_tokens]
        return BoostedTokenResponse(tokens=tokens, chain_id=chain_id)
    except Exception as e:
        raise Exception(f"Failed to get boosted tokens: {str(e)}")


async def get_top_boosted_tokens(
    chain_id: Optional[str] = None,
) -> BoostedTokenResponse:
    """Get tokens with most active boosts, optionally filtered by chain."""
    try:
        response = await _make_request(Config.ENDPOINTS[DexScreenerToolType.GET_TOP_BOOSTED_TOKENS.value])
        tokens_data: List[Dict[str, Any]] = response if isinstance(response, list) else []
        filtered_tokens = filter_by_chain(tokens_data, chain_id)

        # Sort by total amount
        sorted_tokens = sorted(
            filtered_tokens,
            key=lambda x: float(x.get("totalAmount", 0) or 0),
            reverse=True,
        )
        tokens = [BoostedToken(**token) for token in sorted_tokens]
        return BoostedTokenResponse(tokens=tokens, chain_id=chain_id)
    except Exception as e:
        raise Exception(f"Failed to get top boosted tokens: {str(e)}")


async def search_dex_pairs(query: str) -> DexPairSearchResponse:
    """Search for DEX pairs matching the query."""
    try:
        endpoint = f"{Config.ENDPOINTS[DexScreenerToolType.SEARCH_DEX_PAIRS.value]}?q={query}"
        response = await _make_request(endpoint)
        pairs_data = response.get("pairs", [])
        pairs = [DexPair(**pair) for pair in pairs_data]
        return DexPairSearchResponse(pairs=pairs)
    except Exception as e:
        raise Exception(f"Failed to search DEX pairs: {str(e)}")
