"""
Tools for MOR token claims.
"""

import logging
from typing import Any, Dict

from services.agents.mor_claims.config import Config
from services.tools.categories.blockchain.mor_claims.tool_types import MorClaimsToolType
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage
from web3 import Web3

logger = logging.getLogger(__name__)


class GetCurrentUserRewardTool(Tool):
    """Tool for fetching current MOR user rewards."""
    
    name = MorClaimsToolType.GET_CURRENT_USER_REWARD.value
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


class PrepareClaimTransactionTool(Tool):
    """Tool for preparing claim transaction for MOR rewards."""
    
    name = MorClaimsToolType.PREPARE_CLAIM_TRANSACTION.value
    description = "Prepare a transaction to claim MOR rewards"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "pool_id": {
                "type": "integer",
                "description": "The ID of the pool to claim from",
            },
            "wallet_address": {
                "type": "string",
                "description": "The wallet address to claim rewards for",
            },
        },
        "required": ["pool_id", "wallet_address"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the prepare claim transaction tool.
        
        Args:
            pool_id: The ID of the pool to claim from
            wallet_address: The wallet address to claim rewards for
            
        Returns:
            Dict[str, Any]: The prepared transaction data
            
        Raises:
            ToolExecutionError: If the transaction preparation fails
        """
        log_tool_usage(self.name, kwargs)
        
        pool_id = kwargs.get("pool_id")
        wallet_address = kwargs.get("wallet_address")
        
        if pool_id is None:
            raise ToolExecutionError("Pool ID must be provided", self.name)
        if not wallet_address:
            raise ToolExecutionError("Wallet address must be provided", self.name)
        
        return await self._prepare_claim_transaction(pool_id, wallet_address)
    
    @handle_tool_exceptions("prepare_claim_transaction")
    async def _prepare_claim_transaction(self, pool_id: int, wallet_address: str) -> Dict[str, Any]:
        """Prepare a claim transaction."""
        web3 = Web3(Web3.HTTPProvider(Config.WEB3RPCURL["1"]))
        contract = web3.eth.contract(
            address=web3.to_checksum_address(Config.DISTRIBUTION_PROXY_ADDRESS),
            abi=Config.DISTRIBUTION_ABI,
        )
        tx_data = contract.encode_abi(fn_name="claim", args=[pool_id, web3.to_checksum_address(wallet_address)])
        mint_fee = web3.to_wei(Config.MINT_FEE, "ether")
        estimated_gas = contract.functions.claim(pool_id, web3.to_checksum_address(wallet_address)).estimate_gas(
            {"from": web3.to_checksum_address(wallet_address), "value": mint_fee}
        )
        
        return {
            "transaction": {
                "to": Config.DISTRIBUTION_PROXY_ADDRESS,
                "data": tx_data,
                "value": str(mint_fee),
                "gas": str(estimated_gas),
                "chainId": "1",
            },
            "pool_id": pool_id,
            "wallet_address": wallet_address,
            "message": f"Prepared claim transaction for pool {pool_id} and wallet {wallet_address}"
        }


class GetClaimStatusTool(Tool):
    """Tool for checking claim transaction status."""
    
    name = MorClaimsToolType.GET_CLAIM_STATUS.value
    description = "Check the status of a claim transaction"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "transaction_hash": {
                "type": "string",
                "description": "The transaction hash to check",
            },
        },
        "required": ["transaction_hash"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the get claim status tool.
        
        Args:
            transaction_hash: The transaction hash to check
            
        Returns:
            Dict[str, Any]: The transaction status
            
        Raises:
            ToolExecutionError: If the status check fails
        """
        log_tool_usage(self.name, kwargs)
        
        transaction_hash = kwargs.get("transaction_hash")
        
        if not transaction_hash:
            raise ToolExecutionError("Transaction hash must be provided", self.name)
        
        return await self._get_claim_status(transaction_hash)
    
    @handle_tool_exceptions("get_claim_status")
    async def _get_claim_status(self, transaction_hash: str) -> Dict[str, Any]:
        """Check the status of a claim transaction."""
        web3 = Web3(Web3.HTTPProvider(Config.WEB3RPCURL["1"]))
        
        if not web3.is_connected():
            raise ToolExecutionError("Unable to connect to Ethereum network", self.name)
            
        try:
            receipt = web3.eth.get_transaction_receipt(transaction_hash)
            if receipt:
                status = "Confirmed" if receipt.status == 1 else "Failed"
                block_number = receipt.blockNumber
                return {
                    "status": status,
                    "transaction_hash": transaction_hash,
                    "block_number": block_number,
                    "message": f"Transaction {transaction_hash} is {status} in block {block_number}"
                }
            else:
                return {
                    "status": "Pending",
                    "transaction_hash": transaction_hash,
                    "message": f"Transaction {transaction_hash} is still pending"
                }
        except Exception as e:
            logger.error(f"Error checking transaction status: {str(e)}")
            return {
                "status": "Unknown",
                "transaction_hash": transaction_hash,
                "error": str(e),
                "message": f"Unable to determine status of transaction {transaction_hash}: {str(e)}"
            }