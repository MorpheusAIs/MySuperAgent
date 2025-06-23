import logging
from typing import Any, Dict

from langchain.schema import SystemMessage

from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.orchestrator.registry.tool_registry import ToolRegistry

from services.tools.categories.external.codex.networks import NETWORK_TO_ID_MAPPING
from services.tools.categories.external.codex.tool_types import CodexToolType

from .config import Config

logger = logging.getLogger(__name__)


class CodexAgent(AgentCore):
    """Agent for interacting with Codex.io API."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.tools_provided = Config.tools

        # Get tools from registry
        self.list_top_tokens_tool = ToolRegistry.get(CodexToolType.LIST_TOP_TOKENS.value)
        self.top_holders_tool = ToolRegistry.get(CodexToolType.GET_TOP_HOLDERS_PERCENT.value)
        self.search_nfts_tool = ToolRegistry.get(CodexToolType.SEARCH_NFTS.value)

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for Codex API interactions."""
        try:
            messages = [
                SystemMessage(
                    content=(
                        "You are an agent that can fetch and analyze token and NFT data "
                        "from Codex.io. You can get trending tokens, analyze token holder "
                        "concentration, and search for NFT collections."
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
        """Execute the appropriate Codex API tool based on function name."""
        try:
            if func_name == CodexToolType.LIST_TOP_TOKENS.value:
                result = await self.list_top_tokens_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result,
                    action_type=CodexToolType.LIST_TOP_TOKENS.value,
                )

            elif func_name == CodexToolType.GET_TOP_HOLDERS_PERCENT.value:
                if args.get("tokenName") is None:
                    return AgentResponse.needs_info(
                        content="Please specify both the token name and network you'd like to get top holders for"
                    )

                if args.get("network") is None:
                    return AgentResponse.needs_info(
                        content=f"Please specify the network (Ethereum, Solana, etc.) you'd like to search for "
                        f"{args.get('tokenName')}"
                    )

                if args.get("network") not in NETWORK_TO_ID_MAPPING:
                    return AgentResponse.needs_info(
                        content=f"Please specify a valid network (Ethereum, Solana, etc.) you'd like to search for "
                        f"{args.get('tokenName')}"
                    )

                result = await self.top_holders_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result,
                    action_type=CodexToolType.GET_TOP_HOLDERS_PERCENT.value,
                )

            elif func_name == CodexToolType.SEARCH_NFTS.value:
                result = await self.search_nfts_tool.execute(**args)
                return AgentResponse.success(
                    content=result.get("message", ""),
                    metadata=result,
                    action_type=CodexToolType.SEARCH_NFTS.value,
                )

            else:
                return AgentResponse.error(error_message=f"Unknown tool: {func_name}")

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))
