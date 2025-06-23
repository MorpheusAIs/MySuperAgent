import logging
from typing import Any, Optional

import aiohttp

logger = logging.getLogger(__name__)


class RugcheckClient:
    """Client for interacting with the Rugcheck API."""

    def __init__(self, base_url: str = "https://api.rugcheck.xyz/v1"):
        self.base_url = base_url
        self._session: Optional[aiohttp.ClientSession] = None

    async def close(self) -> None:
        """Close the aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()

    async def _make_request(self, method: str, endpoint: str, **kwargs: Any) -> Any:
        """Make HTTP request to Rugcheck API."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()

        url = f"{self.base_url}{endpoint}"

        try:
            async with self._session.request(method, url, **kwargs) as response:
                response.raise_for_status()
                return await response.json()

        except aiohttp.ClientError as e:
            logger.error(f"HTTP error for {url}: {str(e)}")
            raise Exception(f"Failed to fetch data from Rugcheck API: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error for {url}: {str(e)}")
            raise

    async def get_token_report(self, mint: str) -> Any:
        """Get detailed report for a token mint."""
        endpoint = f"/tokens/{mint}/report/summary"
        return await self._make_request("GET", endpoint)

    async def get_most_viewed(self) -> Any:
        """Get most viewed tokens in past 24 hours."""
        endpoint = "/stats/recent"
        return await self._make_request("GET", endpoint)

    async def get_most_voted(self) -> Any:
        """Get most voted tokens in past 24 hours."""
        endpoint = "/stats/trending"
        return await self._make_request("GET", endpoint)