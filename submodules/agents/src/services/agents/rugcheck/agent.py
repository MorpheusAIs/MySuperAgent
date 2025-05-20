import logging
from typing import Any, Dict

from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.orchestrator.registry.tool_registry import ToolRegistry

from services.tools.categories.external.rugcheck.tool_types import RugcheckToolType
from .config import Config, TokenRegistry

logger = logging.getLogger(__name__)


class RugCheckAgent(AgentCore):
    """Agent for analyzing smart contracts for potential rug pulls."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        # Get tools from registry
        self.token_report_tool = ToolRegistry.get("fetch_token_report")
        self.most_viewed_tool = ToolRegistry.get("fetch_most_viewed_tokens")
        self.most_voted_tool = ToolRegistry.get("fetch_most_voted_tokens")
        
        # For backward compatibility with LLM tools format
        self.tools_provided = Config.tools
        self.token_registry = TokenRegistry()

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for rug checks."""
        try:
            messages = [Config.system_message, *request.messages_for_llm]
            response = await self._call_llm_with_tools(messages, self.tools_provided)
            return await self._handle_llm_response(response)

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    async def _execute_tool(self, func_name: str, args: Dict[str, Any]) -> AgentResponse:
        """Execute the appropriate Rugcheck API tool based on function name."""
        try:
            if func_name == RugcheckToolType.GET_TOKEN_REPORT.value:
                identifier = args.get("identifier")
                if not identifier:
                    return AgentResponse.error(error_message="Please provide a token name or mint address")

                try:
                    # Use the new tool directly
                    result = await self.token_report_tool.execute(identifier=identifier)
                    
                    return AgentResponse.success(
                        content=result.get("formatted_response"),
                        metadata=result.get("report"),
                        action_type=RugcheckToolType.GET_TOKEN_REPORT.value,
                    )

                except Exception as e:
                    return AgentResponse.error(error_message=f"Failed to get token report: {str(e)}")

            elif func_name == RugcheckToolType.GET_MOST_VIEWED.value:
                try:
                    # Use the new tool directly
                    result = await self.most_viewed_tool.execute()
                    
                    return AgentResponse.success(
                        content=result.get("formatted_response"),
                        metadata=result.get("viewed_tokens"),
                        action_type=RugcheckToolType.GET_MOST_VIEWED.value,
                    )

                except Exception as e:
                    return AgentResponse.error(error_message=f"Failed to get most viewed tokens: {str(e)}")

            elif func_name == RugcheckToolType.GET_MOST_VOTED.value:
                try:
                    # Use the new tool directly
                    result = await self.most_voted_tool.execute()
                    
                    return AgentResponse.success(
                        content=result.get("formatted_response"),
                        metadata=result.get("voted_tokens"),
                        action_type=RugcheckToolType.GET_MOST_VOTED.value,
                    )

                except Exception as e:
                    return AgentResponse.error(error_message=f"Failed to get most voted tokens: {str(e)}")

            else:
                return AgentResponse.error(error_message=f"Unknown tool function: {func_name}")

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))
