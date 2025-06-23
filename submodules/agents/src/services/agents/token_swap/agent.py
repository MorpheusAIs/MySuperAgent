import logging
from typing import Any, Dict

from langchain.schema import SystemMessage
from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.agents.token_swap.config import Config
from services.agents.token_swap.utils.exceptions import InsufficientFundsError, SwapNotPossibleError, TokenNotFoundError
from services.tools import ToolRegistry, bootstrap_tools
from stores.wallet_manager import wallet_manager_instance

logger = logging.getLogger(__name__)


class TokenSwapAgent(AgentCore):
    """Agent for handling token swap transactions."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.tools_provided = Config.tools
        
        # Initialize tools registry
        bootstrap_tools()
        
        # Get tools from registry
        self.swap_tool = ToolRegistry.get("swap_tokens")
        self.tx_status_tool = ToolRegistry.get("get_transaction_status")

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for swap transactions."""
        # Check CDP client initialization
        if not wallet_manager_instance.configure_cdp_client():
            # Return user-friendly error for missing credentials
            return AgentResponse.success(
                content="I'm not able to help with swaps right now because the CDP client is not initialized. "
                "Please set up your API credentials first."
            )

        # Check for active wallet
        active_wallet = wallet_manager_instance.get_active_wallet()
        if not active_wallet:
            # Return user-friendly error for missing wallet
            return AgentResponse.success(
                content="You'll need to select or create a wallet before I can help with swaps. "
                "Please set up a wallet first."
            )

        try:
            messages = [
                SystemMessage(
                    content=(
                        "You are a helpful assistant for token swapping operations. "
                        "You can help users swap between different cryptocurrencies on various blockchain networks. "
                        "You can also check the status of pending transactions. "
                        "When a user wants to swap tokens, ask for the following information if not provided: "
                        "- Source token (token1) "
                        "- Destination token (token2) "
                        "- Amount to swap "
                        "When a user wants to check transaction status, ask for: "
                        "- Transaction hash "
                        "- Chain ID"
                    )
                ),
                *request.messages_for_llm,
            ]
            
            response = await self._call_llm_with_tools(messages, self.tools_provided)
            return await self._handle_llm_response(response)

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    async def _execute_tool(self, func_name: str, args: Dict[str, Any]) -> AgentResponse:
        """Execute the appropriate token swap tool based on function name."""
        try:
            # Add wallet information to args if not provided
            wallet = wallet_manager_instance.get_active_wallet()
            wallet_address = wallet.default_address.address_id if wallet else None
            chain_id = int(wallet.network_id.split('-')[0]) if wallet and '-' in wallet.network_id else None
            
            if not wallet_address or not chain_id:
                return AgentResponse.needs_info(
                    content="Please connect a wallet before performing swap operations."
                )
            
            # Add wallet and chain info to args if not already present
            if "wallet_address" not in args:
                args["wallet_address"] = wallet_address
            if "chain_id" not in args:
                args["chain_id"] = chain_id
            
            if func_name == "swap_tokens":
                return await self._execute_swap_tokens(args)
            elif func_name == "get_transaction_status":
                return await self._execute_get_transaction_status(args)
            else:
                return AgentResponse.error(error_message=f"Unknown tool: {func_name}")

        except Exception as e:
            logger.error(
                f"Unexpected error in tool execution {func_name}: {str(e)}",
                exc_info=True,
            )
            return AgentResponse.error(error_message=f"Unexpected error: {str(e)}")

    async def _execute_swap_tokens(self, args: Dict[str, Any]) -> AgentResponse:
        """Execute the swap tokens operation with comprehensive error handling."""
        try:
            # Validate required parameters
            required_params = ["source_token", "destination_token", "amount"]
            missing_params = [param for param in required_params if param not in args or args[param] is None]

            if missing_params:
                return AgentResponse.needs_info(
                    content=f"Please provide the following information: {', '.join(missing_params)}"
                )

            # Validate amount is a positive number
            try:
                amount = float(args["amount"])
                if amount <= 0:
                    return AgentResponse.error(error_message="Swap amount must be greater than zero")
            except ValueError:
                return AgentResponse.error(error_message=f"Invalid amount format: {args['amount']}")

            # Execute swap operation using the tool from registry
            swap_response = await self.swap_tool.execute(**args)

            return AgentResponse.success(
                content=swap_response.get("message", str(swap_response)),
                metadata=swap_response,
                action_type="swap",
            )

        except TokenNotFoundError as e:
            logger.error(f"Token not found: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=f"Token not found: {str(e)}")

        except InsufficientFundsError as e:
            logger.error(f"Insufficient funds: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=f"Insufficient funds: {str(e)}")

        except SwapNotPossibleError as e:
            logger.error(f"Swap not possible: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=f"Swap not possible: {str(e)}")

        except Exception as e:
            logger.error(f"Error executing swap: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=f"Error executing swap: {str(e)}")

    async def _execute_get_transaction_status(self, args: Dict[str, Any]) -> AgentResponse:
        """Execute the get transaction status operation with comprehensive error handling."""
        try:
            # Extract and validate transaction hash
            tx_hash = args.get("tx_hash")
            if not tx_hash:
                return AgentResponse.needs_info(content="Please provide a transaction hash")

            # Execute transaction status check using the tool from registry
            tx_response = await self.tx_status_tool.execute(**args)

            return AgentResponse.success(
                content=tx_response.get("message", str(tx_response)),
                metadata=tx_response,
                action_type="transaction_status",
            )

        except Exception as e:
            logger.error(f"Error getting transaction status: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=f"Error retrieving transaction status: {str(e)}")