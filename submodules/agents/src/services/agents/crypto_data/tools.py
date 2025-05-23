import logging
from typing import Any, Dict, List, Optional, Tuple

import requests
from services.agents.crypto_data.config import Config
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


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


def get_coin_price_tool(coin_name: str) -> str:
    """Get the price of a cryptocurrency."""
    try:
        price = get_price(coin_name)
        if price is None:
            return Config.PRICE_FAILURE_MESSAGE
        return Config.PRICE_SUCCESS_MESSAGE.format(coin_name=coin_name, price=price)
    except requests.exceptions.RequestException:
        return Config.API_ERROR_MESSAGE


def get_nft_floor_price_tool(nft_name: str) -> str:
    """Get the floor price of an NFT."""
    try:
        floor_price = get_floor_price(nft_name)
        if floor_price is None:
            return Config.FLOOR_PRICE_FAILURE_MESSAGE
        return Config.FLOOR_PRICE_SUCCESS_MESSAGE.format(nft_name=nft_name, floor_price=floor_price)
    except requests.exceptions.RequestException:
        return Config.API_ERROR_MESSAGE


def get_protocol_total_value_locked_tool(protocol_name: str) -> str:
    """Get the TVL (Total Value Locked) of a protocol."""
    try:
        tvl = get_protocol_tvl(protocol_name)
        if tvl is None:
            return Config.TVL_FAILURE_MESSAGE
        _, tvl_value = list(tvl.items())[0][0], list(tvl.items())[0][1]
        return Config.TVL_SUCCESS_MESSAGE.format(protocol_name=protocol_name, tvl=tvl_value)
    except requests.exceptions.RequestException:
        return Config.API_ERROR_MESSAGE


def get_fully_diluted_valuation_tool(coin_name: str) -> str:
    """Get the fully diluted valuation of a coin."""
    try:
        fdv = get_fdv(coin_name)
        if fdv is None:
            return Config.FDV_FAILURE_MESSAGE
        return Config.FDV_SUCCESS_MESSAGE.format(coin_name=coin_name, fdv=fdv)
    except requests.exceptions.RequestException:
        return Config.API_ERROR_MESSAGE


def get_coin_market_cap_tool(coin_name: str) -> str:
    """Get the market cap of a coin."""
    try:
        market_cap = get_market_cap(coin_name)
        if market_cap is None:
            return Config.MARKET_CAP_FAILURE_MESSAGE
        return Config.MARKET_CAP_SUCCESS_MESSAGE.format(coin_name=coin_name, market_cap=market_cap)
    except requests.exceptions.RequestException:
        return Config.API_ERROR_MESSAGE
