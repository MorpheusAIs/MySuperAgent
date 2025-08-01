"""
Tools for retrieving cryptocurrency data.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

import requests
from services.agents.crypto_data.config import Config
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


# Helper functions
def get_most_similar(text: str, data: List[str]) -> List[str]:
    """Returns a list of most similar items based on cosine similarity."""
    vectorizer = TfidfVectorizer()
    sentence_vectors = vectorizer.fit_transform(data)
    text_vector = vectorizer.transform([text])
    similarity_scores = cosine_similarity(text_vector, sentence_vectors)
    top_indices = similarity_scores.argsort()[0][-20:]
    top_matches = [data[item] for item in top_indices if similarity_scores[0][item] > 0.5]
    return top_matches


def get_coingecko_id(text: str, type: str = "coin") -> Optional[str]:
    """Get the CoinGecko ID for a given coin or NFT."""
    url = f"{Config.COINGECKO_BASE_URL}/search"
    params = {"query": text}
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        if type == "coin":
            return data["coins"][0]["id"] if data["coins"] else None
        elif type == "nft":
            return data["nfts"][0]["id"] if data.get("nfts") else None
        else:
            raise ValueError("Invalid type specified")
    except requests.exceptions.RequestException as e:
        logging.error(f"API request failed: {str(e)}")
        raise


def get_tradingview_symbol(coingecko_id: Optional[str]) -> Optional[str]:
    """Convert a CoinGecko ID to a TradingView symbol."""
    if not coingecko_id:
        return None
    url = f"{Config.COINGECKO_BASE_URL}/coins/{coingecko_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        symbol = data.get("symbol", "").upper()
        return f"CRYPTO:{symbol}USD" if symbol else None
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to get TradingView symbol: {str(e)}")
        raise


def get_price(coin: str) -> Optional[float]:
    """Get the price of a coin from CoinGecko API."""
    coin_id = get_coingecko_id(coin, type="coin")
    if not coin_id:
        return None
    url = f"{Config.COINGECKO_BASE_URL}/simple/price"
    params = {"ids": coin_id, "vs_currencies": "USD"}
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()[coin_id]["usd"]
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve price: {str(e)}")
        raise


def get_floor_price(nft: str) -> Optional[float]:
    """Get the floor price of an NFT from CoinGecko API."""
    nft_id = get_coingecko_id(str(nft), type="nft")
    if not nft_id:
        return None
    url = f"{Config.COINGECKO_BASE_URL}/nfts/{nft_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()["floor_price"]["usd"]
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve floor price: {str(e)}")
        raise


def get_fdv(coin: str) -> Optional[float]:
    """Get the fully diluted valuation of a coin from CoinGecko API."""
    coin_id = get_coingecko_id(coin, type="coin")
    if not coin_id:
        return None
    url = f"{Config.COINGECKO_BASE_URL}/coins/{coin_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data.get("market_data", {}).get("fully_diluted_valuation", {}).get("usd")
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve FDV: {str(e)}")
        raise


def get_market_cap(coin: str) -> Optional[float]:
    """Get the market cap of a coin from CoinGecko API."""
    coin_id = get_coingecko_id(coin, type="coin")
    if not coin_id:
        return None
    url = f"{Config.COINGECKO_BASE_URL}/coins/markets"
    params = {"ids": coin_id, "vs_currency": "USD"}
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()[0]["market_cap"]
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve market cap: {str(e)}")
        raise


def get_protocols_list() -> Tuple[List[str], List[str], List[str]]:
    """Get the list of protocols from DefiLlama API."""
    url = f"{Config.DEFILLAMA_BASE_URL}/protocols"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return (
            [item["slug"] for item in data],
            [item["name"] for item in data],
            [item["gecko_id"] for item in data],
        )
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve protocols list: {str(e)}")
        raise


def get_tvl_value(protocol_id: str) -> Dict[str, Any]:
    """Gets the TVL value using the protocol ID from DefiLlama API."""
    url = f"{Config.DEFILLAMA_BASE_URL}/tvl/{protocol_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve protocol TVL: {str(e)}")
        raise


def get_protocol_tvl(protocol_name: str) -> Optional[Dict[str, Any]]:
    """Get the TVL (Total Value Locked) of a protocol from DefiLlama API."""
    id, name, gecko = get_protocols_list()
    tag = get_coingecko_id(protocol_name)
    if tag:
        protocol_id = next((i for i, j in zip(id, gecko) if j == tag), None)
        if protocol_id:
            return {tag: get_tvl_value(protocol_id)}
    if not tag or not protocol_id:
        res = get_most_similar(protocol_name, name)
        if not res:
            return None
        else:
            result: List[Dict[str, Any]] = []
            for item in res:
                protocol_id = next((i for i, j in zip(id, name) if j == item), None)
                if protocol_id:
                    tvl = get_tvl_value(protocol_id)
                    result.append({protocol_id: tvl})
            if not result:
                return None
            max_key = max(result, key=lambda dct: float(dct[list(dct.keys())[0]]["tvl"]))
            return max_key
    return None


# Tool classes
class CoinPriceTool(Tool):
    """Tool for retrieving cryptocurrency prices."""
    
    name = "get_coin_price"
    description = "Get the price of a cryptocurrency"
    category = "data"
    parameters = {
        "type": "object",
        "properties": {
            "coin_name": {
                "type": "string",
                "description": "The name of the coin.",
            }
        },
        "required": ["coin_name"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the coin price tool.
        
        Args:
            coin_name: The name of the cryptocurrency
            
        Returns:
            Dict[str, Any]: The price information
            
        Raises:
            ToolExecutionError: If the price retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        coin_name = kwargs.get("coin_name")
        if not coin_name:
            raise ToolExecutionError("Coin name must be provided", self.name)
        
        return await self._get_coin_price(coin_name)
    
    @handle_tool_exceptions("get_coin_price")
    async def _get_coin_price(self, coin_name: str) -> Dict[str, Any]:
        """Get the price of a cryptocurrency."""
        try:
            price = get_price(coin_name)
            if price is None:
                return {
                    "success": False,
                    "message": Config.PRICE_FAILURE_MESSAGE,
                }
            
            # Get trading symbol for charts if available
            coin_id = get_coingecko_id(coin_name)
            trading_symbol = get_tradingview_symbol(coin_id) if coin_id else None
            
            return {
                "success": True,
                "coin_name": coin_name,
                "price": price,
                "coinId": trading_symbol if trading_symbol else None,
                "message": Config.PRICE_SUCCESS_MESSAGE.format(coin_name=coin_name, price=price),
            }
        except requests.exceptions.RequestException:
            return {
                "success": False,
                "message": Config.API_ERROR_MESSAGE,
            }


class NftFloorPriceTool(Tool):
    """Tool for retrieving NFT floor prices."""
    
    name = "get_nft_floor_price"
    description = "Get the floor price of an NFT"
    category = "data"
    parameters = {
        "type": "object",
        "properties": {
            "nft_name": {
                "type": "string",
                "description": "Name of the NFT",
            }
        },
        "required": ["nft_name"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the NFT floor price tool.
        
        Args:
            nft_name: The name of the NFT collection
            
        Returns:
            Dict[str, Any]: The floor price information
            
        Raises:
            ToolExecutionError: If the floor price retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        nft_name = kwargs.get("nft_name")
        if not nft_name:
            raise ToolExecutionError("NFT name must be provided", self.name)
        
        return await self._get_nft_floor_price(nft_name)
    
    @handle_tool_exceptions("get_nft_floor_price")
    async def _get_nft_floor_price(self, nft_name: str) -> Dict[str, Any]:
        """Get the floor price of an NFT."""
        try:
            floor_price = get_floor_price(nft_name)
            if floor_price is None:
                return {
                    "success": False,
                    "message": Config.FLOOR_PRICE_FAILURE_MESSAGE,
                }
            
            return {
                "success": True,
                "nft_name": nft_name,
                "floor_price": floor_price,
                "message": Config.FLOOR_PRICE_SUCCESS_MESSAGE.format(nft_name=nft_name, floor_price=floor_price),
            }
        except requests.exceptions.RequestException:
            return {
                "success": False,
                "message": Config.API_ERROR_MESSAGE,
            }


class ProtocolTvlTool(Tool):
    """Tool for retrieving protocol Total Value Locked (TVL)."""
    
    name = "get_protocol_tvl"
    description = "Get the TVL (Total Value Locked) of a protocol."
    category = "data"
    parameters = {
        "type": "object",
        "properties": {
            "protocol_name": {
                "type": "string",
                "description": "Name of the protocol",
            }
        },
        "required": ["protocol_name"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the protocol TVL tool.
        
        Args:
            protocol_name: The name of the protocol
            
        Returns:
            Dict[str, Any]: The TVL information
            
        Raises:
            ToolExecutionError: If the TVL retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        protocol_name = kwargs.get("protocol_name")
        if not protocol_name:
            raise ToolExecutionError("Protocol name must be provided", self.name)
        
        return await self._get_protocol_tvl(protocol_name)
    
    @handle_tool_exceptions("get_protocol_tvl")
    async def _get_protocol_tvl(self, protocol_name: str) -> Dict[str, Any]:
        """Get the TVL (Total Value Locked) of a protocol."""
        try:
            tvl = get_protocol_tvl(protocol_name)
            if tvl is None:
                return {
                    "success": False,
                    "message": Config.TVL_FAILURE_MESSAGE,
                }
            
            _, tvl_value = list(tvl.items())[0][0], list(tvl.items())[0][1]
            
            return {
                "success": True,
                "protocol_name": protocol_name,
                "tvl": tvl_value,
                "message": Config.TVL_SUCCESS_MESSAGE.format(protocol_name=protocol_name, tvl=tvl_value),
            }
        except requests.exceptions.RequestException:
            return {
                "success": False,
                "message": Config.API_ERROR_MESSAGE,
            }


class CoinFdvTool(Tool):
    """Tool for retrieving cryptocurrency fully diluted valuation (FDV)."""
    
    name = "get_fully_diluted_valuation"
    description = "Get the fdv or fully diluted valuation of a coin"
    category = "data"
    parameters = {
        "type": "object",
        "properties": {
            "coin_name": {
                "type": "string",
                "description": "Name of the coin",
            }
        },
        "required": ["coin_name"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the fully diluted valuation tool.
        
        Args:
            coin_name: The name of the cryptocurrency
            
        Returns:
            Dict[str, Any]: The FDV information
            
        Raises:
            ToolExecutionError: If the FDV retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        coin_name = kwargs.get("coin_name")
        if not coin_name:
            raise ToolExecutionError("Coin name must be provided", self.name)
        
        return await self._get_fully_diluted_valuation(coin_name)
    
    @handle_tool_exceptions("get_fully_diluted_valuation")
    async def _get_fully_diluted_valuation(self, coin_name: str) -> Dict[str, Any]:
        """Get the fully diluted valuation of a coin."""
        try:
            fdv = get_fdv(coin_name)
            if fdv is None:
                return {
                    "success": False,
                    "message": Config.FDV_FAILURE_MESSAGE,
                }
            
            return {
                "success": True,
                "coin_name": coin_name,
                "fdv": fdv,
                "message": Config.FDV_SUCCESS_MESSAGE.format(coin_name=coin_name, fdv=fdv),
            }
        except requests.exceptions.RequestException:
            return {
                "success": False,
                "message": Config.API_ERROR_MESSAGE,
            }


class CoinMarketCapTool(Tool):
    """Tool for retrieving cryptocurrency market cap."""
    
    name = "get_market_cap"
    description = "Get the mc or market cap of a coin"
    category = "data"
    parameters = {
        "type": "object",
        "properties": {
            "coin_name": {
                "type": "string",
                "description": "Name of the coin",
            }
        },
        "required": ["coin_name"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the market cap tool.
        
        Args:
            coin_name: The name of the cryptocurrency
            
        Returns:
            Dict[str, Any]: The market cap information
            
        Raises:
            ToolExecutionError: If the market cap retrieval fails
        """
        log_tool_usage(self.name, kwargs)
        
        coin_name = kwargs.get("coin_name")
        if not coin_name:
            raise ToolExecutionError("Coin name must be provided", self.name)
        
        return await self._get_market_cap(coin_name)
    
    @handle_tool_exceptions("get_market_cap")
    async def _get_market_cap(self, coin_name: str) -> Dict[str, Any]:
        """Get the market cap of a coin."""
        try:
            market_cap = get_market_cap(coin_name)
            if market_cap is None:
                return {
                    "success": False,
                    "message": Config.MARKET_CAP_FAILURE_MESSAGE,
                }
            
            return {
                "success": True,
                "coin_name": coin_name,
                "market_cap": market_cap,
                "message": Config.MARKET_CAP_SUCCESS_MESSAGE.format(coin_name=coin_name, market_cap=market_cap),
            }
        except requests.exceptions.RequestException:
            return {
                "success": False,
                "message": Config.API_ERROR_MESSAGE,
            }