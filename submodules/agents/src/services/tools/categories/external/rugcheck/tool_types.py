from enum import Enum


class RugcheckToolType(Enum):
    """Enum for different Rugcheck tool types"""

    GET_TOKEN_REPORT = "get_token_report"
    GET_MOST_VIEWED = "get_most_viewed"
    GET_MOST_VOTED = "get_most_voted"