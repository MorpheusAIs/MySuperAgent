import logging

from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.orchestrator.registry.tool_registry import ToolRegistry
from services.tools.categories.blockchain.mor_rewards.tool_types import MorRewardsToolType

logger = logging.getLogger(__name__)


class MorRewardsAgent(AgentCore):
    def __init__(self, config):
        super().__init__(config)
        
        # Get tools from registry
        self.get_reward_tool = ToolRegistry.get("get_current_user_reward")
        self.get_all_rewards_tool = ToolRegistry.get("get_all_pool_rewards")
        
        # For backward compatibility with LLM tools format
        self.tools_provided = [
            self.get_reward_tool.schema,
            self.get_all_rewards_tool.schema
        ]

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for MOR rewards."""
        try:
            if not request.wallet_address:
                return AgentResponse.needs_info(content="Please provide a wallet address to check rewards.")

            logger.info(f"Checking rewards for wallet address: {request.wallet_address}")

            # Get rewards using the all_pool_rewards tool
            result = await self.get_all_rewards_tool.execute(wallet_address=request.wallet_address)
            rewards = result.get("rewards", {})

            response = "Your current MOR rewards:\n"
            response += f"Capital Providers Pool (Pool 0): {rewards.get(0, 0)} MOR\n"
            response += f"Code Providers Pool (Pool 1): {rewards.get(1, 0)} MOR"

            logger.info(f"Rewards retrieved successfully for {request.wallet_address}")
            return AgentResponse.success(content=response, metadata={"rewards": rewards})

        except Exception as e:
            logger.error(f"Error occurred while checking rewards: {str(e)}")
            return AgentResponse.error(error_message=f"An error occurred while checking your rewards: {str(e)}")

    async def _execute_tool(self, func_name: str, args: dict) -> AgentResponse:
        """Execute the appropriate MOR rewards tool based on function name."""
        try:
            if func_name == MorRewardsToolType.GET_CURRENT_USER_REWARD.value:
                result = await self.get_reward_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message"),
                    metadata=result,
                )
            elif func_name == MorRewardsToolType.GET_ALL_POOL_REWARDS.value:
                result = await self.get_all_rewards_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message"),
                    metadata=result,
                )
            else:
                return AgentResponse.error(error_message=f"Unknown tool: {func_name}")

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))
