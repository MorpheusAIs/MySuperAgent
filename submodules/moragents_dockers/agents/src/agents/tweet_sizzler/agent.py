import logging
import tweepy
from src.agents.tweet_sizzler.config import Config
from src.models.core import ChatRequest, AgentResponse
from src.agents.agent_core.agent import AgentCore
from langchain.schema import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)


class TweetSizzlerAgent(AgentCore):
    """Agent for generating and posting tweets."""

    def __init__(self, config, llm, embeddings):
        super().__init__(config, llm, embeddings)
        self.last_prompt_content = None

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for tweet generation and posting."""
        try:
            messages = [
                SystemMessage(content=Config.TWEET_GENERATION_PROMPT),
                HumanMessage(content=request.prompt.content),
            ]

            # Extract action from prompt content
            action = "generate"  # Default action
            if isinstance(request.prompt.content, dict):
                action = request.prompt.content.get("action", "generate")
                content = request.prompt.content.get("content", request.prompt.content)
            else:
                content = request.prompt.content

            if action == "generate":
                tweet = self._generate_tweet(content)
                return AgentResponse.success(content=tweet)
            elif action == "post":
                if not hasattr(request.prompt, "metadata") or not request.prompt.metadata:
                    return AgentResponse.error(error_message=Config.ERROR_MISSING_API_CREDENTIALS)

                credentials = request.prompt.metadata.get("credentials")
                if not credentials:
                    return AgentResponse.error(error_message=Config.ERROR_MISSING_API_CREDENTIALS)

                result = await self._post_tweet(credentials, content)
                if "error" in result:
                    return AgentResponse.error(error_message=result["error"])

                return AgentResponse.success(
                    content=f"Tweet posted successfully: {result['tweet']}", metadata={"tweet_id": result["tweet_id"]}
                )
            else:
                return AgentResponse.error(error_message=Config.ERROR_INVALID_ACTION)

        except Exception as e:
            self.logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    def _generate_tweet(self, prompt_content: str) -> str:
        """Generate tweet content based on prompt."""
        if not prompt_content:
            raise ValueError("Tweet generation failed. Please provide a prompt.")

        self.last_prompt_content = prompt_content
        self.logger.info(f"Generating tweet for prompt_content: {prompt_content}")

        result = self.llm.invoke(
            [
                SystemMessage(content=Config.TWEET_GENERATION_PROMPT),
                HumanMessage(content=f"Generate a tweet for: {prompt_content}"),
            ]
        )

        tweet = result.content.strip()
        tweet = " ".join(tweet.split())

        # Remove any dictionary-like formatting
        if tweet.startswith("{") and tweet.endswith("}"):
            tweet = tweet.strip("{}").split(":", 1)[-1].strip().strip('"')

        self.logger.info(f"Tweet generated successfully: {tweet}")
        return tweet

    async def _post_tweet(self, credentials: dict, tweet_content: str) -> dict:
        """Post tweet using provided credentials."""
        required_keys = ["api_key", "api_secret", "access_token", "access_token_secret", "bearer_token"]

        if not all(key in credentials for key in required_keys):
            return {"error": Config.ERROR_MISSING_API_CREDENTIALS}

        try:
            client = tweepy.Client(
                consumer_key=credentials["api_key"],
                consumer_secret=credentials["api_secret"],
                access_token=credentials["access_token"],
                access_token_secret=credentials["access_token_secret"],
                bearer_token=credentials["bearer_token"],
            )

            response = client.create_tweet(text=tweet_content)
            self.logger.info(f"Tweet posted successfully: {response}")

            return {"tweet": response.data["text"], "tweet_id": response.data["id"]}
        except Exception as e:
            self.logger.error(f"Error posting tweet: {str(e)}")
            return {"error": f"Failed to post tweet: {str(e)}"}

    async def _execute_tool(self, func_name: str, args: dict) -> AgentResponse:
        """Not implemented as this agent doesn't use tools."""
        return AgentResponse.error(error_message="This agent does not support tool execution")
