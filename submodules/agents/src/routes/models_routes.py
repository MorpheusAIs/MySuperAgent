"""
Models Routes

This module defines the API routes for model-related operations,
including fetching available models from the MOR API.
"""

import logging

from controllers.models_controller import ModelsController
from fastapi import APIRouter, HTTPException

# Configure logging
logger = logging.getLogger(__name__)

# Router for model-related endpoints
router = APIRouter(prefix="/models", tags=["models"])


@router.get("/available")
async def get_available_models():
    """
    Get list of available models from MOR API.

    Returns:
        Dict containing list of available models with metadata

    Raises:
        HTTPException: If the request fails
    """
    try:
        controller = ModelsController()
        return await controller.get_available_models()
    except Exception as e:
        logger.error(f"Error in get_available_models route: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/default")
async def get_default_model():
    """
    Get the default model configuration.

    Returns:
        Dict containing default model information
    """
    try:
        controller = ModelsController()
        return await controller.get_default_model()
    except Exception as e:
        logger.error(f"Error in get_default_model route: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{model_id}/info")
async def get_model_info(model_id: str):
    """
    Get detailed information about a specific model.

    Args:
        model_id: The ID of the model to get information for

    Returns:
        Dict containing detailed model information
    """
    try:
        controller = ModelsController()
        return await controller.get_model_info(model_id)
    except Exception as e:
        logger.error(f"Error in get_model_info route: {e}")
        raise HTTPException(status_code=500, detail=str(e))
