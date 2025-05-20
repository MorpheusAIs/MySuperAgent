import logging
from typing import Any, Dict

from langchain.schema import HumanMessage, SystemMessage
from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.orchestrator.registry.tool_registry import ToolRegistry
from services.tools.categories.blockchain.mor_claims.tool_types import MorClaimsToolType
from stores.agent_manager import agent_manager_instance

logger = logging.getLogger(__name__)


class MorClaimsAgent(AgentCore):
    """Agent for handling MOR token claims and rewards."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        # Get tools from registry
        self.get_reward_tool = ToolRegistry.get("get_current_user_reward")
        self.prepare_claim_tool = ToolRegistry.get("prepare_claim_transaction")
        self.get_status_tool = ToolRegistry.get("get_claim_status")
        
        # For backward compatibility with LLM tools format
        self.tools_provided = [
            self.get_reward_tool.schema,
            self.prepare_claim_tool.schema,
            self.get_status_tool.schema
        ]

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for MOR claims."""
        try:
            wallet_address = request.wallet_address
            chat_history = request.chat_history

            # Check if this is initial interaction by looking at chat history
            if not chat_history:
                agent_manager_instance.set_active_agent("mor claims")

                # Get rewards from each pool using the tool
                rewards = {}
                for pool_id in [0, 1]:
                    result = await self.get_reward_tool.execute(
                        wallet_address=wallet_address, 
                        pool_id=pool_id
                    )
                    rewards[pool_id] = result.get("reward", 0)
                
                available_rewards = {pool: amount for pool, amount in rewards.items() if amount > 0}

                if available_rewards:
                    selected_pool = max(available_rewards.keys())
                    return AgentResponse.success(
                        content=(
                            f"You have {available_rewards[selected_pool]} MOR rewards "
                            f"available in pool {selected_pool}. "
                            "Would you like to proceed with claiming these rewards?"
                        ),
                        metadata={
                            "available_rewards": {selected_pool: available_rewards[selected_pool]},
                            "receiver_address": wallet_address,
                        },
                    )
                else:
                    return AgentResponse.error(
                        error_message=(
                            f"No rewards found for your wallet address {wallet_address} in either pool. "
                            "Claim cannot be processed."
                        )
                    )

            # Check last message for confirmation
            last_message = chat_history[-1]
            if last_message.role == "assistant" and "Would you like to proceed" in last_message.content:
                user_input = request.prompt.content.lower()
                if any(word in user_input for word in ["yes", "proceed", "confirm", "claim"]):
                    return await self._prepare_transactions(wallet_address, last_message.metadata)
                else:
                    return AgentResponse.success(
                        content=(
                            "Please confirm if you want to proceed with the claim by saying "
                            "'yes', 'proceed', 'confirm', or 'claim'."
                        )
                    )

            messages = [
                SystemMessage(
                    content=(
                        "You are a MOR claims agent that helps users claim their MOR rewards. "
                        "Ask for clarification if a request is ambiguous."
                    )
                ),
                HumanMessage(content=request.prompt.content),
            ]

            response = await self._call_llm_with_tools(messages, self.tools_provided)
            return await self._handle_llm_response(response)

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    async def _prepare_transactions(self, wallet_address: str, metadata: Dict[str, Any]) -> AgentResponse:
        """Prepare claim transactions for the given wallet."""
        try:
            available_rewards = metadata["available_rewards"]
            receiver_address = metadata["receiver_address"]
            transactions = []

            for pool_id in available_rewards.keys():
                try:
                    result = await self.prepare_claim_tool.execute(
                        pool_id=pool_id, 
                        wallet_address=receiver_address
                    )
                    transactions.append({"pool": pool_id, "transaction": result.get("transaction")})
                except Exception as e:
                    return AgentResponse.error(
                        error_message=f"Error preparing transaction for pool {pool_id}: {str(e)}"
                    )

            return AgentResponse.action_required(
                content="Transactions prepared successfully",
                action_type="claim",
                metadata={"transactions": transactions, "claim_tx_cb": "/claim"},
            )

        except Exception as e:
            logger.error(f"Error preparing transactions: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    async def _execute_tool(self, func_name: str, args: Dict[str, Any]) -> AgentResponse:
        """Execute the appropriate MOR claims tool based on function name."""
        try:
            if func_name == MorClaimsToolType.GET_CURRENT_USER_REWARD.value:
                result = await self.get_reward_tool.execute(**args)
                return AgentResponse.success(content=result.get("message"), metadata=result)
            elif func_name == MorClaimsToolType.PREPARE_CLAIM_TRANSACTION.value:
                result = await self.prepare_claim_tool.execute(**args)
                return AgentResponse.success(content=result.get("message"), metadata=result)
            elif func_name == MorClaimsToolType.GET_CLAIM_STATUS.value:
                result = await self.get_status_tool.execute(**args)
                return AgentResponse.success(content=result.get("message"), metadata=result)
            else:
                return AgentResponse.error(error_message=f"Unknown tool: {func_name}")

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))
