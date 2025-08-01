import logging
from typing import Any, Dict

from langchain.schema import SystemMessage
from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.agents.base_agent.config import Config
from services.tools import ToolRegistry, get_tools_for_agent, bootstrap_tools
from stores.wallet_manager import wallet_manager_instance

logger = logging.getLogger(__name__)


class BaseAgent(AgentCore):
    """Agent for handling Base blockchain transactions."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        # Ensure tools are registered
        bootstrap_tools()
        
        # Continue using config tools for schema, but get actual tool instances from the registry
        self.tools_provided = Config.tools
        self.tools = get_tools_for_agent("base_agent")

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for Base transactions."""
        # Check CDP client initialization
        if not wallet_manager_instance.configure_cdp_client():
            # Return user-friendly error for missing credentials
            return AgentResponse.success(
                content="I'm not able to help with transactions right now because the CDP client is not initialized. "
                "Please set up your API credentials first."
            )

        # Check for active wallet
        active_wallet = wallet_manager_instance.get_active_wallet()
        if not active_wallet:
            # Return user-friendly error for missing wallet
            return AgentResponse.success(
                content="You'll need to select or create a wallet before I can help with transactions. "
                "Please set up a wallet first."
            )

        try:
            messages = [
                SystemMessage(
                    content=(
                        "You are an agent that can perform various financial transactions on Base. "
                        "When you need to perform an action, use the appropriate function with the correct arguments."
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
        """Execute the appropriate Base transaction tool based on function name."""
        try:
            if func_name == "swap_assets":
                return AgentResponse.action_required(content="Ready to perform swap", action_type="swap")
            elif func_name == "transfer_asset":
                return AgentResponse.action_required(content="Ready to perform transfer", action_type="transfer")
            elif func_name == "get_balance":
                wallet = wallet_manager_instance.get_active_wallet()
                if not wallet:
                    return AgentResponse.success(
                        content="I can't check the balance because no wallet is selected. Please select a wallet first."
                    )

                asset_id = args.get("asset_id")
                if not asset_id:
                    return AgentResponse.needs_info(
                        content="Please specify which asset you'd like to check the balance for."
                    )

                # Get the tool and execute it
                if "get_balance" in self.tools:
                    tool = self.tools["get_balance"]
                    tool_result = await tool.execute(asset_id=asset_id.lower())
                    content = tool_result.get("message", f"Your wallet has a balance of {tool_result['balance']} {tool_result['asset']}")
                    return AgentResponse.success(content=content)
                else:
                    return AgentResponse.error(error_message="Balance check tool not available.")
            else:
                # Try to find the tool in the registry
                if func_name in self.tools:
                    tool = self.tools[func_name]
                    try:
                        result = await tool.execute(**args)
                        return AgentResponse.success(content=result.get("message", str(result)))
                    except Exception as tool_error:
                        logger.error(f"Error executing tool {func_name}: {str(tool_error)}", exc_info=True)
                        return AgentResponse.error(error_message=str(tool_error))
                else:
                    return AgentResponse.needs_info(
                        content=f"I don't know how to {func_name} yet. Please try a different action."
                    )

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))