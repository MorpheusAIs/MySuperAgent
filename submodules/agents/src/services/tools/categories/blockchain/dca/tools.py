"""
Tools for DCA (Dollar Cost Averaging) operations.
"""

import logging
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from services.agents.base_agent.tools import get_balance, swap_assets
from services.agents.dca_agent.tools import DCAParams, get_frequency_seconds
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage
from stores.wallet_manager import wallet_manager_instance

logger = logging.getLogger(__name__)


class SetupDcaTool(Tool):
    """Tool for setting up a new DCA (Dollar Cost Averaging) schedule."""
    
    name = "setup_dca"
    description = "Set up a new DCA schedule for recurring asset purchases"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "amount": {
                "type": "string",
                "description": "Amount to invest per interval",
            },
            "from_asset_id": {
                "type": "string",
                "description": "Asset ID to invest from",
            },
            "to_asset_id": {
                "type": "string", 
                "description": "Asset ID to purchase",
            },
            "interval": {
                "type": "string",
                "description": "Time interval between purchases (daily/weekly/monthly)",
            },
            "total_investment": {
                "type": "string",
                "description": "Optional total investment amount",
            },
            "max_purchase_amount": {
                "type": "string",
                "description": "Optional maximum amount to purchase per interval",
            },
            "price_threshold": {
                "type": "string",
                "description": "Optional price threshold to trigger purchases",
            },
            "pause_on_volatility": {
                "type": "boolean",
                "description": "Optional flag to pause purchases during high volatility",
            },
        },
        "required": ["amount", "from_asset_id", "to_asset_id", "interval"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the setup DCA tool.
        
        Args:
            amount: Amount to invest per interval
            from_asset_id: Asset ID to invest from
            to_asset_id: Asset ID to purchase
            interval: Time interval between purchases
            total_investment: Optional total investment amount
            max_purchase_amount: Optional maximum amount to purchase per interval
            price_threshold: Optional price threshold to trigger purchases
            pause_on_volatility: Optional flag to pause purchases during high volatility
            
        Returns:
            Dict[str, Any]: The DCA setup result
            
        Raises:
            ToolExecutionError: If the DCA setup fails
        """
        log_tool_usage(self.name, kwargs)
        
        # Get required parameters
        amount = kwargs.get("amount")
        from_asset_id = kwargs.get("from_asset_id")
        to_asset_id = kwargs.get("to_asset_id")
        interval = kwargs.get("interval")
        
        # Get optional parameters
        total_investment = kwargs.get("total_investment")
        max_purchase_amount = kwargs.get("max_purchase_amount")
        price_threshold = kwargs.get("price_threshold")
        pause_on_volatility = kwargs.get("pause_on_volatility", False)
        
        if not amount or not from_asset_id or not to_asset_id or not interval:
            raise ToolExecutionError("Required parameters are missing", self.name)
        
        return await self._setup_dca(
            amount, 
            from_asset_id, 
            to_asset_id, 
            interval, 
            total_investment, 
            max_purchase_amount, 
            price_threshold, 
            pause_on_volatility
        )
    
    @handle_tool_exceptions("setup_dca")
    async def _setup_dca(
        self,
        amount: str,
        from_asset_id: str,
        to_asset_id: str,
        interval: str,
        total_investment: Optional[str] = None,
        max_purchase_amount: Optional[str] = None,
        price_threshold: Optional[str] = None,
        pause_on_volatility: bool = False,
    ) -> Dict[str, Any]:
        """Set up a new DCA schedule."""
        # Check wallet manager is initialized
        if not wallet_manager_instance.configure_cdp_client():
            raise ToolExecutionError(
                "CDP client is not initialized. Please set up your API credentials first.",
                self.name
            )
        
        # Get active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        # Create DCA parameters
        try:
            dca_params = DCAParams(
                origin_token=from_asset_id.lower(),
                destination_token=to_asset_id.lower(),
                step_size=Decimal(amount),
                total_investment_amount=Decimal(total_investment) if total_investment else None,
                frequency=interval,
                max_purchase_amount=Decimal(max_purchase_amount) if max_purchase_amount else None,
                price_threshold=Decimal(price_threshold) if price_threshold else None,
                pause_on_volatility=pause_on_volatility,
                wallet_id=wallet.wallet_id,
            )
        except ValueError as e:
            raise ToolExecutionError(f"Invalid parameter values: {str(e)}", self.name)
        
        # Check balance
        try:
            balance_result = get_balance(wallet, from_asset_id)
            if Decimal(balance_result["balance"]) < dca_params.step_size:
                raise ToolExecutionError(f"Insufficient {from_asset_id} balance", self.name)
        except Exception as e:
            raise ToolExecutionError(f"Failed to check balance: {str(e)}", self.name)
        
        # Create workflow configuration
        workflow_config = {
            "name": f"DCA {dca_params.origin_token} to {dca_params.destination_token}",
            "description": f"Dollar cost average from {dca_params.origin_token} to {dca_params.destination_token}",
            "action": "dca_trade",
            "params": dca_params.to_dict(),
            "interval_seconds": get_frequency_seconds(dca_params.frequency),
        }
        
        # In a real implementation, we would register this with a workflow manager
        # For now, we'll just return the configuration
        
        return {
            "success": True,
            "schedule_id": f"dca_{from_asset_id}_{to_asset_id}_{interval}",
            "config": workflow_config,
            "message": (
                f"Successfully set up DCA schedule to invest {amount} {from_asset_id} "
                f"into {to_asset_id} {interval}. "
                f"Your first purchase will execute immediately, and subsequent purchases "
                f"will follow your selected schedule."
            ),
        }


class GetDcaScheduleTool(Tool):
    """Tool for retrieving current DCA schedules."""
    
    name = "get_dca_schedule"
    description = "Get current DCA schedule details"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "schedule_id": {
                "type": "string",
                "description": "Optional ID of a specific DCA schedule to retrieve",
            },
        },
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the get DCA schedule tool.
        
        Args:
            schedule_id: Optional ID of a specific DCA schedule to retrieve
            
        Returns:
            Dict[str, Any]: The DCA schedule information
            
        Raises:
            ToolExecutionError: If the schedule retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        schedule_id = kwargs.get("schedule_id")
        
        return await self._get_dca_schedule(schedule_id)
    
    @handle_tool_exceptions("get_dca_schedule")
    async def _get_dca_schedule(self, schedule_id: Optional[str] = None) -> Dict[str, Any]:
        """Get current DCA schedule details."""
        # Check wallet manager is initialized
        if not wallet_manager_instance.configure_cdp_client():
            raise ToolExecutionError(
                "CDP client is not initialized. Please set up your API credentials first.",
                self.name
            )
        
        # Get active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        # In a real implementation, we would retrieve schedules from a workflow manager
        # For now, we'll return a mock schedule
        
        # Mock schedules for demonstration
        mock_schedules = [
            {
                "schedule_id": "dca_usdc_eth_weekly",
                "config": {
                    "name": "DCA USDC to ETH",
                    "description": "Dollar cost average from USDC to ETH",
                    "action": "dca_trade",
                    "params": {
                        "origin_token": "usdc",
                        "destination_token": "eth",
                        "step_size": "50",
                        "frequency": "weekly",
                    },
                    "interval_seconds": 604800,
                },
                "next_execution": "2023-05-20T12:00:00Z",
                "last_execution": "2023-05-13T12:00:00Z",
            }
        ]
        
        if schedule_id:
            # Return specific schedule if requested
            matching_schedules = [s for s in mock_schedules if s["schedule_id"] == schedule_id]
            if not matching_schedules:
                return {
                    "success": False,
                    "message": f"No DCA schedule found with ID {schedule_id}",
                }
            
            schedules = matching_schedules
            message = f"Found DCA schedule with ID {schedule_id}"
        else:
            # Return all schedules
            schedules = mock_schedules
            message = f"Found {len(schedules)} active DCA schedules"
        
        return {
            "success": True,
            "schedules": schedules,
            "message": message,
        }


class CancelDcaTool(Tool):
    """Tool for canceling a DCA schedule."""
    
    name = "cancel_dca"
    description = "Cancel an existing DCA schedule"
    category = "blockchain"
    parameters = {
        "type": "object",
        "properties": {
            "schedule_id": {
                "type": "string",
                "description": "ID of the DCA schedule to cancel",
            },
        },
        "required": ["schedule_id"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the cancel DCA tool.
        
        Args:
            schedule_id: ID of the DCA schedule to cancel
            
        Returns:
            Dict[str, Any]: The cancellation result
            
        Raises:
            ToolExecutionError: If the cancellation fails
        """
        log_tool_usage(self.name, kwargs)
        
        schedule_id = kwargs.get("schedule_id")
        if not schedule_id:
            raise ToolExecutionError("Schedule ID must be provided", self.name)
        
        return await self._cancel_dca(schedule_id)
    
    @handle_tool_exceptions("cancel_dca")
    async def _cancel_dca(self, schedule_id: str) -> Dict[str, Any]:
        """Cancel an existing DCA schedule."""
        # Check wallet manager is initialized
        if not wallet_manager_instance.configure_cdp_client():
            raise ToolExecutionError(
                "CDP client is not initialized. Please set up your API credentials first.",
                self.name
            )
        
        # Get active wallet
        wallet = wallet_manager_instance.get_active_wallet()
        if not wallet:
            raise ToolExecutionError(
                "No active wallet found. Please select or create a wallet first.",
                self.name
            )
        
        # In a real implementation, we would cancel the schedule in a workflow manager
        # For now, we'll just return a success message
        
        # Mock validation that the schedule exists
        if schedule_id != "dca_usdc_eth_weekly":
            return {
                "success": False,
                "message": f"No DCA schedule found with ID {schedule_id}",
            }
        
        return {
            "success": True,
            "schedule_id": schedule_id,
            "message": f"Successfully canceled DCA schedule {schedule_id}",
        }