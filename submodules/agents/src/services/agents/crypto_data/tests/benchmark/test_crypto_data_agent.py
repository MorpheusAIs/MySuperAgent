import logging
from typing import Any, Dict
from unittest.mock import patch

import pytest
from models.service.chat_models import AgentResponse
from services.agents.crypto_data.agent import CryptoDataAgent

logger = logging.getLogger(__name__)


@pytest.fixture
def crypto_agent(llm):
    config: Dict[str, Any] = {
        "name": "crypto_data",
        "description": "Agent for crypto data queries",
    }
    return CryptoDataAgent(config=config, llm=llm)


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_get_price_success(crypto_agent, make_chat_request):
    request = make_chat_request(content="What's the price of Bitcoin?", agent_name="crypto_data")

    with patch("services.agents.crypto_data.tools.get_coin_price_tool") as mock_price:
        mock_price.return_value = "Bitcoin price is $50,000"
        with patch("services.agents.crypto_data.tools.get_coingecko_id") as mock_id:
            mock_id.return_value = "bitcoin"
            with patch("services.agents.crypto_data.tools.get_tradingview_symbol") as mock_symbol:
                mock_symbol.return_value = "BTCUSD"

                response = await crypto_agent._process_request(request)

                assert isinstance(response, AgentResponse)
                assert "Bitcoin price" in response.content
                assert response.response_type.value == "success"
                assert response.metadata.get("coinId") == "BTCUSD"


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_get_market_cap_success(crypto_agent, make_chat_request):
    request = make_chat_request(content="What's the market cap of Ethereum?", agent_name="crypto_data")

    with patch("services.agents.crypto_data.tools.get_coin_market_cap_tool") as mock_mcap:
        mock_mcap.return_value = "Ethereum market cap is $200B"
        with patch("services.agents.crypto_data.tools.get_coingecko_id") as mock_id:
            mock_id.return_value = "ethereum"

            response = await crypto_agent._process_request(request)

            assert isinstance(response, AgentResponse)
            assert "market cap" in response.content
            assert response.response_type.value == "success"


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_get_tvl_success(crypto_agent, make_chat_request):
    request = make_chat_request(content="What's the TVL of Uniswap?", agent_name="crypto_data")

    with patch("services.agents.crypto_data.tools.get_protocol_total_value_locked_tool") as mock_tvl:
        mock_tvl.return_value = "Uniswap TVL is $5B"
        with patch("services.agents.crypto_data.tools.get_coingecko_id") as mock_id:
            mock_id.return_value = "uniswap"

            response = await crypto_agent._process_request(request)

            assert isinstance(response, AgentResponse)
            assert "TVL" in response.content
            assert response.response_type.value == "success"


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_get_floor_price_success(crypto_agent, make_chat_request):
    request = make_chat_request(content="What's the floor price of BAYC?", agent_name="crypto_data")

    with patch("services.agents.crypto_data.tools.get_nft_floor_price_tool") as mock_floor:
        mock_floor.return_value = "BAYC floor price is 30 ETH"
        with patch("services.agents.crypto_data.tools.get_coingecko_id") as mock_id:
            mock_id.return_value = "bayc"

            response = await crypto_agent._process_request(request)

            assert isinstance(response, AgentResponse)
            assert "floor price" in response.content
            assert response.response_type.value == "success"


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_invalid_request(crypto_agent, make_chat_request):
    request = make_chat_request(content="Do something invalid", agent_name="crypto_data")

    response = await crypto_agent._process_request(request)

    assert isinstance(response, AgentResponse)
    assert response.response_type.value == "needs_info"
    assert "I don't know how to handle that type of request" in response.content


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_missing_argument(crypto_agent, make_chat_request):
    request = make_chat_request(content="Get price", agent_name="crypto_data")

    response = await crypto_agent._process_request(request)

    assert isinstance(response, AgentResponse)
    assert response.response_type.value == "needs_info"
    assert "Please provide the name of the coin" in response.content
