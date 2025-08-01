"""
Tools for image generation.
"""

import base64
import logging
from io import BytesIO
from typing import Any, Dict, Optional

import requests
from PIL import Image
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from services.agents.imagen.config import Config
from services.tools.exceptions import ToolExecutionError
from services.tools.interfaces import Tool
from services.tools.utils import handle_tool_exceptions, log_tool_usage

logger = logging.getLogger(__name__)


class GenerateImageTool(Tool):
    """Tool for generating images from text prompts."""
    
    name = "generate_image"
    description = "Generate an image based on a text prompt"
    category = "content"
    parameters = {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "Text description of the image to generate",
            },
        },
        "required": ["prompt"],
    }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the image generation tool.
        
        Args:
            prompt: Text description of the image to generate
            
        Returns:
            Dict[str, Any]: The image generation result
            
        Raises:
            ToolExecutionError: If the image generation fails
        """
        log_tool_usage(self.name, kwargs)
        
        prompt = kwargs.get("prompt")
        if not prompt:
            raise ToolExecutionError("Prompt must be provided", self.name)
        
        return await self._generate_image(prompt)
    
    @handle_tool_exceptions("generate_image")
    async def _generate_image(self, prompt: str) -> Dict[str, Any]:
        """Generate an image based on a text prompt."""
        logger.info(f"Starting image generation for prompt: {prompt}")

        # Generate image using FluxAI
        image = self._generate_with_fluxai(prompt)
        if image:
            img_str = self._encode_image(image)
            if img_str:
                return {
                    "success": True, 
                    "service": "FluxAI", 
                    "image": img_str,
                    "message": "Image generated successfully based on your prompt.",
                }

        raise ToolExecutionError("Failed to generate image with FluxAI", self.name)
    
    def _setup_headless_browser(self) -> webdriver.Chrome:
        """Set up a headless Chrome browser for image generation."""
        chrome_options = Options()

        # Essential Chromium flags for running in Docker
        chrome_options.binary_location = Config.CHROME_BINARY
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-infobars")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-setuid-sandbox")
        chrome_options.add_argument("--single-process")
        chrome_options.add_argument("--ignore-certificate-errors")
        chrome_options.add_argument("--ignore-ssl-errors")

        # Additional options for stability
        chrome_options.add_argument("--disable-features=VizDisplayCompositor")
        chrome_options.add_argument("--disable-dev-tools")
        chrome_options.add_argument("--disable-software-rasterizer")

        try:
            service = Service(Config.CHROME_DRIVER)
            driver = webdriver.Chrome(service=service, options=chrome_options)
            return driver
        except Exception as e:
            logger.error(f"Failed to setup Chromium browser: {str(e)}")
            raise ToolExecutionError(f"Failed to setup browser: {str(e)}", self.name)
    
    def _generate_with_fluxai(self, prompt: str) -> Optional[Image.Image]:
        """Generate an image using FluxAI service."""
        logger.info(f"Attempting image generation for prompt: {prompt}")
        driver = None
        try:
            driver = self._setup_headless_browser()
            driver.set_page_load_timeout(Config.PAGE_LOAD_TIMEOUT)
            driver.get(Config.FLUX_AI_URL)

            # Find textarea and enter the prompt
            wait = WebDriverWait(driver, Config.ELEMENT_WAIT_TIMEOUT)
            textarea = wait.until(EC.presence_of_element_located((By.TAG_NAME, "textarea")))
            textarea.clear()
            textarea.send_keys(prompt)

            # Click generate button
            run_button = driver.find_element(
                By.XPATH,
                "//textarea/following-sibling::button[contains(text(), 'Generate')]",
            )
            run_button.click()

            # Wait for the generated image
            img_element = WebDriverWait(driver, Config.ELEMENT_WAIT_TIMEOUT).until(
                EC.presence_of_element_located((By.XPATH, "//img[@alt='Generated' and @loading='lazy']"))
            )

            if img_element:
                img_src = img_element.get_attribute("src")
                if not img_src:
                    logger.warning("Image source URL is empty")
                    return None

                logger.debug(f"Image source: {img_src}")

                # Download the image
                if img_src.startswith(
                    (
                        "https://api.together.ai/imgproxy/",
                        "https://fast-flux-demo.replicate.workers.dev/api/generate-image",
                    )
                ):
                    response = requests.get(img_src)
                    if response.status_code == 200:
                        img_data = response.content
                        return Image.open(BytesIO(img_data))
                    else:
                        logger.error(f"Failed to download image. Status code: {response.status_code}")
                else:
                    logger.warning("Image format not supported. Expected a valid imgproxy or replicate URL.")
            else:
                logger.warning("Image not found or still generating. You may need to increase the wait time.")

        except Exception as e:
            logger.error(f"Error in image generation: {str(e)}")
            raise ToolExecutionError(f"Error generating image: {str(e)}", self.name)

        finally:
            if driver:
                try:
                    driver.quit()
                except Exception as e:
                    logger.error(f"Error closing browser: {str(e)}")

        return None
    
    def _encode_image(self, image: Optional[Image.Image]) -> Optional[str]:
        """Encode an image to base64 string."""
        if image:
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            return img_str
        return None