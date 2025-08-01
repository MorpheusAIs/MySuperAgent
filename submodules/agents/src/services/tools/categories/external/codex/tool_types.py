from enum import Enum


class CodexToolType(Enum):
    """Enum for different Codex API tool types"""

    LIST_TOP_TOKENS = "list_top_tokens"
    GET_TOP_HOLDERS_PERCENT = "get_top_holders_percent"
    SEARCH_NFTS = "search_nfts"