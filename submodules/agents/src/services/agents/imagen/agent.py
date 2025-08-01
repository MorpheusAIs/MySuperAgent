import base64
import logging
import os
from io import BytesIO
from typing import Any, Dict, List, Optional

from crewai_tools import DallETool
from models.service.agent_core import AgentCore
from models.service.chat_models import AgentResponse, ChatRequest
from PIL import Image

logger = logging.getLogger(__name__)


class ImagenAgent(AgentCore):
    """Agent for handling image generation requests."""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.tools_provided: List[str] = []  # No tools needed for image generation
        
        # Create the DALL-E tool with parameters from config
        self.dalle_tool = DallETool(
            model=config.get("DALLE_MODEL", "dall-e-3"),
            size=config.get("DALLE_SIZE", "1024x1024"),
            quality=config.get("DALLE_QUALITY", "standard")
        )
        
        # Check if OPENAI_API_KEY is set
        if "OPENAI_API_KEY" not in os.environ:
            logger.warning("OPENAI_API_KEY environment variable not set. DALL-E image generation may fail.")

    async def _process_request(self, request: ChatRequest) -> AgentResponse:
        """Process the validated chat request for image generation."""
        try:
            # For image generation, we'll directly use the prompt content
            result = await self.generate_image(request.prompt.content)

            if result["success"]:
                return AgentResponse.success(
                    content="Image generated successfully",
                    metadata={
                        "success": True,
                        "service": result["service"],
                        "image": result["image"],
                    },
                )
            else:
                return AgentResponse.error(error_message=result["error"])

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return AgentResponse.error(error_message=str(e))

    async def _execute_tool(self, func_name: str, args: Dict[str, Any]) -> AgentResponse:
        """Image generation agent doesn't use tools."""
        return AgentResponse.error(error_message=f"Unknown tool: {func_name}")

    def _encode_image(self, image_data: bytes) -> str:
        """Encode image data to base64 string."""
        return base64.b64encode(image_data).decode()

    async def generate_image(self, prompt: str) -> Dict[str, Any]:
        """Generate an image using DALL-E."""
        logger.info(f"Starting image generation for prompt: {prompt}")

        try:
            # Generate image using DALL-E
            result = await self.dalle_tool.arun(prompt)
            
            if result and isinstance(result, str) and result.startswith("http"):
                # The DallETool returns a URL, download the image
                import requests
                response = requests.get(result)
                
                if response.status_code == 200:
                    # Encode the image to base64
                    img_str = self._encode_image(response.content)
                    return {"success": True, "service": "DALL-E", "image": img_str}
            
            logger.error(f"Failed to generate or download image: {result}")
            return {
                "success": False,
                "error": "Failed to generate image with DALL-E",
            }
            
        except Exception as e:
            logger.error(f"Error generating image with DALL-E: {str(e)}", exc_info=True)
            
            # Try fallback method here if we want to implement one
            
            return {
                "success": False,
                "error": f"Failed to generate image: {str(e)}",
            }
