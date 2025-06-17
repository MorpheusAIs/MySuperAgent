"""
Models Controller

This controller handles model-related operations, specifically fetching
available models from the MOR API for frontend model selection.
"""

import requests
import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

# Configure logging
logger = logging.getLogger(__name__)

# MOR API configuration
MOR_API_BASE_URL = "https://api.mor.org/api/v1"
MOR_API_KEY = "sk-MOC63G.ac75f74343013115d31781f641857db2282ee62f90abe6cee7ab4ae0da82fae6"

class ModelsController:
    """Controller for handling model-related operations."""
    
    def __init__(self):
        """Initialize the ModelsController."""
        self.mor_api_base_url = MOR_API_BASE_URL
        self.mor_api_key = MOR_API_KEY
        
    async def get_available_models(self) -> Dict[str, Any]:
        """
        Fetch available models from the MOR API.
        
        Returns:
            Dict containing list of available models in frontend-compatible format
            
        Raises:
            HTTPException: If the MOR API request fails
        """
        try:
            # Make request to MOR API
            response = requests.get(
                f"{self.mor_api_base_url}/models",
                headers={
                    "Authorization": f"Bearer {self.mor_api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30
            )
            response.raise_for_status()
            
            # Parse response
            mor_data = response.json()
            
            # Transform MOR API response to frontend-compatible format
            models = []
            if "data" in mor_data:
                for model in mor_data["data"]:
                    model_id = model.get("id", "unknown")
                    tags = model.get("tags", [])
                    
                    model_info = {
                        "value": model_id,
                        "label": self._format_model_label(model_id),
                        "id": model_id,
                        "object": "model",  # Always set to "model" for consistency
                        "created": model.get("created"),
                        "owned_by": "MOR",  # Set to MOR since these are MOR models
                        "blockchain_id": model.get("blockchainID"),  # Include blockchain ID
                        "tags": tags,  # Include tags for additional info
                        "context_window": 8192,  # Default value, could be enhanced based on model
                        "supports_function_calling": True
                    }
                    models.append(model_info)
            
            # Add default model if no models returned
            if not models:
                models.append({
                    "value": "default",
                    "label": "Default MOR Model",
                    "id": "default",
                    "object": "model",
                    "context_window": 8192,
                    "supports_function_calling": True
                })
            
            return {
                "object": "list",
                "data": models
            }
            
        except requests.Timeout:
            logger.error("MOR API request timed out")
            raise HTTPException(
                status_code=504,
                detail="Request to MOR API timed out"
            )
        except requests.RequestException as e:
            logger.error(f"MOR API request failed: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch models from MOR API: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error fetching models: {e}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error while fetching models"
            )
    
    async def get_default_model(self) -> Dict[str, Any]:
        """
        Get the default model configuration.
        
        Returns:
            Dict containing default model information
        """
        return {
            "value": "default",
            "label": "Default MOR Model",
            "id": "default",
            "name": "Default MOR Model",
            "description": "The default model provided by MOR API",
            "context_window": 8192,
            "supports_function_calling": True,
            "provider": "MOR"
        }
    
    async def get_model_info(self, model_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific model.
        
        Args:
            model_id: The ID of the model to get information for
            
        Returns:
            Dict containing detailed model information
        """
        try:
            return {
                "id": model_id,
                "name": self._format_model_label(model_id),
                "provider": "MOR",
                "context_window": 8192,
                "supports_function_calling": True,
                "description": f"MOR model: {model_id}",
                "endpoint": self.mor_api_base_url
            }
            
        except Exception as e:
            logger.error(f"Error fetching model info for {model_id}: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch model information for {model_id}"
            )
    
    def _format_model_label(self, model_id: str) -> str:
        """
        Format model ID into a human-readable label.
        
        Args:
            model_id: The model ID to format
            
        Returns:
            Formatted model label
        """
        # Basic formatting - could be enhanced with more sophisticated logic
        if model_id == "default":
            return "Default MOR Model"
        
        # Handle special cases for better readability
        if "web" in model_id:
            formatted = model_id.replace("-web", " (Web Search)")
        else:
            formatted = model_id
            
        # Replace hyphens and underscores with spaces and capitalize
        formatted = formatted.replace("-", " ").replace("_", " ")
        
        # Handle common model name patterns
        formatted = formatted.replace("llama", "Llama")
        formatted = formatted.replace("mistral", "Mistral")
        formatted = formatted.replace("qwen", "Qwen")
        formatted = formatted.replace("venice", "Venice")
        formatted = formatted.replace("hermes", "Hermes")
        formatted = formatted.replace("whisper", "Whisper")
        formatted = formatted.replace("vl", "Vision Language")
        formatted = formatted.replace("qwq", "QwQ")
        formatted = formatted.replace("uncensored", "Uncensored")
        
        return formatted