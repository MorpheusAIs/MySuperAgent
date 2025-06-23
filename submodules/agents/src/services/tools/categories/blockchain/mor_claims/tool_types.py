from enum import Enum


class MorClaimsToolType(Enum):
    """Enum for different MOR Claims tool types"""

    GET_CURRENT_USER_REWARD = "get_current_user_reward"
    PREPARE_CLAIM_TRANSACTION = "prepare_claim_transaction"
    GET_CLAIM_STATUS = "get_claim_status"