import logging
from typing import Any, Dict
from unittest.mock import Mock, patch

import pytest
from models.service.chat_models import AgentResponse
from services.agents.base_agent.agent import BaseAgent
from stores.wallet_manager import wallet_manager_instance

logger = logging.getLogger(__name__)


@pytest.fixture
def base_agent(llm):
    config: Dict[str, Any] = {
        "name": "base",
        "description": "Agent for Base blockchain transactions",
    }
    return BaseAgent(config=config, llm=llm)


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_get_balance_success(base_agent, mock_wallet, make_chat_request):
    wallet_manager_instance.configure_cdp_client = Mock(return_value=True)
    wallet_manager_instance.get_active_wallet = Mock(return_value=mock_wallet)

    request = make_chat_request(content="What's my ETH balance?", agent_name="base")

    with patch("services.agents.base_agent.tools.get_balance") as mock_get_balance:
        mock_get_balance.return_value = {
            "address": "0x123",
            "balance": "1.5",
            "asset": "ETH",
        }

        response = await base_agent._process_request(request)

        assert isinstance(response, AgentResponse)
        assert "1.5 ETH" in response.content
        assert response.response_type.value == "success"


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_no_cdp_client(base_agent, make_chat_request):
    wallet_manager_instance.configure_cdp_client = Mock(return_value=False)

    request = make_chat_request(content="What's my ETH balance?", agent_name="base")

    response = await base_agent._process_request(request)

    assert isinstance(response, AgentResponse)
    assert "CDP client is not initialized" in response.content
    assert response.response_type.value == "success"


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_no_active_wallet(base_agent, make_chat_request):
    wallet_manager_instance.configure_cdp_client = Mock(return_value=True)
    wallet_manager_instance.get_active_wallet = Mock(return_value=None)

    request = make_chat_request(content="What's my ETH balance?", agent_name="base")

    response = await base_agent._process_request(request)

    assert isinstance(response, AgentResponse)
    assert "select or create a wallet" in response.content
    assert response.response_type.value == "success"


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_swap_assets(base_agent, mock_wallet, make_chat_request):
    wallet_manager_instance.configure_cdp_client = Mock(return_value=True)
    wallet_manager_instance.get_active_wallet = Mock(return_value=mock_wallet)

    request = make_chat_request(content="Swap 1 ETH for USDC", agent_name="base")

    response = await base_agent._process_request(request)

    assert isinstance(response, AgentResponse)
    assert response.action_type == "swap"
    assert "Ready to perform swap" in response.content
    assert response.response_type.value == "action_required"


@pytest.mark.benchmark
@pytest.mark.asyncio
async def test_transfer_asset(base_agent, mock_wallet, make_chat_request):
    wallet_manager_instance.configure_cdp_client = Mock(return_value=True)
    wallet_manager_instance.get_active_wallet = Mock(return_value=mock_wallet)

    request = make_chat_request(content="Send 1 ETH to 0x456", agent_name="base")

    response = await base_agent._process_request(request)

    assert isinstance(response, AgentResponse)
    assert response.action_type == "transfer"
    assert "Ready to perform transfer" in response.content
    assert response.response_type.value == "action_required"
