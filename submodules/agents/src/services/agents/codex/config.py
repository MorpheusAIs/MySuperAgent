from langchain.schema import SystemMessage
from models.service.agent_config import AgentConfig
from services.tools.categories.external.codex.tool_types import CodexToolType


class Config:
    """Configuration for Codex.io API."""

    # *************
    # AGENT CONFIG
    # ------------
    # This must be defined in every agent config file
    # It is required to load the agent
    # *************

    agent_config = AgentConfig(
        path="services.agents.codex.agent",
        class_name="CodexAgent",
        description="Fetches and analyzes advanced token and NFT data from Codex.io such as trending tokens, top holders, and more",
        delegator_description=(
            "Use this agent for: 1) Getting lists of trending tokens across networks with customizable time frames, "
            "2) Analyzing token holder concentration by getting top holder percentages for specific tokens on specific networks, "
            "3) Searching NFT collections with detailed metrics and wash trading detection. "
            "This agent MUST be used for any queries related to trending tokens, token holder analysis, or NFT collection searches."
        ),
        human_readable_name="Codex Market Analyst",
        command="codex",
        upload_required=False,
    )

    # **************
    # SYSTEM MESSAGE
    # **************

    system_message = SystemMessage(
        content=(
            "You are an agent that can fetch and analyze token and NFT data "
            "from Codex.io. You can get trending tokens, analyze token holder "
            "concentration, and search for NFT collections."
        )
    )

    # *************
    # TOOLS CONFIG
    # *************

    tools = [
        {
            "name": CodexToolType.LIST_TOP_TOKENS.value,
            "description": "Get a list of trending tokens across specified networks",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of tokens to return (max 50)",
                        "required": False,
                    },
                    "networks": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of network names to filter by (Ethereum, Solana, etc.)",
                        "required": False,
                    },
                    "resolution": {
                        "type": "string",
                        "description": "Time frame for trending results (1, 5, 15, 30, 60, 240, 720, or 1D)",
                        "required": False,
                    },
                },
            },
        },
        {
            "name": CodexToolType.GET_TOP_HOLDERS_PERCENT.value,
            "description": "Get the top holders for a token. If no network is provided, then LEAVE IT AS NONE",
            "parameters": {
                "type": "object",
                "properties": {
                    "tokenName": {
                        "type": "string",
                        "description": "Token name to get top holders for",
                        "required": False,
                    },
                    "network": {
                        "type": "string",
                        "description": "Network to search for token on. Must be deliberately specified.",
                        "required": False,
                    },
                },
            },
        },
        {
            "name": CodexToolType.SEARCH_NFTS.value,
            "description": "Search for NFT collections by name or address",
            "parameters": {
                "type": "object",
                "properties": {
                    "search": {
                        "type": "string",
                        "description": "Query string to search for",
                        "required": True,
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "required": False,
                    },
                    "networkFilter": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "List of network IDs to filter by",
                        "required": False,
                    },
                    "filterWashTrading": {
                        "type": "boolean",
                        "description": "Whether to filter collections linked to wash trading",
                        "required": False,
                    },
                    "window": {
                        "type": "string",
                        "description": "Time frame for stats (1h, 4h, 12h, or 1d)",
                        "required": False,
                    },
                },
            },
        },
    ]

    # *************
    # API CONFIG
    # *************

    GRAPHQL_URL = "https://graph.codex.io/graphql"
