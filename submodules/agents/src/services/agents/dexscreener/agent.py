import logging
from typing import Any, Dict, Union

from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest

from . import tools
from .config import Config
from .models import BoostedTokenResponse, DexPairSearchResponse, TokenProfileResponse
from .tool_types import DexScreenerToolType

logger = logging.getLogger(__name__)


class DexScreenerAgent(AgentCore):
    """Agent for querying DEX screener data about tokens."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.tools_provided = Config.tools

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for DEX screener queries."""
        try:
            messages = [Config.system_message, *request.messages_for_llm]
            response = await self._call_llm_with_tools(messages, self.tools_provided)
            return await self._handle_llm_response(response)

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    async def _execute_tool(self, func_name: str, args: Dict[str, Any]) -> AgentResponse:
        """Execute the appropriate DexScreener API tool based on function name."""
        try:
            api_result: Union[DexPairSearchResponse, TokenProfileResponse, BoostedTokenResponse]

            if func_name == DexScreenerToolType.SEARCH_DEX_PAIRS.value:
                api_result = await tools.search_dex_pairs(args["query"])
                return AgentResponse.success(
                    content=api_result.formatted_response,
                    metadata=api_result.model_dump(),
                    action_type=DexScreenerToolType.SEARCH_DEX_PAIRS.value,
                )
            elif func_name == DexScreenerToolType.GET_LATEST_TOKEN_PROFILES.value:
                api_result = await tools.get_latest_token_profiles(args.get("chain_id"))
                return AgentResponse.success(
                    content=api_result.formatted_response,
                    metadata=api_result.model_dump(),
                    action_type=DexScreenerToolType.GET_LATEST_TOKEN_PROFILES.value,
                )
            elif func_name == DexScreenerToolType.GET_LATEST_BOOSTED_TOKENS.value:
                api_result = await tools.get_latest_boosted_tokens(args.get("chain_id"))
                return AgentResponse.success(
                    content=api_result.formatted_response,
                    metadata=api_result.model_dump(),
                    action_type=DexScreenerToolType.GET_LATEST_BOOSTED_TOKENS.value,
                )
            elif func_name == DexScreenerToolType.GET_TOP_BOOSTED_TOKENS.value:
                api_result = await tools.get_top_boosted_tokens(args.get("chain_id"))
                return AgentResponse.success(
                    content=api_result.formatted_response,
                    metadata=api_result.model_dump(),
                    action_type=DexScreenerToolType.GET_TOP_BOOSTED_TOKENS.value,
                )
            else:
                return AgentResponse.error(error_message=f"Unknown tool: {func_name}")

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))
