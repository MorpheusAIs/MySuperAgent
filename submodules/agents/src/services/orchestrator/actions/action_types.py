"""
This module defines the types of actions that can be taken as a final answer.
"""

from enum import Enum


class FinalAnswerActionType(str, Enum):
    """Types of actions that can be executed from a final answer."""
    TWEET = "tweet"
    SWAP = "swap"
    TRANSFER = "transfer"
    IMAGE_GENERATION = "image_generation"
    ANALYSIS = "analysis"


# List of supported final answer actions that the orchestrator can handle
SUPPORTED_FINAL_ANSWER_ACTIONS = [
    {
        "type": FinalAnswerActionType.TWEET,
        "name": "Tweet",
        "description": "Create and share a tweet",
        "agent": "tweet_sizzler",
    },
    {
        "type": FinalAnswerActionType.SWAP,
        "name": "Token Swap",
        "description": "Swap one token for another",
        "agent": "token_swap",
    },
    {
        "type": FinalAnswerActionType.TRANSFER,
        "name": "Token Transfer",
        "description": "Transfer tokens to an address",
        "agent": "token_swap",
    },
    {
        "type": FinalAnswerActionType.IMAGE_GENERATION,
        "name": "Generate Image",
        "description": "Generate an image based on a prompt",
        "agent": "imagen",
    },
    {
        "type": FinalAnswerActionType.ANALYSIS,
        "name": "Analysis",
        "description": "Analyze tokens, wallets, or trades",
        "agent": "codex",
    },
]