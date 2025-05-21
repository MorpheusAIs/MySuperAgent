"""
Request models for extracting metadata from final answers.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class TweetActionRequest(BaseModel):
    """Metadata for a tweet action request."""
    content: str
    hashtags: Optional[List[str]] = None
    image_url: Optional[str] = None


class SwapActionRequest(BaseModel):
    """Metadata for a token swap action request."""
    from_token: str
    to_token: str
    amount: str
    slippage: Optional[float] = None


class TransferActionRequest(BaseModel):
    """Metadata for a token transfer action request."""
    token: str
    to_address: str
    amount: str


class ImageGenerationActionRequest(BaseModel):
    """Metadata for an image generation action request."""
    prompt: str
    negative_prompt: Optional[str] = None
    style: Optional[str] = None


class AnalysisParameters(BaseModel):
    """Parameters for an analysis action."""
    time_range: Optional[str] = None
    include_tokens: Optional[bool] = None
    include_nfts: Optional[bool] = None
    limit: Optional[int] = None
    sort_by: Optional[str] = None
    order: Optional[str] = None
    filter: Optional[str] = None


class AnalysisActionRequest(BaseModel):
    """Metadata for an analysis action request."""
    type: str
    subject: str
    parameters: Optional[AnalysisParameters] = None