from typing import List, Optional

from pydantic import BaseModel


class TokenMetadata(BaseModel):
    """Model for token metadata."""

    address: str
    createdAt: int
    decimals: int
    id: str
    imageBannerUrl: Optional[str]
    imageLargeUrl: Optional[str]
    imageSmallUrl: Optional[str]
    imageThumbUrl: Optional[str]
    isScam: Optional[bool]
    lastTransaction: int
    liquidity: str
    marketCap: Optional[str]
    name: str
    networkId: int
    price: float
    priceChange: float
    priceChange1: Optional[float]
    priceChange4: Optional[float]
    priceChange12: Optional[float]
    priceChange24: Optional[float]
    quoteToken: Optional[str]
    resolution: str
    symbol: str
    topPairId: str
    txnCount1: Optional[int]
    txnCount4: Optional[int]
    txnCount12: Optional[int]
    txnCount24: Optional[int]
    uniqueBuys1: Optional[int]
    uniqueBuys4: Optional[int]
    uniqueBuys12: Optional[int]
    uniqueBuys24: Optional[int]
    uniqueSells1: Optional[int]
    uniqueSells4: Optional[int]
    uniqueSells12: Optional[int]
    uniqueSells24: Optional[int]
    volume: str

    @property
    def formatted_response(self) -> str:
        """Format token metadata for response."""
        return (
            f"Token {self.symbol} ({self.name}):\n"
            f"Price: ${self.price:,.6f}\n"
            f"Market Cap: {self.marketCap or 'N/A'}\n"
            f"Liquidity: {self.liquidity}\n"
            f"Volume: {self.volume}\n"
            f"24h Change: {self.priceChange24 or 0:+.2f}%\n"
            f"24h Transactions: {self.txnCount24 or 0}\n"
            f"Contract: {self.address}"
        )


class TopTokensResponse(BaseModel):
    """Model for top tokens response."""

    success: bool
    data: List[TokenMetadata]

    @property
    def formatted_response(self) -> str:
        """Format top tokens response for display."""
        if not self.success:
            return "Failed to get top tokens."
        if not self.data:
            return "No top tokens found."

        formatted = "# Top 5 Tokens\n\n"
        for token in self.data[:10]:
            formatted += f"{token.formatted_response}\n\n---\n\n"
        return formatted


class TokenPair(BaseModel):
    """Model for token pair information."""

    token0: str
    token1: str


class Exchange(BaseModel):
    """Model for exchange information."""

    name: str


class TokenDetails(BaseModel):
    """Model for detailed token information."""

    address: str
    decimals: int
    id: str
    name: str
    networkId: int
    symbol: str


class TokenFilterResult(BaseModel):
    """Model for token information from filter tokens endpoint."""

    buyCount1: Optional[int] = None
    high1: Optional[str] = None
    txnCount1: Optional[int] = None
    uniqueTransactions1: Optional[int] = None
    volume1: Optional[str] = None
    liquidity: Optional[str] = None
    marketCap: Optional[str] = None
    priceUSD: Optional[str] = None
    pair: Optional[TokenPair] = None
    exchanges: Optional[List[Exchange]] = None
    token: Optional[TokenDetails] = None


class TopHoldersResponse(BaseModel):
    """Model for top holders response."""

    success: bool
    data: float  # Percentage owned by top 10 holders
    token_info: Optional[TokenFilterResult] = None

    @property
    def formatted_response(self) -> str:
        """Format top holders response for display."""
        if not self.success:
            return "Failed to get top holders data."

        risk = "High Risk" if self.data > 80 else "Medium Risk" if self.data > 50 else "Low Risk"

        response = f"Top 10 holders own {self.data:.2f}% of supply. {risk}\n\n"

        if self.token_info and self.token_info.token:
            response += "Token Info:\n"
            response += f"Name: {self.token_info.token.name} ({self.token_info.token.symbol})\n"

            if self.token_info.priceUSD:
                response += f"Price: ${float(self.token_info.priceUSD):,.6f}\n"
            if self.token_info.marketCap:
                response += f"Market Cap: ${float(self.token_info.marketCap):,.2f}\n"
            if self.token_info.liquidity:
                response += f"Liquidity: ${float(self.token_info.liquidity):,.2f}\n"
            if self.token_info.volume1:
                response += f"24h Volume: ${float(self.token_info.volume1):,.2f}\n"
            if self.token_info.txnCount1:
                response += f"24h Transactions: {self.token_info.txnCount1:,}\n"
            if self.token_info.uniqueTransactions1:
                response += f"Unique Transactions: {self.token_info.uniqueTransactions1:,}\n"
            if self.token_info.exchanges:
                exchange_names = [ex.name for ex in self.token_info.exchanges]
                response += f"Available on: {', '.join(exchange_names)}\n"
            if self.token_info.pair:
                response += f"Trading Pair: {self.token_info.pair.token0}/{self.token_info.pair.token1}\n"

        return response


class NftSearchItem(BaseModel):
    """Model for NFT search item."""

    address: str
    average: str
    ceiling: str
    floor: str
    id: str
    imageUrl: Optional[str]
    name: Optional[str]
    networkId: int
    symbol: Optional[str]
    tradeCount: str
    tradeCountChange: float
    volume: str
    volumeChange: float
    window: str

    @property
    def formatted_response(self) -> str:
        """Format NFT search item for display."""
        return (
            f"# {self.name or 'Unnamed'} ({self.symbol or 'No Symbol'})\n"
            f"Floor Price: {self.floor}\n"
            f"Volume: {self.volume} ({self.volumeChange:+.2f}%)\n"
            f"Trade Count: {self.tradeCount}\n"
            f"Contract: {self.address}"
        )


class NftSearchResponse(BaseModel):
    """Model for NFT search response."""

    success: bool
    hasMore: int
    items: List[NftSearchItem]

    @property
    def formatted_response(self) -> str:
        """Format NFT search response for display."""
        if not self.success:
            return "Failed to search NFT collections."
        if not self.items:
            return "No NFT collections found."

        formatted = "# Top 5 NFT Collections\n\n"
        for item in self.items[:10]:
            formatted += f"{item.formatted_response}\n\n---\n\n"
        return formatted