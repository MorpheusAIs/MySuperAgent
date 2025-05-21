"""
Handler for extracting and processing final answer actions.
"""

import logging
import time
import uuid
from typing import List, Optional

from crewai import LLM

from ..helpers.retry_utils import retry_with_backoff
from ..helpers.utils import parse_llm_structured_output
from .action_metadata import (
    AnalysisActionMetadata,
    FinalAnswerAction,
    ImageGenerationActionMetadata,
    SwapActionMetadata,
    TransferActionMetadata,
    TweetActionMetadata,
)
from .action_types import FinalAnswerActionType
from .detection import ActionDetection, ActionDetectionPlan
from .request_models import (
    AnalysisActionRequest,
    ImageGenerationActionRequest,
    SwapActionRequest,
    TransferActionRequest,
    TweetActionRequest,
)

logger = logging.getLogger(__name__)


async def extract_final_answer_actions(
    chat_prompt: str, 
    final_answer: str, 
    standard_model: str, 
    efficient_model: str,
    standard_model_api_key: str
) -> List[FinalAnswerAction]:
    """
    Two-step process to analyze the final answer for potential actions:
    1. Initial detection - identify if there are any actions to take
    2. Action-specific extraction - get detailed metadata for each action
    
    Args:
        chat_prompt: The original user request
        final_answer: The synthesized final answer
        standard_model: The full model to use for complex detection
        efficient_model: An efficient model to use for simpler detection
        standard_model_api_key: API key for the standard model
        
    Returns:
        List of final answer actions with their metadata
    """
    # Initialize empty actions list
    final_answer_actions = []

    # Step 1: Initial action detection
    step1_prompt = (
        "Analyze this user request and final answer to identify if any specific actions should be taken. "
        "For example, if the user asked to create a tweet, identify that a tweet action is needed. "
        "Don't extract detailed metadata yet - just identify which actions are needed.\n\n"
        f"User request: {chat_prompt}\n\n"
        f"Final answer: {final_answer}\n\n"
        "Return a list of action objects, each with:\n"
        "- action_type: One of [tweet, swap, transfer, image_generation, analysis]\n"
        "- description: A brief human-readable description of the action\n"
        "- agent: The agent responsible for the action (tweet_sizzler, token_swap, imagen, codex)\n\n"
        "Return an empty list if no actions are needed."
    )

    try:
        # Use efficient model for initial action detection
        initial_detector = LLM(
            model=efficient_model, response_format=ActionDetectionPlan, api_key=standard_model_api_key
        )

        @retry_with_backoff(max_attempts=2, base_delay=1.0, exceptions=(Exception,))
        def detect_actions():
            return initial_detector.call(step1_prompt)

        detection_response = detect_actions()
        action_plan = parse_llm_structured_output(
            detection_response, ActionDetectionPlan, logger, "ActionDetectionPlan"
        )

        # If no actions detected, we're done
        if not action_plan.actions:
            logger.info("No final answer actions detected")
            return []

        # Process each detected action
        timestamp = int(time.time())

        for detected_action in action_plan.actions:
            action_type = detected_action.action_type
            description = detected_action.description
            agent_name = detected_action.agent

            # Step 2: Extract action-specific metadata with the appropriate model
            if action_type == FinalAnswerActionType.TWEET:
                # Extract tweet metadata using TweetActionRequest model
                tweet_prompt = (
                    f"Extract the tweet content from this final answer. The user wants to create a tweet.\n\n"
                    f"User request: {chat_prompt}\n\n"
                    f"Final answer: {final_answer}\n\n"
                    f"Extract:\n"
                    f"- content: The main text content of the tweet (required)\n"
                    f"- hashtags: List of relevant hashtags without the # symbol (optional)\n"
                    f"- image_url: URL of any image to include (optional)\n"
                )

                tweet_extractor = LLM(
                    model=efficient_model,
                    response_format=TweetActionRequest,
                    api_key=standard_model_api_key,
                )
                tweet_response = tweet_extractor.call(tweet_prompt)
                tweet_data = parse_llm_structured_output(
                    tweet_response, TweetActionRequest, logger, "TweetActionRequest"
                )

                # Create metadata and action
                metadata = TweetActionMetadata(
                    agent="tweet_sizzler",
                    action_id=str(uuid.uuid4()),
                    timestamp=timestamp,
                    content=tweet_data.content,
                    hashtags=tweet_data.hashtags,
                    image_url=tweet_data.image_url,
                )

                final_action = FinalAnswerAction(
                    action_type=FinalAnswerActionType.TWEET, metadata=metadata, description=description
                )

                final_answer_actions.append(final_action)

            elif action_type == FinalAnswerActionType.SWAP:
                # Extract swap metadata
                swap_prompt = (
                    f"Extract token swap details from this final answer. The user wants to swap tokens.\n\n"
                    f"User request: {chat_prompt}\n\n"
                    f"Final answer: {final_answer}\n\n"
                    f"Extract:\n"
                    f"- from_token: Token to swap from (required)\n"
                    f"- to_token: Token to swap to (required)\n"
                    f"- amount: Amount to swap (required)\n"
                    f"- slippage: Slippage tolerance percentage (optional)\n"
                )

                swap_extractor = LLM(
                    model=efficient_model,
                    response_format=SwapActionRequest,
                    api_key=standard_model_api_key,
                )
                swap_response = swap_extractor.call(swap_prompt)
                swap_data = parse_llm_structured_output(
                    swap_response, SwapActionRequest, logger, "SwapActionRequest"
                )

                metadata = SwapActionMetadata(
                    agent="token_swap",
                    action_id=str(uuid.uuid4()),
                    timestamp=timestamp,
                    from_token=swap_data.from_token,
                    to_token=swap_data.to_token,
                    amount=swap_data.amount,
                    slippage=swap_data.slippage,
                )

                final_action = FinalAnswerAction(
                    action_type=FinalAnswerActionType.SWAP, metadata=metadata, description=description
                )

                final_answer_actions.append(final_action)

            elif action_type == FinalAnswerActionType.TRANSFER:
                # Extract transfer metadata
                transfer_prompt = (
                    f"Extract token transfer details from this final answer. The user wants to transfer tokens.\n\n"
                    f"User request: {chat_prompt}\n\n"
                    f"Final answer: {final_answer}\n\n"
                    f"Extract:\n"
                    f"- token: Token to transfer (required)\n"
                    f"- to_address: Recipient address (required)\n"
                    f"- amount: Amount to transfer (required)\n"
                )

                transfer_extractor = LLM(
                    model=efficient_model,
                    response_format=TransferActionRequest,
                    api_key=standard_model_api_key,
                )
                transfer_response = transfer_extractor.call(transfer_prompt)
                transfer_data = parse_llm_structured_output(
                    transfer_response, TransferActionRequest, logger, "TransferActionRequest"
                )

                metadata = TransferActionMetadata(
                    agent="token_swap",
                    action_id=str(uuid.uuid4()),
                    timestamp=timestamp,
                    token=transfer_data.token,
                    to_address=transfer_data.to_address,
                    amount=transfer_data.amount,
                )

                final_action = FinalAnswerAction(
                    action_type=FinalAnswerActionType.TRANSFER, metadata=metadata, description=description
                )

                final_answer_actions.append(final_action)

            elif action_type == FinalAnswerActionType.IMAGE_GENERATION:
                # Extract image generation metadata
                image_prompt = (
                    f"Extract image generation details from this final answer. The user wants to generate an image.\n\n"
                    f"User request: {chat_prompt}\n\n"
                    f"Final answer: {final_answer}\n\n"
                    f"Extract:\n"
                    f"- prompt: The primary image generation prompt (required)\n"
                    f"- negative_prompt: Things to avoid in the image (optional)\n"
                    f"- style: Style of the image (optional)\n"
                )

                image_extractor = LLM(
                    model=efficient_model,
                    response_format=ImageGenerationActionRequest,
                    api_key=standard_model_api_key,
                )
                image_response = image_extractor.call(image_prompt)
                image_data = parse_llm_structured_output(
                    image_response, ImageGenerationActionRequest, logger, "ImageGenerationActionRequest"
                )

                metadata = ImageGenerationActionMetadata(
                    agent="imagen",
                    action_id=str(uuid.uuid4()),
                    timestamp=timestamp,
                    prompt=image_data.prompt,
                    negative_prompt=image_data.negative_prompt,
                    style=image_data.style,
                )

                final_action = FinalAnswerAction(
                    action_type=FinalAnswerActionType.IMAGE_GENERATION, metadata=metadata, description=description
                )

                final_answer_actions.append(final_action)

            elif action_type == FinalAnswerActionType.ANALYSIS:
                # Extract analysis metadata
                analysis_prompt = (
                    f"Extract analysis details from this final answer. The user wants to analyze data.\n\n"
                    f"User request: {chat_prompt}\n\n"
                    f"Final answer: {final_answer}\n\n"
                    f"Extract:\n"
                    f"- type: Type of analysis (token, wallet, etc.) (required)\n"
                    f"- subject: Subject of analysis (required)\n"
                    f"- parameters: Optional analysis parameters object which can include time_range, include_tokens, include_nfts, limit, sort_by, order, filter\n"
                )

                analysis_extractor = LLM(
                    model=efficient_model,
                    response_format=AnalysisActionRequest,
                    api_key=standard_model_api_key,
                )
                analysis_response = analysis_extractor.call(analysis_prompt)
                analysis_data = parse_llm_structured_output(
                    analysis_response, AnalysisActionRequest, logger, "AnalysisActionRequest"
                )

                metadata = AnalysisActionMetadata(
                    agent="codex",
                    action_id=str(uuid.uuid4()),
                    timestamp=timestamp,
                    type=analysis_data.type,
                    subject=analysis_data.subject,
                    parameters=analysis_data.parameters,
                )

                final_action = FinalAnswerAction(
                    action_type=FinalAnswerActionType.ANALYSIS, metadata=metadata, description=description
                )

                final_answer_actions.append(final_action)

        logger.info(f"Identified and extracted {len(final_answer_actions)} final answer actions")
        return final_answer_actions

    except Exception as e:
        logger.error(f"Failed to extract final answer actions: {str(e)}")
        return []