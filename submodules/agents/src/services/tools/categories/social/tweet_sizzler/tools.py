"""
Tools for Tweet Sizzler.
"""

import logging
import warnings
from typing import Any, Dict

import tweepy
from config import LLM_AGENT
from langchain.schema import HumanMessage
from services.agents.tweet_sizzler.config import Config
from services.tools.categories.social.tweet_sizzler.tool_types import TweetSizzlerToolType
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage

# Suppress Tweepy warnings before it is imported. Until maintainers fix the issue.
warnings.filterwarnings(
    "ignore",
    message="invalid escape sequence.*",
    category=SyntaxWarning,
    module="tweepy",
)

logger = logging.getLogger(__name__)


class GenerateTweetTool(Tool):
    """Tool for generating tweets."""
    
    name = TweetSizzlerToolType.GENERATE_TWEET.value
    description = "Generate a tweet based on the provided content or topic"
    category = "social"
    parameters = {
        "type": "object",
        "properties": {
            "content": {
                "type": "string",
                "description": "The content or topic to generate a tweet about",
            },
        },
        "required": ["content"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the generate tweet tool.
        
        Args:
            content: The content or topic to generate a tweet about
            
        Returns:
            Dict[str, Any]: The generated tweet
            
        Raises:
            ToolExecutionError: If the tweet generation fails
        """
        log_tool_usage(self.name, kwargs)
        
        content = kwargs.get("content")
        
        if not content:
            raise ToolExecutionError("Content must be provided", self.name)
        
        return await self._generate_tweet(content)
    
    @handle_tool_exceptions("generate_tweet")
    async def _generate_tweet(self, content: str) -> Dict[str, Any]:
        """Generate a tweet based on the provided content."""
        try:
            result = LLM_AGENT.invoke(
                [
                    Config.system_message,
                    HumanMessage(content=f"Generate a tweet for: {content}"),
                ]
            )

            tweet = result.content.strip()
            tweet = " ".join(tweet.split())  # Normalize whitespace

            # Remove any dictionary-like formatting
            if tweet.startswith("{") and tweet.endswith("}"):
                tweet = tweet.strip("{}").split(":", 1)[-1].strip().strip('"')

            logger.info(f"Tweet generated successfully: {tweet}")
            
            return {
                "tweet": tweet,
                "content": content,
                "message": "Generated tweet successfully",
                "length": len(tweet),
                "character_count": len(tweet)
            }

        except Exception as e:
            logger.error(f"Error generating tweet: {str(e)}")
            raise ToolExecutionError(f"Error generating tweet: {str(e)}", self.name)


class PostTweetTool(Tool):
    """Tool for posting tweets."""
    
    name = TweetSizzlerToolType.POST_TWEET.value
    description = "Post a tweet to Twitter/X platform"
    category = "social"
    parameters = {
        "type": "object",
        "properties": {
            "post_content": {
                "type": "string",
                "description": "The content to post as a tweet",
            },
            "api_key": {
                "type": "string",
                "description": "Twitter API key",
            },
            "api_secret": {
                "type": "string",
                "description": "Twitter API secret",
            },
            "access_token": {
                "type": "string",
                "description": "Twitter access token",
            },
            "access_token_secret": {
                "type": "string",
                "description": "Twitter access token secret",
            },
        },
        "required": ["post_content", "api_key", "api_secret", "access_token", "access_token_secret"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the post tweet tool.
        
        Args:
            post_content: The content to post as a tweet
            api_key: Twitter API key
            api_secret: Twitter API secret
            access_token: Twitter access token
            access_token_secret: Twitter access token secret
            
        Returns:
            Dict[str, Any]: The result of posting the tweet
            
        Raises:
            ToolExecutionError: If the tweet posting fails
        """
        log_tool_usage(self.name, kwargs)
        
        post_content = kwargs.get("post_content")
        api_key = kwargs.get("api_key")
        api_secret = kwargs.get("api_secret")
        access_token = kwargs.get("access_token")
        access_token_secret = kwargs.get("access_token_secret")
        
        if not post_content:
            raise ToolExecutionError("Post content must be provided", self.name)
        if not api_key or not api_secret or not access_token or not access_token_secret:
            raise ToolExecutionError("Twitter API credentials must be provided", self.name)
        
        return await self._post_tweet(post_content, api_key, api_secret, access_token, access_token_secret)
    
    @handle_tool_exceptions("post_tweet")
    async def _post_tweet(self, post_content: str, api_key: str, api_secret: str, 
                           access_token: str, access_token_secret: str) -> Dict[str, Any]:
        """Post a tweet to Twitter."""
        try:
            client = tweepy.Client(
                consumer_key=api_key,
                consumer_secret=api_secret,
                access_token=access_token,
                access_token_secret=access_token_secret,
            )

            response = client.create_tweet(text=post_content)
            logger.info(f"Tweet posted successfully: {response}")

            return {
                "status": "success",
                "tweet": response.data["text"],
                "tweet_id": response.data["id"],
                "message": "Tweet posted successfully",
                "url": f"https://twitter.com/user/status/{response.data['id']}"
            }

        except Exception as e:
            logger.error(f"Failed to post tweet: {str(e)}")
            raise ToolExecutionError(f"Failed to post tweet: {str(e)}", self.name)