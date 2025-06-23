from enum import Enum


class MorRewardsToolType(Enum):
    """Enum for different MOR Rewards tool types"""

    GET_CURRENT_USER_REWARD = "get_current_user_reward"
    GET_ALL_POOL_REWARDS = "get_all_pool_rewards"