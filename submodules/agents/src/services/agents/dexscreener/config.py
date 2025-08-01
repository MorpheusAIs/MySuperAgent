from langchain.schema import SystemMessage
from models.service.agent_config import AgentConfig


class Config:
    """Configuration for DexScreener Token API."""

    # *************
    # AGENT CONFIG
    # ------------
    # This must be defined in every agent config file
    # It is required to load the agent
    # *************

    agent_config = AgentConfig(
        path="services.agents.dexscreener.agent",
        class_name="DexScreenerAgent",
        description="Fetches and analyzes cryptocurrency trading data from DexScreener.",
        delegator_description=(
            "Fetches token profiles, boosted tokens, and DEX trading pair data from DexScreener. "
            "Use when users need to search for specific trading pairs, monitor token activity, "
            "or get information about recently listed or trending tokens across different chains. "
            "Can filter results by specific chains. DO NOT USE FOR TOP HOLDERS OR TOKEN HOLDER ANALYSIS."
        ),
        human_readable_name="DexScreener Analyst",
        command="dexscreener",
        upload_required=False,
    )

    # *************
    # SYSTEM MESSAGE
    # *************

    system_message = SystemMessage(
        content="You are an agent that can fetch and analyze cryptocurrency token data "
        "from DexScreener. You can get token profiles and information about "
        "boosted tokens across different chains. When chain_id is not specified, "
        "you'll get data for all chains. You can filter by specific chains like "
        "'solana', 'ethereum', or 'bsc'."
    )

    # *************
    # TOOLS CONFIG
    # *************

    tools = [
        {
            "name": "get_latest_token_profiles",
            "description": "Get the latest token profiles from DexScreener",
            "parameters": {
                "type": "object",
                "properties": {
                    "chain_id": {
                        "type": "string",
                        "description": "Optional chain ID to filter results (e.g., 'solana', 'ethereum')",
                        "required": False,
                    }
                },
            },
        },
        {
            "name": "get_latest_boosted_tokens",
            "description": "Get the latest boosted tokens from DexScreener",
            "parameters": {
                "type": "object",
                "properties": {
                    "chain_id": {
                        "type": "string",
                        "description": "Optional chain ID to filter results (e.g., 'solana', 'ethereum')",
                        "required": False,
                    }
                },
            },
        },
        {
            "name": "get_top_boosted_tokens",
            "description": "Get the tokens with most active boosts",
            "parameters": {
                "type": "object",
                "properties": {
                    "chain_id": {
                        "type": "string",
                        "description": "Optional chain ID to filter results (e.g., 'solana', 'ethereum')",
                        "required": False,
                    }
                },
            },
        },
        {
            "name": "search_dex_pairs",
            "description": "Search for DEX trading pairs and their activity",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query (e.g., token symbol like 'ETH' or 'BTC')",
                        "required": True,
                    }
                },
            },
        },
    ]

    # *************
    # API CONFIG
    # *************

    BASE_URL = "https://api.dexscreener.com"
    RATE_LIMIT = 60  # requests per minute

    ENDPOINTS = {
        DexScreenerToolType.GET_LATEST_TOKEN_PROFILES.value: "/token-profiles/latest/v1",
        DexScreenerToolType.GET_LATEST_BOOSTED_TOKENS.value: "/token-boosts/latest/v1",
        DexScreenerToolType.GET_TOP_BOOSTED_TOKENS.value: "/token-boosts/top/v1",
        DexScreenerToolType.SEARCH_DEX_PAIRS.value: "/latest/dex/search",
    }
