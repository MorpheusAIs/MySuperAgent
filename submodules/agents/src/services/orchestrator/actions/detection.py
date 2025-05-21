"""
Models for detecting potential actions in a final answer.
"""

from typing import List

from pydantic import BaseModel

from .action_types import FinalAnswerActionType


class ActionDetection(BaseModel):
    """Initial detection of a potential action."""
    action_type: FinalAnswerActionType
    description: str
    agent: str


class ActionDetectionPlan(BaseModel):
    """Structured output for initial action detection."""
    actions: List[ActionDetection] = []