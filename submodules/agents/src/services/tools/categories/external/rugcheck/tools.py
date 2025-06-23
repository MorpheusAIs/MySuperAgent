"""
Tools for accessing Rugcheck API.
"""

import logging
from typing import Any, Dict, Optional

from services.agents.rugcheck.config import Config, TokenRegistry
from services.tools.categories.external.rugcheck.client import RugcheckClient
from services.tools.categories.external.rugcheck.models import (
    TokenReport,
    TokenReportResponse,
    TokenRisk,
    ViewedToken,
    ViewedTokensResponse,
    VotedToken,
    VotedTokensResponse,
)
from services.tools.categories.external.rugcheck.tool_types import RugcheckToolType
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage

logger = logging.getLogger(__name__)


class FetchTokenReportTool(Tool):
    """Tool for fetching token risk report from Rugcheck API."""
    
    name = RugcheckToolType.GET_TOKEN_REPORT.value
    description = "Fetch a token risk report from Rugcheck API to assess safety and reliability"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {
            "identifier": {
                "type": "string",
                "description": "The token identifier (mint address or token name)",
            },
        },
        "required": ["identifier"],
    }
    
    def __init__(self):
        self.token_registry = TokenRegistry()
        self.api_base_url = Config.RUGCHECK_API_URL
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the fetch token report tool.
        
        Args:
            identifier: The token identifier (mint address or token name)
            
        Returns:
            Dict[str, Any]: The token risk report
            
        Raises:
            ToolExecutionError: If the report fetch fails
        """
        log_tool_usage(self.name, kwargs)
        
        identifier = kwargs.get("identifier")
        
        if not identifier:
            raise ToolExecutionError("Token identifier must be provided", self.name)
        
        # Resolve the identifier to a mint address
        mint_address = await self._resolve_token_identifier(identifier)
        if not mint_address:
            raise ToolExecutionError(f"Could not resolve token identifier: {identifier}", self.name)
        
        return await self._fetch_token_report(mint_address)
    
    async def _resolve_token_identifier(self, identifier: str) -> Optional[str]:
        """Resolve a token identifier to a mint address."""
        # If it's already a mint address, return it directly
        if self.token_registry.is_valid_mint_address(identifier):
            return identifier

        # Try to resolve token name to mint address
        mint_address = self.token_registry.get_mint_by_name(identifier)
        if mint_address:
            return mint_address

        return None
    
    @handle_tool_exceptions("fetch_token_report")
    async def _fetch_token_report(self, mint_address: str) -> Dict[str, Any]:
        """Fetch token report from Rugcheck API."""
        client = RugcheckClient(self.api_base_url)
        try:
            report_data = await client.get_token_report(mint_address)
            
            # Convert to TokenReportResponse
            response = TokenReportResponse(
                report=TokenReport(
                    score=report_data.get("score"),
                    risks=[TokenRisk(**risk) for risk in report_data.get("risks", [])],
                ),
                mint_address=mint_address,
                token_name=report_data.get("token_name", ""),
                identifier=mint_address,
            )
            
            # Generate a readable message
            message = f"Token risk analysis for {response.token_name or 'Unknown'}"
            if response.report and response.report.score is not None:
                message += f" (Risk Score: {response.report.score:.2f})"
            
            return {
                "report": response.dict(),
                "formatted_response": response.formatted_response,
                "message": message
            }
        finally:
            await client.close()


class FetchMostViewedTokensTool(Tool):
    """Tool for fetching most viewed tokens from Rugcheck API."""
    
    name = RugcheckToolType.GET_MOST_VIEWED.value
    description = "Fetch the most viewed tokens from Rugcheck API in the last 24 hours"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {},
        "required": [],
    }
    
    def __init__(self):
        self.api_base_url = Config.RUGCHECK_API_URL
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the fetch most viewed tokens tool.
        
        Returns:
            Dict[str, Any]: The most viewed tokens
            
        Raises:
            ToolExecutionError: If the fetch fails
        """
        log_tool_usage(self.name, kwargs)
        return await self._fetch_most_viewed()
    
    @handle_tool_exceptions("fetch_most_viewed_tokens")
    async def _fetch_most_viewed(self) -> Dict[str, Any]:
        """Fetch most viewed tokens from Rugcheck API."""
        client = RugcheckClient(self.api_base_url)
        try:
            viewed_data = await client.get_most_viewed()
            
            # Convert to ViewedTokensResponse
            response = ViewedTokensResponse(
                tokens=[ViewedToken(**token) for token in viewed_data]
            )
            
            return {
                "viewed_tokens": response.dict(),
                "formatted_response": response.formatted_response,
                "message": "Retrieved most viewed tokens in the last 24 hours"
            }
        finally:
            await client.close()


class FetchMostVotedTokensTool(Tool):
    """Tool for fetching most voted tokens from Rugcheck API."""
    
    name = RugcheckToolType.GET_MOST_VOTED.value
    description = "Fetch the most voted tokens from Rugcheck API in the last 24 hours"
    category = "external"
    parameters = {
        "type": "object",
        "properties": {},
        "required": [],
    }
    
    def __init__(self):
        self.api_base_url = Config.RUGCHECK_API_URL
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the fetch most voted tokens tool.
        
        Returns:
            Dict[str, Any]: The most voted tokens
            
        Raises:
            ToolExecutionError: If the fetch fails
        """
        log_tool_usage(self.name, kwargs)
        return await self._fetch_most_voted()
    
    @handle_tool_exceptions("fetch_most_voted_tokens")
    async def _fetch_most_voted(self) -> Dict[str, Any]:
        """Fetch most voted tokens from Rugcheck API."""
        client = RugcheckClient(self.api_base_url)
        try:
            voted_data = await client.get_most_voted()
            
            # Convert to VotedTokensResponse
            response = VotedTokensResponse(
                tokens=[VotedToken(**token) for token in voted_data]
            )
            
            return {
                "voted_tokens": response.dict(),
                "formatted_response": response.formatted_response,
                "message": "Retrieved most voted tokens in the last 24 hours"
            }
        finally:
            await client.close()