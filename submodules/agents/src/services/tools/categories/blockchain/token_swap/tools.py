"""
Tools for token swapping operations.
"""

import logging
import time
from typing import Any, Dict

from services.agents.token_swap.config import Config
from services.agents.token_swap.models import SwapQuoteResponse, TransactionResponse, TransactionStatus
from services.agents.token_swap.utils.exceptions import InsufficientFundsError, SwapNotPossibleError, TokenNotFoundError
from services.agents.token_swap.utils.helpers import convert_to_readable_unit, convert_to_smallest_unit, get_swap_quote, validate_token_pair
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage
from web3 import Web3

logger = logging.getLogger(__name__)


class SwapCoinsTool(Tool):
    """Tool for swapping one cryptocurrency for another."""
    
    name = "swap_tokens"
    description = (
        "Construct a token swap transaction with validation and quote. "
        "Make sure the source token and destination token ONLY include "
        "the token symbol, not the amount. The amount is a separate field."
    )
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "source_token": {
                "type": "string",
                "description": "Name or address of the source token to sell",
            },
            "destination_token": {
                "type": "string",
                "description": "Name or address of the destination token to buy",
            },
            "amount": {
                "type": "string",
                "description": "Amount of source token to swap",
            },
            "chain_id": {
                "type": "integer",
                "description": "Blockchain network ID",
            },
            "wallet_address": {
                "type": "string", 
                "description": "User's wallet address",
            },
        },
        "required": ["source_token", "destination_token", "amount", "chain_id", "wallet_address"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the token swap tool.
        
        Args:
            source_token: Symbol of source token
            destination_token: Symbol of destination token
            amount: Amount of source token to swap
            chain_id: Blockchain network ID
            wallet_address: User's wallet address
            
        Returns:
            Dict[str, Any]: The result of the swap operation
            
        Raises:
            ToolExecutionError: If the swap operation fails
        """
        log_tool_usage(self.name, kwargs)
        
        source_token = kwargs.get("source_token")
        destination_token = kwargs.get("destination_token")
        amount_str = kwargs.get("amount")
        chain_id = kwargs.get("chain_id")
        wallet_address = kwargs.get("wallet_address")
        
        try:
            amount = float(amount_str)
        except (ValueError, TypeError):
            raise ToolExecutionError(f"Invalid amount format: {amount_str}", self.name)
            
        return await self._swap_coins(source_token, destination_token, amount, chain_id, wallet_address)
    
    @handle_tool_exceptions("swap_tokens")
    async def _swap_coins(
        self,
        source_token: str,
        destination_token: str,
        amount: float,
        chain_id: int,
        wallet_address: str,
    ) -> Dict[str, Any]:
        """
        Get a quote for swapping tokens.

        Args:
            source_token: Symbol of source token
            destination_token: Symbol of destination token
            amount: Amount of source token to swap
            chain_id: Blockchain network ID
            wallet_address: User's wallet address

        Returns:
            Dict with swap details
        """
        logger.info(
            f"Swapping {amount} {source_token} to {destination_token} on chain {chain_id} for wallet {wallet_address}"
        )

        try:
            # Validate inputs
            if not source_token or not destination_token:
                raise ToolExecutionError("Source and destination tokens must be provided", self.name)

            if amount <= 0:
                raise ToolExecutionError("Swap amount must be greater than zero", self.name)

            if not wallet_address:
                raise ToolExecutionError("Wallet address must be provided", self.name)

            if not chain_id:
                raise ToolExecutionError("Chain ID must be provided", self.name)

            # Initialize Web3 with appropriate provider
            if str(chain_id) not in Config.WEB3RPCURL:
                raise ToolExecutionError(f"Unsupported chain ID: {chain_id}", self.name)

            web3 = Web3(Web3.HTTPProvider(Config.WEB3RPCURL[str(chain_id)]))

            if not web3.is_connected():
                raise ToolExecutionError(f"Cannot connect to RPC for chain ID: {chain_id}", self.name)

            # Validate the swap and get token addresses and symbols
            (
                source_token_address,
                source_token_symbol,
                destination_token_address,
                destination_token_symbol,
            ) = await validate_token_pair(web3, source_token, destination_token, chain_id, amount, wallet_address)

            # Get quote from exchange API
            time.sleep(1)  # Rate limiting
            source_amount_in_wei = convert_to_smallest_unit(web3, amount, source_token_address)

            quote_result = await get_swap_quote(
                source_token_address,
                destination_token_address,
                source_amount_in_wei,
                chain_id,
            )

            if not quote_result:
                raise ToolExecutionError(
                    f"Failed to generate a quote for {source_token_symbol} to {destination_token_symbol}. "
                    "Please ensure you're on the correct network.",
                    self.name
                )

            # Extract estimated destination amount from quote
            destination_amount_in_wei = int(quote_result["dstAmount"])
            destination_amount = convert_to_readable_unit(web3, destination_amount_in_wei, destination_token_address)

            # Create response dict
            swap_response = SwapQuoteResponse(
                success=True,
                src=source_token_symbol,
                src_address=source_token_address,
                src_amount=amount,
                dst=destination_token_symbol,
                dst_address=destination_token_address,
                dst_amount=float(destination_amount),
                approve_tx_cb="/approve",
                swap_tx_cb="/swap",
                estimated_gas=quote_result.get("estimatedGas"),
            )
            
            response_dict = swap_response.model_dump()
            # Add a formatted message for user-friendly display
            response_dict["message"] = (
                f"Swap quote: {amount} {source_token_symbol} → {destination_amount} {destination_token_symbol}"
            )
            
            return response_dict
            
        except (TokenNotFoundError, InsufficientFundsError, SwapNotPossibleError) as e:
            # Let expected errors propagate to be handled
            logger.error(f"Swap error: {str(e)}", exc_info=True)
            raise ToolExecutionError(str(e), self.name)


class GetTransactionStatusTool(Tool):
    """Tool for checking the status of blockchain transactions."""
    
    name = "get_transaction_status"
    description = "Get the current status of a transaction"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "tx_hash": {
                "type": "string",
                "description": "Transaction hash to check status for",
            },
            "chain_id": {
                "type": "integer",
                "description": "Blockchain network ID",
            },
            "wallet_address": {
                "type": "string",
                "description": "User's wallet address",
            },
        },
        "required": ["tx_hash", "chain_id", "wallet_address"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the transaction status tool.
        
        Args:
            tx_hash: Transaction hash to check
            chain_id: Blockchain network ID
            wallet_address: User's wallet address
            
        Returns:
            Dict[str, Any]: The transaction status details
            
        Raises:
            ToolExecutionError: If the status check fails
        """
        log_tool_usage(self.name, kwargs)
        
        tx_hash = kwargs.get("tx_hash")
        chain_id = kwargs.get("chain_id")
        wallet_address = kwargs.get("wallet_address")
        
        return await self._get_transaction_status(tx_hash, chain_id, wallet_address)
    
    @handle_tool_exceptions("get_transaction_status")
    async def _get_transaction_status(
        self,
        tx_hash: str,
        chain_id: int,
        wallet_address: str,
    ) -> Dict[str, Any]:
        """
        Get the status of a transaction.

        Args:
            tx_hash: Transaction hash
            chain_id: Blockchain network ID
            wallet_address: User's wallet address

        Returns:
            Dict with transaction details
        """
        logger.info(f"Getting status for transaction {tx_hash} on chain {chain_id}")

        # Validate inputs
        if not tx_hash:
            raise ToolExecutionError("Transaction hash must be provided", self.name)

        if not chain_id:
            raise ToolExecutionError("Chain ID must be provided", self.name)

        if not wallet_address:
            raise ToolExecutionError("Wallet address must be provided", self.name)

        # Check if chain is supported
        if str(chain_id) not in Config.WEB3RPCURL:
            raise ToolExecutionError(f"Unsupported chain ID: {chain_id}", self.name)

        # Initialize Web3 with appropriate provider
        web3 = Web3(Web3.HTTPProvider(Config.WEB3RPCURL[str(chain_id)]))

        if not web3.is_connected():
            raise ToolExecutionError(f"Cannot connect to RPC for chain ID: {chain_id}", self.name)

        # Get transaction receipt
        try:
            receipt = web3.eth.get_transaction_receipt(tx_hash)
        except Exception as e:
            logger.warning(f"Failed to get transaction receipt: {str(e)}")
            receipt = None

        # Get transaction details
        try:
            tx = web3.eth.get_transaction(tx_hash)
        except Exception as e:
            logger.warning(f"Failed to get transaction: {str(e)}")
            # If we can't get the transaction, return a minimal response
            raise ToolExecutionError(f"Transaction not found: {str(e)}", self.name)

        # Determine status
        if receipt is None:
            status = TransactionStatus.PENDING
            status_str = "Pending"
        elif receipt.status == 1:
            status = TransactionStatus.CONFIRMED
            status_str = "Confirmed"
        else:
            status = TransactionStatus.FAILED
            status_str = "Failed"

        # Create response
        tx_response = TransactionResponse(
            success=True,
            status=status,
            tx_hash=tx_hash,
            from_address=tx["from"],
            to_address=tx["to"],
            value=web3.from_wei(tx["value"], "ether") if tx["value"] else None,
            network_id=chain_id,
            gas_used=receipt.gasUsed if receipt else None,
            gas_price=tx["gasPrice"],
            metadata={
                "block_number": receipt.blockNumber if receipt else None,
                "block_hash": receipt.blockHash.hex() if receipt and receipt.blockHash else None,
                "confirmations": web3.eth.block_number - receipt.blockNumber if receipt and receipt.blockNumber else 0,
            },
        )
        
        response_dict = tx_response.model_dump()
        
        # Add a formatted message for user-friendly display
        response_dict["message"] = (
            f"Transaction {tx_hash} is {status_str}. "
            f"From: {tx['from']} To: {tx['to']}"
        )
        
        return response_dict