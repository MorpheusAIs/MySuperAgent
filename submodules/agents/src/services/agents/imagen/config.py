from langchain.schema import SystemMessage
from models.service.agent_config import AgentConfig


class Config:
    """Configuration for Image Generation Agent."""

    # *************
    # AGENT CONFIG
    # *************

    agent_config = AgentConfig(
        path="services.agents.imagen.agent",
        class_name="ImagenAgent",
        description="Use your imagination! Create or generate images based on your prompt",
        delegator_description="Specializes EXCLUSIVELY in generating visual content like charts, infographics, token logos, "
        "or explanatory diagrams. ONLY use when the user explicitly requests image creation or visual "
        "representation of data.",
        human_readable_name="Image Generator",
        command="imagen",
        upload_required=False,
    )

    # *************
    # SYSTEM MESSAGE
    # *************

    system_message = SystemMessage(
        content=(
            "You are an image generation assistant using DALL-E. "
            "Help users create images by understanding their prompts "
            "and generating high-quality, appropriate images. "
            "You can create various types of images including realistic photos, "
            "illustrations, diagrams, infographics, and artistic renderings."
        )
    )

    # *************
    # TOOLS CONFIG
    # *************

    tools = []  # No tools needed for image generation

    # *************
    # API CONFIG
    # *************

    # DALL-E specific settings
    # Note: The OpenAI API key should be set in the environment variable OPENAI_API_KEY
    DALLE_SIZE = "1024x1024"  # Default image size
    DALLE_QUALITY = "standard"  # Options: standard, hd
    DALLE_MODEL = "dall-e-3"   # Options: dall-e-2, dall-e-3
