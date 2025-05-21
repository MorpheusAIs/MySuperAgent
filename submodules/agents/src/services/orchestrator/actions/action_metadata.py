"""
Metadata models for final answer actions.
"""

from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel

from .action_types import FinalAnswerActionType


class FinalAnswerActionBaseMetadata(BaseModel):
    """Base metadata for all final answer actions."""
    agent: str
    action_id: Optional[str] = None
    timestamp: Optional[int] = None


class TweetActionMetadata(FinalAnswerActionBaseMetadata):
    """Metadata for a tweet action."""
    content: str
    hashtags: Optional[List[str]] = None
    image_url: Optional[str] = None


class SwapActionMetadata(FinalAnswerActionBaseMetadata):
    """Metadata for a token swap action."""
    from_token: str
    to_token: str
    amount: str
    slippage: Optional[float] = None


class TransferActionMetadata(FinalAnswerActionBaseMetadata):
    """Metadata for a token transfer action."""
    token: str
    to_address: str
    amount: str


class ImageGenerationActionMetadata(FinalAnswerActionBaseMetadata):
    """Metadata for an image generation action."""
    prompt: str
    negative_prompt: Optional[str] = None
    style: Optional[str] = None


class AnalysisActionMetadata(FinalAnswerActionBaseMetadata):
    """Metadata for an analysis action."""
    type: str
    subject: str
    parameters: Optional[Dict[str, Any]] = None


# Union type for all action metadata types
FinalAnswerActionMetadata = Union[
    TweetActionMetadata,
    SwapActionMetadata,
    TransferActionMetadata,
    ImageGenerationActionMetadata,
    AnalysisActionMetadata,
]


class FinalAnswerAction(BaseModel):
    """Model for a final answer action."""
    action_type: FinalAnswerActionType
    metadata: FinalAnswerActionMetadata
    description: Optional[str] = None