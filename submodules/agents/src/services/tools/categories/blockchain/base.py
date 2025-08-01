"""
Tools for interacting with the Base blockchain.
"""

import logging
from typing import Any, Dict

from cdp import Wallet
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage
from stores.wallet_manager import wallet_manager_instance

logger = logging.getLogger(__name__)


class SwapAssetsTool(Tool):
    """Tool for swapping one asset for another on the Base blockchain."""
    
    name = "swap_assets"
    description = "Swap one asset for another (Base Mainnet only)"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "amount": {"type": "string", "description": "Amount to swap"},
            "from_asset_id": {
                "type": "string",
                "description": "Asset ID to swap from",
            },
            "to_asset_id": {
                "type": "string",
                "description": "Asset ID to swap to",
            },
        },
        "required": ["amount", "from_asset_id", "to_asset_id"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the swap assets tool.
        
        Args:
            amount: Amount to swap.
            from_asset_id: Asset ID to swap from.
            to_asset_id: Asset ID to swap to.
            
        Returns:
            Dict[str, Any]: The result of the swap operation.
            
        Raises:
            ToolExecutionError: If the swap operation fails.
        """
        log_tool_usage(self.name, kwargs)
        
        amount = kwargs.get("amount")
        from_asset_id = kwargs.get("from_asset_id")
        to_asset_id = kwargs.get("to_asset_id")
        
        # Get the active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        return await self._swap_assets(wallet, amount, from_asset_id, to_asset_id)
    
    @handle_tool_exceptions("swap_assets")
    async def _swap_assets(
        self, agent_wallet: Wallet, amount: str, from_asset_id: str, to_asset_id: str
    ) -> Dict[str, Any]:
        """Swap one asset for another (Base Mainnet only)"""
        if agent_wallet.network_id != "base-mainnet":
            raise ToolExecutionError("Asset swaps only available on Base Mainnet", self.name)

        from_asset_id = from_asset_id.lower()
        to_asset_id = to_asset_id.lower()
        logger.info("Attempting swap on Base Mainnet:")
        logger.info(f"From asset: {from_asset_id}")
        logger.info(f"To asset: {to_asset_id}")
        logger.info(f"Amount: {amount}")

        # Check wallet balance
        balance = agent_wallet.balance(from_asset_id)
        logger.info(f"Wallet balance of {from_asset_id}: {balance}")

        if float(balance) < float(amount):
            raise ToolExecutionError(
                f"Insufficient balance. Have {balance}, need {amount}", 
                self.name
            )

        try:
            trade = agent_wallet.trade(amount, from_asset_id, to_asset_id)
            logger.info(f"Trade constructed: {trade}")
        except Exception as e:
            if "internal" in str(e).lower():
                raise ToolExecutionError(
                    "Not enough ETH. Please ensure you have sufficient ETH for gas fees.",
                    self.name
                )
            raise ToolExecutionError(str(e), self.name)

        trade.wait()
        logger.info("Trade completed")

        return {
            "success": True,
            "from_asset": from_asset_id,
            "to_asset": to_asset_id,
            "amount": amount,
            "message": f"Successfully swapped {amount} {from_asset_id} to {to_asset_id}.",
        }


class TransferAssetTool(Tool):
    """Tool for transferring assets on the Base blockchain."""
    
    name = "transfer_asset"
    description = "Transfer an asset to another address"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "amount": {"type": "string", "description": "Amount to transfer"},
            "asset_id": {
                "type": "string",
                "description": "Asset ID to transfer",
            },
            "destination_address": {
                "type": "string",
                "description": "Destination address to transfer to",
            },
        },
        "required": ["amount", "asset_id", "destination_address"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the transfer asset tool.
        
        Args:
            amount: Amount to transfer.
            asset_id: Asset ID to transfer.
            destination_address: Destination address to transfer to.
            
        Returns:
            Dict[str, Any]: The result of the transfer operation.
            
        Raises:
            ToolExecutionError: If the transfer operation fails.
        """
        log_tool_usage(self.name, kwargs)
        
        amount = kwargs.get("amount")
        asset_id = kwargs.get("asset_id")
        destination_address = kwargs.get("destination_address")
        
        # Get the active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        return await self._transfer_asset(wallet, amount, asset_id, destination_address)
    
    @handle_tool_exceptions("transfer_asset")
    async def _transfer_asset(
        self, agent_wallet: Wallet, amount: str, asset_id: str, destination_address: str
    ) -> Dict[str, Any]:
        """Transfer an asset to another address"""
        # Create the transfer
        gasless = agent_wallet.network_id == "base-mainnet" and asset_id.lower() == "usdc"
        transfer = agent_wallet.default_address.transfer(
            amount=amount,
            asset_id=asset_id,
            destination=destination_address,
            gasless=gasless,
        )

        # Wait for transfer to settle and return status
        transfer.wait()

        return {
            "success": transfer.status,
            "from": agent_wallet.default_address.address_id,
            "to": destination_address,
            "amount": amount,
            "asset": asset_id,
            "transaction_link": transfer.transaction_link,
            "message": f"Successfully transferred {amount} {asset_id} to {destination_address}.",
        }


class GetBalanceTool(Tool):
    """Tool for getting the balance of an asset on the Base blockchain."""
    
    name = "get_balance"
    description = "Get balance of a specific asset"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "asset_id": {
                "type": "string",
                "description": "Asset ID to check balance for",
            }
        },
        "required": ["asset_id"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the get balance tool.
        
        Args:
            asset_id: Asset ID to check balance for.
            
        Returns:
            Dict[str, Any]: The balance information.
            
        Raises:
            ToolExecutionError: If the balance check fails.
        """
        log_tool_usage(self.name, kwargs)
        
        asset_id = kwargs.get("asset_id")
        
        # Get the active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        return await self._get_balance(wallet, asset_id)
    
    @handle_tool_exceptions("get_balance")
    async def _get_balance(self, agent_wallet: Wallet, asset_id: str) -> Dict[str, Any]:
        """Get balance of a specific asset"""
        balance = agent_wallet.balance(asset_id)
        return {
            "success": True,
            "asset": asset_id,
            "balance": str(balance),
            "address": agent_wallet.default_address.address_id,
            "message": f"Wallet {agent_wallet.default_address.address_id} has balance of {balance} {asset_id}.",
        }


class CreateTokenTool(Tool):
    """Tool for creating a new ERC-20 token on the Base blockchain."""
    
    name = "create_token"
    description = "Create a new ERC-20 token"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Name of the token"},
            "symbol": {"type": "string", "description": "Symbol of the token"},
            "initial_supply": {
                "type": "integer",
                "description": "Initial supply of tokens",
            },
        },
        "required": ["name", "symbol", "initial_supply"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the create token tool.
        
        Args:
            name: Name of the token.
            symbol: Symbol of the token.
            initial_supply: Initial supply of tokens.
            
        Returns:
            Dict[str, Any]: The result of the token creation.
            
        Raises:
            ToolExecutionError: If the token creation fails.
        """
        log_tool_usage(self.name, kwargs)
        
        name = kwargs.get("name")
        symbol = kwargs.get("symbol")
        initial_supply = kwargs.get("initial_supply")
        
        # Get the active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        return await self._create_token(wallet, name, symbol, initial_supply)
    
    @handle_tool_exceptions("create_token")
    async def _create_token(
        self, agent_wallet: Wallet, name: str, symbol: str, initial_supply: int
    ) -> Dict[str, Any]:
        """Create a new ERC-20 token"""
        deployed_contract = agent_wallet.deploy_token(name, symbol, initial_supply)
        deployed_contract.wait()

        return {
            "success": True,
            "contract_address": deployed_contract.contract_address,
            "name": name,
            "symbol": symbol,
            "supply": initial_supply,
            "message": f"Successfully created token {name} ({symbol}) with initial supply {initial_supply}.",
        }


class RequestEthFromFaucetTool(Tool):
    """Tool for requesting ETH from a testnet faucet."""
    
    name = "request_eth_from_faucet"
    description = "Request ETH from testnet faucet"
    category = "blockchain"
    parameters = {"type": "object", "properties": {}}
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the request ETH from faucet tool.
        
        Returns:
            Dict[str, Any]: The result of the faucet request.
            
        Raises:
            ToolExecutionError: If the faucet request fails.
        """
        log_tool_usage(self.name, kwargs)
        
        # Get the active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        return await self._request_eth_from_faucet(wallet)
    
    @handle_tool_exceptions("request_eth_from_faucet")
    async def _request_eth_from_faucet(self, agent_wallet: Wallet) -> Dict[str, Any]:
        """Request ETH from testnet faucet"""
        if agent_wallet.network_id == "base-mainnet":
            raise ToolExecutionError("Faucet only available on testnet", self.name)

        return {
            "success": True,
            "address": agent_wallet.default_address.address_id,
            "message": f"Successfully requested ETH from the testnet faucet for address {agent_wallet.default_address.address_id}.",
        }


class DeployNftTool(Tool):
    """Tool for deploying an ERC-721 NFT contract."""
    
    name = "deploy_nft"
    description = "Deploy an ERC-721 NFT contract"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Name of the NFT collection"},
            "symbol": {"type": "string", "description": "Symbol of the NFT collection"},
            "base_uri": {"type": "string", "description": "Base URI for token metadata"},
        },
        "required": ["name", "symbol", "base_uri"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the deploy NFT tool.
        
        Args:
            name: Name of the NFT collection.
            symbol: Symbol of the NFT collection.
            base_uri: Base URI for token metadata.
            
        Returns:
            Dict[str, Any]: The result of the NFT contract deployment.
            
        Raises:
            ToolExecutionError: If the NFT contract deployment fails.
        """
        log_tool_usage(self.name, kwargs)
        
        name = kwargs.get("name")
        symbol = kwargs.get("symbol")
        base_uri = kwargs.get("base_uri")
        
        # Get the active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        return await self._deploy_nft(wallet, name, symbol, base_uri)
    
    @handle_tool_exceptions("deploy_nft")
    async def _deploy_nft(
        self, agent_wallet: Wallet, name: str, symbol: str, base_uri: str
    ) -> Dict[str, Any]:
        """Deploy an ERC-721 NFT contract"""
        deployed_nft = agent_wallet.deploy_nft(name, symbol, base_uri)
        deployed_nft.wait()

        return {
            "success": True,
            "contract_address": deployed_nft.contract_address,
            "name": name,
            "symbol": symbol,
            "base_uri": base_uri,
            "message": f"Successfully deployed NFT contract {name} ({symbol}) at {deployed_nft.contract_address}.",
        }


class MintNftTool(Tool):
    """Tool for minting an NFT from a contract."""
    
    name = "mint_nft"
    description = "Mint an NFT to an address"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "contract_address": {"type": "string", "description": "NFT contract address"},
            "mint_to": {"type": "string", "description": "Address to mint NFT to"},
        },
        "required": ["contract_address", "mint_to"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the mint NFT tool.
        
        Args:
            contract_address: NFT contract address.
            mint_to: Address to mint NFT to.
            
        Returns:
            Dict[str, Any]: The result of the NFT minting.
            
        Raises:
            ToolExecutionError: If the NFT minting fails.
        """
        log_tool_usage(self.name, kwargs)
        
        contract_address = kwargs.get("contract_address")
        mint_to = kwargs.get("mint_to")
        
        # Get the active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        return await self._mint_nft(wallet, contract_address, mint_to)
    
    @handle_tool_exceptions("mint_nft")
    async def _mint_nft(
        self, agent_wallet: Wallet, contract_address: str, mint_to: str
    ) -> Dict[str, Any]:
        """Mint an NFT to an address"""
        mint_args = {"to": mint_to, "quantity": "1"}
        mint_tx = agent_wallet.invoke_contract(contract_address=contract_address, method="mint", args=mint_args)
        mint_tx.wait()

        return {
            "success": True,
            "tx_hash": mint_tx.hash,
            "contract": contract_address,
            "recipient": mint_to,
            "message": f"Successfully minted NFT from contract {contract_address} to {mint_to}.",
        }


class RegisterBasenameTool(Tool):
    """Tool for registering a basename for the agent's wallet."""
    
    name = "register_basename"
    description = "Register a basename for the agent's wallet"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "basename": {"type": "string", "description": "Basename to register"},
            "amount": {
                "type": "number",
                "description": "Amount of ETH to pay for registration",
                "default": 0.002,
            },
        },
        "required": ["basename"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the register basename tool.
        
        Args:
            basename: Basename to register.
            amount: Amount of ETH to pay for registration (default: 0.002).
            
        Returns:
            Dict[str, Any]: The result of the basename registration.
            
        Raises:
            ToolExecutionError: If the basename registration fails.
        """
        log_tool_usage(self.name, kwargs)
        
        basename = kwargs.get("basename")
        amount = kwargs.get("amount", 0.002)
        
        # Get the active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        return await self._register_basename(wallet, basename, amount)
    
    @handle_tool_exceptions("register_basename")
    async def _register_basename(
        self, agent_wallet: Wallet, basename: str, amount: float = 0.002
    ) -> Dict[str, Any]:
        """Register a basename for the agent's wallet"""
        address_id = agent_wallet.default_address.address_id
        is_mainnet = agent_wallet.network_id == "base-mainnet"

        suffix = ".base.eth" if is_mainnet else ".basetest.eth"
        if not basename.endswith(suffix):
            basename += suffix

        contract_address = (
            "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5" 
            if is_mainnet 
            else "0x49aE3cC2e3AA768B1e5654f5D3C6002144A59581"
        )

        register_tx = agent_wallet.invoke_contract(
            contract_address=contract_address,
            method="register",
            args={"name": basename},
            amount=amount,
            asset_id="eth",
        )
        register_tx.wait()

        return {
            "success": True,
            "tx_hash": register_tx.hash,
            "basename": basename,
            "owner": address_id,
            "message": f"Successfully registered basename {basename} for wallet {address_id}.",
        }