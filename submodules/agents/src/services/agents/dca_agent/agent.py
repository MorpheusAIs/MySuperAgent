import logging
from typing import Any, Dict

from langchain.schema import SystemMessage
from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.tools import ToolRegistry, bootstrap_tools
from stores.wallet_manager import wallet_manager_instance

from .config import Config

logger = logging.getLogger(__name__)


class DCAAgent(AgentCore):
    """Agent for handling DCA (Dollar Cost Averaging) strategies."""

    def __init__(self, config: Dict[str, Any]):
        """Initialize the DCAAgent."""
        super().__init__(config)
        self.tools_provided = Config.tools
        
        # Initialize tools registry
        bootstrap_tools()
        
        # Get tools from registry
        self.setup_dca_tool = ToolRegistry.get("setup_dca")
        self.get_dca_schedule_tool = ToolRegistry.get("get_dca_schedule")
        self.cancel_dca_tool = ToolRegistry.get("cancel_dca")

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for DCA-related queries."""
        # Check CDP client initialization
        if not wallet_manager_instance.configure_cdp_client():
            # Return user-friendly error for missing credentials
            return AgentResponse.needs_info(
                content="I'm not able to help with DCA strategies right now because the CDP client is not initialized. "
                "Please set up your API credentials first."
            )

        # Check for active wallet
        active_wallet = wallet_manager_instance.get_active_wallet()
        if not active_wallet:
            # Return user-friendly error for missing wallet
            return AgentResponse.needs_info(
                content="You'll need to select or create a wallet before I can help with DCA strategies. "
                "Please set up a wallet first."
            )

        try:
            messages = [
                SystemMessage(
                    content=(
                        "You are a DCA strategy manager. "
                        "Help users set up and manage their Dollar Cost Averaging (DCA) strategies. "
                        "You can create new DCA schedules, view existing ones, and cancel them. "
                        "Ask for clarification if a request is ambiguous. "
                        "Always collect the necessary information: which token to invest from, "
                        "which token to buy, how much to invest per interval, and how often."
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
        """Execute the appropriate DCA tool based on function name."""
        try:
            if func_name == "setup_dca":
                result = await self.setup_dca_tool.execute(**args)
                return AgentResponse.action_required(
                    content=result.get("message", "Ready to set up DCA"), 
                    action_type="dca",
                    metadata=result
                )
            
            elif func_name == "get_dca_schedule":
                result = await self.get_dca_schedule_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result
                )
                
            elif func_name == "cancel_dca":
                result = await self.cancel_dca_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result
                )
                
            else:
                return AgentResponse.needs_info(
                    content=f"I don't know how to {func_name} yet. Please try a different action."
                )

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))
