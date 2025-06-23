import logging
from typing import Any, Dict, Union

from langchain.schema import SystemMessage
from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.tools import ToolRegistry, bootstrap_tools

from .config import Config

logger = logging.getLogger(__name__)


class DexScreenerAgent(AgentCore):
    """Agent for querying DEX screener data about tokens."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.tools_provided = Config.tools
        
        # Initialize tools registry
        bootstrap_tools()
        
        # Get tools from registry
        self.token_profiles_tool = ToolRegistry.get("get_latest_token_profiles")
        self.latest_boosted_tokens_tool = ToolRegistry.get("get_latest_boosted_tokens")
        self.top_boosted_tokens_tool = ToolRegistry.get("get_top_boosted_tokens")
        self.search_dex_pairs_tool = ToolRegistry.get("search_dex_pairs")

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for DEX screener queries."""
        try:
            messages = [
                SystemMessage(
                    content="You are an agent that can fetch and analyze cryptocurrency token data "
                    "from DexScreener. You can get token profiles and information about "
                    "boosted tokens across different chains. When chain_id is not specified, "
                    "you'll get data for all chains. You can filter by specific chains like "
                    "'solana', 'ethereum', or 'bsc'."
                ),
                *request.messages_for_llm,
            ]
            response = await self._call_llm_with_tools(messages, self.tools_provided)
            return await self._handle_llm_response(response)

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    async def _execute_tool(self, func_name: str, args: Dict[str, Any]) -> AgentResponse:
        """Execute the appropriate DexScreener API tool based on function name."""
        try:
            if func_name == "search_dex_pairs":
                result = await self.search_dex_pairs_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result,
                    action_type="search_dex_pairs",
                )
                
            elif func_name == "get_latest_token_profiles":
                result = await self.token_profiles_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result,
                    action_type="get_latest_token_profiles",
                )
                
            elif func_name == "get_latest_boosted_tokens":
                result = await self.latest_boosted_tokens_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result,
                    action_type="get_latest_boosted_tokens",
                )
                
            elif func_name == "get_top_boosted_tokens":
                result = await self.top_boosted_tokens_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result,
                    action_type="get_top_boosted_tokens",
                )
                
            else:
                return AgentResponse.error(error_message=f"Unknown tool: {func_name}")

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))
