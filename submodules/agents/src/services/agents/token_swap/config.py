from langchain.schema import SystemMessage
from models.service.agent_config import AgentConfig


class Config:
    """Configuration for Token Swap Agent."""

    # *************
    # AGENT CONFIG
    # *************

    agent_config = AgentConfig(
        path="services.agents.token_swap.agent",
        class_name="TokenSwapAgent",
        description="Handles token swaps across multiple networks",
        delegator_description="Executes and optimizes token exchange transactions across multiple blockchains, "
        "including route optimization, gas fee estimation, slippage protection, and cross-chain "
        "bridge coordination. Use when users want to exchange one token for another or need swap "
        "execution guidance.",
        human_readable_name="Token Swap Manager",
        command="swap",
        upload_required=False,
        is_enabled=False,
    )

    # *************
    # TOOLS CONFIG
    # *************

    tools = [
        {
            "type": "function",
            "function": {
                "name": "swap_tokens",
                "description": (
                    "Construct a token swap transaction with validation and quote. "
                    "Make sure the source token and destination token ONLY include "
                    "the token symbol, not the amount. The amount is a separate field."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "source_token": {
                            "type": "string",
                            "description": "Name or address of the source token to sell",
                            "required": False,
                        },
                        "destination_token": {
                            "type": "string",
                            "description": "Name or address of the destination token to buy",
                            "required": False,
                        },
                        "amount": {
                            "type": "string",
                            "description": "Amount of source token to swap",
                            "required": False,
                        },
                    },
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_transaction_status",
                "description": "Get the current status of a transaction",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "tx_hash": {
                            "type": "string",
                            "description": "Transaction hash to check status for",
                            "required": False,
                        },
                        "tx_type": {
                            "type": "string",
                            "description": "Type of transaction (approve/swap)",
                            "enum": ["approve", "swap"],
                            "required": False,
                        },
                    },
                },
            },
        },
    ]

    # *************
    # API CONFIG
    # *************

    INCH_URL = "https://api.1inch.dev/token"
    QUOTE_URL = "https://api.1inch.dev/swap"
    APIBASEURL = "https://api.1inch.dev/swap/v6.0/"
    HEADERS = {
        "Authorization": "Bearer WvQuxaMYpPvDiiOL5RHWUm7OzOd20nt4",
        "accept": "application/json",
    }

    # *************
    # NETWORK CONFIG
    # *************

    WEB3RPCURL = {
        "56": "https://bsc-dataseed.binance.org",
        "42161": "https://arb1.arbitrum.io/rpc",
        "137": "https://polygon-rpc.com",
        "1": "https://eth.llamarpc.com/",
        "10": "https://mainnet.optimism.io",
        "8453": "https://mainnet.base.org",
    }

    NATIVE_TOKENS = {
        "137": "MATIC",
        "56": "BNB",
        "1": "ETH",
        "42161": "ETH",
        "10": "ETH",
        "8453": "ETH",
    }

    # *************
    # CONTRACT CONFIG
    # *************

    ERC20_ABI = [
        {
            "constant": True,
            "inputs": [],
            "name": "decimals",
            "outputs": [{"name": "", "type": "uint8"}],
            "payable": False,
            "stateMutability": "view",
            "type": "function",
        },
        {
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "payable": False,
            "stateMutability": "view",
            "type": "function",
        },
    ]

    INCH_NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
