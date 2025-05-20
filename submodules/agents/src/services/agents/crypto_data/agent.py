import logging
from typing import Any, Dict

from langchain.schema import SystemMessage
from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from services.agents.crypto_data.config import Config
from services.tools import ToolRegistry, bootstrap_tools

logger = logging.getLogger(__name__)


class CryptoDataAgent(AgentCore):
    """Agent for handling cryptocurrency-related queries and data retrieval."""

    def __init__(self, config: Dict[str, Any]) -> None:
        super().__init__(config)
        self.tools_provided = Config.tools
        
        # Initialize tools registry
        bootstrap_tools()
        
        # Get tools from registry
        self.price_tool = ToolRegistry.get("get_coin_price")
        self.floor_price_tool = ToolRegistry.get("get_nft_floor_price")
        self.tvl_tool = ToolRegistry.get("get_protocol_tvl")
        self.fdv_tool = ToolRegistry.get("get_fully_diluted_valuation")
        self.market_cap_tool = ToolRegistry.get("get_market_cap")

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for crypto-related queries."""
        try:
            messages = [
                SystemMessage(
                    content="You are a cryptocurrency data analyst that can fetch various metrics about cryptocurrencies, NFTs and DeFi protocols. "
                    "You can get price data for any cryptocurrency, floor prices for NFTs, Total Value Locked (TVL) for DeFi protocols, "
                    "and market metrics like market cap and fully diluted valuation (FDV) for cryptocurrencies. "
                    "When users ask questions, carefully analyze what metric they're looking for and use the appropriate tool. "
                    "For example:\n"
                    "- For general price queries, use the price tool\n"
                    "- For NFT valuations, use the floor price tool\n"
                    "- For DeFi protocol size/usage, use the TVL tool\n"
                    "- For token valuations, use market cap or FDV tools\n\n"
                    "Don't make assumptions about function arguments - they should always be supplied by the user. "
                    "Ask for clarification if a request is ambiguous or if you're unsure which metric would be most appropriate."
                ),
                *request.messages_for_llm,
            ]
            response = await self._call_llm_with_tools(messages, self.tools_provided)
            return await self._handle_llm_response(response)

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    async def _execute_tool(self, func_name: str, args: dict) -> AgentResponse:
        """Execute the appropriate crypto tool based on function name."""
        try:
            metadata = {}

            if func_name == "get_coin_price":
                if "coin_name" not in args:
                    return AgentResponse.needs_info(content="Please provide the name of the coin to get its price")
                
                result = await self.price_tool.execute(**args)
                content = result.get("message", "")
                
                if result.get("coinId"):
                    metadata["coinId"] = result["coinId"]
                    
            elif func_name == "get_nft_floor_price":
                if "nft_name" not in args:
                    return AgentResponse.needs_info(
                        content="Please provide the name of the NFT collection to get its floor price"
                    )
                    
                result = await self.floor_price_tool.execute(**args)
                content = result.get("message", "")
                
            elif func_name == "get_fully_diluted_valuation":
                if "coin_name" not in args:
                    return AgentResponse.needs_info(
                        content="Please provide the name of the coin to get its fully diluted valuation"
                    )
                    
                result = await self.fdv_tool.execute(**args)
                content = result.get("message", "")
                
            elif func_name == "get_protocol_tvl":
                if "protocol_name" not in args:
                    return AgentResponse.needs_info(
                        content="Please provide the name of the protocol to get its total value locked"
                    )
                    
                result = await self.tvl_tool.execute(**args)
                content = result.get("message", "")
                
            elif func_name == "get_market_cap":
                if "coin_name" not in args:
                    return AgentResponse.needs_info(content="Please provide the name of the coin to get its market cap")
                    
                result = await self.market_cap_tool.execute(**args)
                content = result.get("message", "")
                
            else:
                return AgentResponse.needs_info(
                    content=(
                        "I don't know how to handle that type of request. "
                        "Could you try asking about cryptocurrency news instead?"
                    )
                )

            if not content or "error" in content.lower() or "not found" in content.lower() or "failed" in content.lower():
                return AgentResponse.needs_info(content=content if content else "Failed to retrieve the requested information.")

            return AgentResponse.success(content=content, metadata=metadata)

        except Exception as e:
            logger.error(f"Error executing tool {func_name}: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))