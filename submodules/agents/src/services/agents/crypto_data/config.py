from langchain.schema import SystemMessage
from models.service.agent_config import AgentConfig


class Config:
    """Configuration for Crypto Data Agent."""

    # *************
    # AGENT CONFIG
    # *************

    agent_config = AgentConfig(
        path="services.agents.crypto_data.agent",
        class_name="CryptoDataAgent",
        description="Fetches basic cryptocurrency data such as price, market cap, TVL, and FDV from various sources.",
        delegator_description=(
            "NOT a specialized agent. Fetches ONLY the very basic metrics for individual crypto assets including: current price, "
            "market cap, fully diluted value (FDV), NFT floor prices, and TVL for DeFi protocols. "
            "This agent CANNOT handle finding the most active tokens, rugcheck / safety, or any queries for multiple tokens. "
            "Only use this agent when requesting a single specific metric (like price or TVL) for ONE "
            "specific asset. For broader market analysis or comparisons across multiple assets, use "
            "other specialized agents."
        ),
        human_readable_name="Basic Crypto Metrics",
        command="cryptodata",
        upload_required=False,
    )

    # *************
    # SYSTEM MESSAGE
    # *************

    system_message = SystemMessage(
        content="You are a cryptocurrency data analyst that can fetch various metrics about cryptocurrencies, NFTs and DeFi protocols. "
        "You can get price data for any cryptocurrency, floor prices for NFTs, Total Value Locked (TVL) for DeFi protocols, "
        "and market metrics like market cap and fully diluted valuation (FDV) for cryptocurrencies. "
        "When users ask questions, carefully analyze what metric they're looking for and use the appropriate tool. "
        "For example:\n"
        "- For general price queries, use the price tool\n"
        "- For NFT valuations, use the floor price tool\n"
        "- For DeFi protocol size/usage, use the TVL tool\n"
        "- For token valuations, use market cap or FDV tools\n\n"
        "Don't make assumptions about function arguments - they should always be supplied by the user. "
        "Ask for clarification if a request is ambiguous or if you're unsure which metric would be most appropriate."
    )

    # *************
    # TOOLS CONFIG
    # *************
    tools = [
        {
            "name": "get_coin_price",
            "description": "Get the price of a cryptocurrency",
            "parameters": {
                "type": "object",
                "properties": {
                    "coin_name": {
                        "type": "string",
                        "description": "The name of the coin.",
                    }
                },
                "required": ["coin_name"],
            },
        },
        {
            "name": "get_nft_floor_price",
            "description": "Get the floor price of an NFT",
            "parameters": {
                "type": "object",
                "properties": {
                    "nft_name": {
                        "type": "string",
                        "description": "Name of the NFT",
                    }
                },
                "required": ["nft_name"],
            },
        },
        {
            "name": "get_protocol_tvl",
            "description": "Get the TVL (Total Value Locked) of a protocol.",
            "parameters": {
                "type": "object",
                "properties": {
                    "protocol_name": {
                        "type": "string",
                        "description": "Name of the protocol",
                    }
                },
                "required": ["protocol_name"],
            },
        },
        {
            "name": "get_fully_diluted_valuation",
            "description": "Get the fdv or fully diluted valuation of a coin",
            "parameters": {
                "type": "object",
                "properties": {
                    "coin_name": {
                        "type": "string",
                        "description": "Name of the coin",
                    }
                },
                "required": ["coin_name"],
            },
        },
        {
            "name": "get_market_cap",
            "description": "Get the mc or market cap of a coin",
            "parameters": {
                "type": "object",
                "properties": {
                    "coin_name": {
                        "type": "string",
                        "description": "Name of the coin",
                    }
                },
                "required": ["coin_name"],
            },
        },
    ]

    # *************
    # API CONFIG
    # *************

    COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
    DEFILLAMA_BASE_URL = "https://api.llama.fi"

    # Response messages
    PRICE_SUCCESS_MESSAGE = "The price of {coin_name} is ${price:,}"
    PRICE_FAILURE_MESSAGE = "Failed to retrieve price. Please enter a valid coin name."
    FLOOR_PRICE_SUCCESS_MESSAGE = "The floor price of {nft_name} is ${floor_price:,}"
    FLOOR_PRICE_FAILURE_MESSAGE = "Failed to retrieve floor price. Please enter a valid NFT name."
    TVL_SUCCESS_MESSAGE = "The TVL of {protocol_name} is ${tvl:,}"
    TVL_FAILURE_MESSAGE = "Failed to retrieve TVL. Please enter a valid protocol name."
    FDV_SUCCESS_MESSAGE = "The fully diluted valuation of {coin_name} is ${fdv:,}"
    FDV_FAILURE_MESSAGE = "Failed to retrieve FDV. Please enter a valid coin name."
    MARKET_CAP_SUCCESS_MESSAGE = "The market cap of {coin_name} is ${market_cap:,}"
    MARKET_CAP_FAILURE_MESSAGE = "Failed to retrieve market cap. Please enter a valid coin name."
    API_ERROR_MESSAGE = "I can't seem to access the API at the moment."
