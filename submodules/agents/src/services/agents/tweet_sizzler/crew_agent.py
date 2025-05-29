import logging

from crewai import Agent
from crewai.tools import tool
from services.agents.tweet_sizzler import tools

logger = logging.getLogger(__name__)


# Create the tool using the tool decorator
@tool("Generate Tweet")
def generate_tweet_tool(content: str) -> str:
    """
    Generate an engaging tweet based on provided content.

    Args:
        content (str): Content to base the tweet on

    Returns:
        str: The generated tweet text (under 280 characters)
    """
    # Using asyncio.run() here as the original function is async
    import asyncio

    return asyncio.run(tools.generate_tweet(content))


# Create the agent directly
tweet_sizzler_agent = Agent(
    role="Social Media Content Creator",
    goal="Create engaging social media content optimized for impact and virality",
    backstory=(
        "You are a witty and engaging social media specialist with a talent for crafting "
        "attention-grabbing tweets. You understand how to convey complex ideas concisely "
        "and use language that resonates with social media audiences. Your tweets are known "
        "for being memorable, shareable, and effective at driving engagement."
    ),
    verbose=True,
    tools=[generate_tweet_tool],
    allow_delegation=False,
)
