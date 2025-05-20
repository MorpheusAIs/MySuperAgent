"""
Tools for MOR rewards management.
"""

import logging
from typing import Any, Dict

from services.agents.mor_rewards.config import Config
from services.tools.categories.blockchain.mor_rewards.tool_types import MorRewardsToolType
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage
from web3 import Web3

logger = logging.getLogger(__name__)


class GetCurrentUserRewardTool(Tool):
    """Tool for fetching current MOR user rewards."""
    
    name = MorRewardsToolType.GET_CURRENT_USER_REWARD.value
    description = "Fetch the token amount of currently accrued MOR rewards for a user address from a specific pool."
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "wallet_address": {
                "type": "string",
                "description": "The wallet address to check rewards for",
            },
            "pool_id": {
                "type": "integer",
                "description": "The ID of the pool to check rewards from",
            },
        },
        "required": ["wallet_address", "pool_id"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the get current user reward tool.
        
        Args:
            wallet_address: The wallet address to check rewards for
            pool_id: The ID of the pool to check rewards from
            
        Returns:
            Dict[str, Any]: The reward amount and information
            
        Raises:
            ToolExecutionError: If the reward fetch fails
        """
        log_tool_usage(self.name, kwargs)
        
        wallet_address = kwargs.get("wallet_address")
        pool_id = kwargs.get("pool_id")
        
        if not wallet_address:
            raise ToolExecutionError("Wallet address must be provided", self.name)
        if pool_id is None:
            raise ToolExecutionError("Pool ID must be provided", self.name)
        
        return await self._get_current_user_reward(wallet_address, pool_id)
    
    @handle_tool_exceptions("get_current_user_reward")
    async def _get_current_user_reward(self, wallet_address: str, pool_id: int) -> Dict[str, Any]:
        """Fetch the current user reward."""
        web3 = Web3(Web3.HTTPProvider(Config.WEB3RPCURL["1"]))
        distribution_contract = web3.eth.contract(
            address=web3.to_checksum_address(Config.DISTRIBUTION_PROXY_ADDRESS),
            abi=Config.DISTRIBUTION_ABI,
        )

        if not web3.is_connected():
            raise ToolExecutionError("Unable to connect to Ethereum network", self.name)

        reward = distribution_contract.functions.getCurrentUserReward(
            pool_id, web3.to_checksum_address(wallet_address)
        ).call()
        formatted_reward = web3.from_wei(reward, "ether")
        
        return {
            "reward": round(formatted_reward, 4),
            "pool_id": pool_id,
            "wallet_address": wallet_address,
            "message": f"Current reward for wallet {wallet_address} in pool {pool_id} is {round(formatted_reward, 4)} MOR"
        }


class GetAllPoolRewardsTool(Tool):
    """Tool for fetching all pool rewards for a user."""
    
    name = MorRewardsToolType.GET_ALL_POOL_REWARDS.value
    description = "Fetch all MOR rewards across available pools for a user address."
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "wallet_address": {
                "type": "string",
                "description": "The wallet address to check rewards for",
            },
        },
        "required": ["wallet_address"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the get all pool rewards tool.
        
        Args:
            wallet_address: The wallet address to check rewards for
            
        Returns:
            Dict[str, Any]: The reward amounts across all pools
            
        Raises:
            ToolExecutionError: If the reward fetch fails
        """
        log_tool_usage(self.name, kwargs)
        
        wallet_address = kwargs.get("wallet_address")
        
        if not wallet_address:
            raise ToolExecutionError("Wallet address must be provided", self.name)
        
        return await self._get_all_pool_rewards(wallet_address)
    
    @handle_tool_exceptions("get_all_pool_rewards")
    async def _get_all_pool_rewards(self, wallet_address: str) -> Dict[str, Any]:
        """Fetch all pool rewards for a user."""
        web3 = Web3(Web3.HTTPProvider(Config.WEB3RPCURL["1"]))
        distribution_contract = web3.eth.contract(
            address=web3.to_checksum_address(Config.DISTRIBUTION_PROXY_ADDRESS),
            abi=Config.DISTRIBUTION_ABI,
        )

        if not web3.is_connected():
            raise ToolExecutionError("Unable to connect to Ethereum network", self.name)

        # Get rewards for all pools (assuming pools 0 and 1)
        rewards = {
            0: 0,
            1: 0
        }
        
        try:
            for pool_id in rewards.keys():
                reward = distribution_contract.functions.getCurrentUserReward(
                    pool_id, web3.to_checksum_address(wallet_address)
                ).call()
                rewards[pool_id] = round(web3.from_wei(reward, "ether"), 4)
        except Exception as e:
            logger.error(f"Error fetching rewards: {str(e)}")
            raise ToolExecutionError(f"Error fetching rewards: {str(e)}", self.name)
            
        total_reward = sum(rewards.values())
        available_pools = [pool_id for pool_id, amount in rewards.items() if amount > 0]
        
        return {
            "rewards": rewards,
            "total_reward": total_reward,
            "available_pools": available_pools,
            "wallet_address": wallet_address,
            "message": f"Total rewards for wallet {wallet_address} across all pools: {total_reward} MOR"
        }