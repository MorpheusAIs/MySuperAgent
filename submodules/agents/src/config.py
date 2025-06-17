import importlib.util
import os
from typing import Any, Dict, List, Optional, Union

from crewai import LLM
from fastapi import APIRouter
from langchain_ollama import ChatOllama, OllamaEmbeddings

# from langchain_together import ChatTogether
from logs import setup_logging
from services.api_gateway.mor_llm import MORLLM
from services.secrets import get_secret
from services.vectorstore.together_embeddings import TogetherEmbeddings
from services.vectorstore.vector_store_service import VectorStoreService
from together import Together

logger = setup_logging()


def load_agent_routes() -> List[APIRouter]:
    """
    Dynamically load all route modules from agent subdirectories.
    Returns a list of FastAPI router objects.
    """
    routers: List[APIRouter] = []
    agents_dir = os.path.join(os.path.dirname(__file__), "services/agents")
    logger.info(f"Loading agents from {agents_dir}")

    for agent_dir in os.listdir(agents_dir):
        agent_path = os.path.join(agents_dir, agent_dir)
        routes_file = os.path.join(agent_path, "routes.py")

        # Skip non-agent directories
        if not os.path.isdir(agent_path) or agent_dir.startswith("__"):
            continue

        # Skip if no routes file exists
        if not os.path.exists(routes_file):
            continue

        try:
            module_name = f"services.agents.{agent_dir}.routes"
            spec = importlib.util.spec_from_file_location(module_name, routes_file)

            if spec is None or spec.loader is None:
                logger.error(f"Failed to load module spec for {routes_file}")
                continue

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if hasattr(module, "router"):
                routers.append(module.router)
                logger.info(f"Successfully loaded routes from {agent_dir}")
            else:
                logger.warning(f"No router found in {agent_dir}/routes.py")

        except Exception as e:
            logger.error(f"Error loading routes from {agent_dir}: {str(e)}")

    return routers


def load_agent_config(agent_name: str) -> Optional[Dict[str, Any]]:
    """
    Load configuration for a specific agent by name.

    Args:
        agent_name (str): Name of the agent to load config for

    Returns:
        Optional[Dict[str, Any]]: Agent configuration if found and loaded successfully, None otherwise
    """
    agents_dir = os.path.join(os.path.dirname(__file__), "services/agents")
    agent_path = os.path.join(agents_dir, agent_name)
    config_file = os.path.join(agent_path, "config.py")

    # Verify agent directory exists and is valid
    if not os.path.isdir(agent_path) or agent_name.startswith("__"):
        logger.error(f"Invalid agent directory: {agent_name}")
        return None

    # Check config file exists
    if not os.path.exists(config_file):
        logger.warning(f"No config file found for agent: {agent_name}")
        return None

    try:
        # Import the config module
        module_name = f"services.agents.{agent_name}.config"
        spec = importlib.util.spec_from_file_location(module_name, config_file)

        if spec is None or spec.loader is None:
            logger.error(f"Failed to load module spec for {config_file}")
            return None

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Check for Config class and agent_config
        if (
            hasattr(module, "Config")
            and hasattr(module.Config, "agent_config")
            and module.Config.agent_config.is_enabled
        ):
            config_dict: Dict[str, Any] = module.Config.agent_config.model_dump()
            config_dict["name"] = agent_name
            if hasattr(module.Config, "tools"):
                config_dict["tools"] = module.Config.tools
            logger.info(f"Successfully loaded config for {agent_name}")
            return config_dict
        else:
            logger.warning(f"No Config class or agent_config found in {agent_name}/config.py")
            return None

    except Exception as e:
        logger.error(f"Error loading config for {agent_name}: {str(e)}")
        return None


def load_agent_configs() -> List[Dict[str, Any]]:
    """
    Dynamically load configurations from all agent subdirectories.
    Returns a consolidated configuration dictionary.
    Skips special directories like __init__.py, __pycache__, and README.md.
    """
    agents_dir = os.path.join(os.path.dirname(__file__), "services/agents")
    logger.info(f"Loading agents from {agents_dir}")
    configs: List[Dict[str, Any]] = []

    for agent_dir in os.listdir(agents_dir):
        # Skip special directories and files
        if agent_dir.startswith("__") or agent_dir.startswith(".") or "." in agent_dir:
            continue

        config = load_agent_config(agent_dir)
        if config:
            configs.append(config)

    return configs


# Configuration object
class AppConfig:
    # Model configuration
    OLLAMA_MODEL = "llama3.2:3b"
    OLLAMA_EMBEDDING_MODEL = "nomic-embed-text"
    OLLAMA_URL = "http://host.docker.internal:11434"
    MAX_UPLOAD_LENGTH = 16 * 1024 * 1024

    # LLM Configurations
    LLM_AGENT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo"  # Together AI
    LLM_DELEGATOR_MODEL = "llama-3.3-70b"  # Cerebras

    # MOR API Configuration
    MOR_API_KEY = "sk-MOC63G.ac75f74343013115d31781f641857db2282ee62f90abe6cee7ab4ae0da82fae6"
    MOR_API_ENDPOINT = "https://api.mor.org/api/v1/chat/completions"


# Check if API keys are available
has_together_api_key = False
has_cerebras_api_key = False
has_gemini_api_key = False

try:
    together_api_key = get_secret("TogetherApiKey")
    has_together_api_key = together_api_key is not None and together_api_key != ""
    if has_together_api_key:
        os.environ["TOGETHER_API_KEY"] = together_api_key
except Exception as e:
    logger.warning(f"Failed to get TogetherApiKey: {str(e)}")

try:
    cerebras_api_key = get_secret("CerebrasApiKey")
    has_cerebras_api_key = cerebras_api_key is not None and cerebras_api_key != ""
    if has_cerebras_api_key:
        os.environ["CEREBRAS_API_KEY"] = cerebras_api_key
except Exception as e:
    logger.warning(f"Failed to get CerebrasApiKey: {str(e)}")

try:
    gemini_api_key = get_secret("GeminiApiKey")
    has_gemini_api_key = gemini_api_key is not None and gemini_api_key != ""
    if has_gemini_api_key:
        os.environ["GEMINI_API_KEY"] = gemini_api_key
except Exception as e:
    logger.warning(f"Failed to get GeminiApiKey: {str(e)}")

try:
    openai_api_key = get_secret("OpenaiApiKey")
    has_openai_api_key = openai_api_key is not None and openai_api_key != ""
    if has_openai_api_key:
        os.environ["OPENAI_API_KEY"] = openai_api_key
except Exception as e:
    logger.warning(f"Failed to get OpenaiApiKey: {str(e)}")

try:
    apify_api_key = get_secret("ApifyApiKey")
    has_apify_api_key = apify_api_key is not None and apify_api_key != ""
    if has_apify_api_key:
        os.environ["APIFY_API_TOKEN"] = apify_api_key
except Exception as e:
    logger.warning(f"Failed to get ApifyApiKey: {str(e)}")

try:
    brave_api_key = get_secret("BraveApiKey")
    has_brave_api_key = brave_api_key is not None and brave_api_key != ""
    if has_brave_api_key:
        os.environ["BRAVE_API_KEY"] = brave_api_key
except Exception as e:
    logger.warning(f"Failed to get BraveApiKey: {str(e)}")

# Use cloud models if API keys are available, otherwise use local Ollama
if has_together_api_key and has_cerebras_api_key and has_gemini_api_key:
    logger.info("Using cloud LLM providers (Together AI, Cerebras, and Gemini)")
    LLM_AGENT = LLM(
        model="gemini/gemini-2.5-flash-preview-04-17",
        temperature=0.8,
        max_tokens=2000,
        top_p=0.9,
        stop=["END"],
        verbose=False,
        seed=42,
        api_key=gemini_api_key,
        frequency_penalty=None,
        presence_penalty=None,
    )

    LLM_DELEGATOR = LLM(
        model="gemini/gemini-2.5-flash-preview-04-17",
        temperature=0.8,
        max_tokens=2000,
        top_p=0.9,
        stop=["END"],
        verbose=False,
        seed=42,
        api_key=gemini_api_key,
        frequency_penalty=None,
        presence_penalty=None,
    )

    embeddings = TogetherEmbeddings(
        model_name="togethercomputer/m2-bert-80M-8k-retrieval",
        api_key=together_api_key,
    )

    TOGETHER_CLIENT = Together(api_key=together_api_key)
else:
    logger.info("Using local Ollama models")
    LLM_AGENT = ChatOllama(
        model=AppConfig.OLLAMA_MODEL,
        base_url=AppConfig.OLLAMA_URL,
        temperature=0.7,
    )

    LLM_DELEGATOR = ChatOllama(
        model=AppConfig.OLLAMA_MODEL,
        base_url=AppConfig.OLLAMA_URL,
    )

    embeddings = OllamaEmbeddings(
        model=AppConfig.OLLAMA_EMBEDDING_MODEL,
        base_url=AppConfig.OLLAMA_URL,
    )

    TOGETHER_CLIENT = None


def create_morllm(model: str = "default", temperature: float = 0.7, response_format: Optional[Any] = None) -> MORLLM:
    """
    Factory function to create MORLLM instances with user-selected models.

    Args:
        model: The model ID to use (default: "default")
        temperature: Sampling temperature (default: 0.7)
        response_format: Pydantic model for structured output (optional)

    Returns:
        MORLLM instance configured with the specified model
    """
    return MORLLM(
        model=model,
        api_key=AppConfig.MOR_API_KEY,
        endpoint=AppConfig.MOR_API_ENDPOINT,
        temperature=temperature,
        response_format=response_format,
    )


def get_llm_for_request(selected_model: Optional[str] = None) -> Union[LLM, MORLLM]:
    """
    Get the appropriate LLM instance based on user selection.

    Args:
        selected_model: User-selected model ID for MOR API, or None for default LLM

    Returns:
        LLM instance (either MORLLM or default LLM_AGENT)
    """
    if selected_model and selected_model != "default":
        logger.info(f"Using MOR API with model: {selected_model}")
        return create_morllm(selected_model)
    else:
        logger.info("Using default LLM configuration")
        return LLM_AGENT


# Vector store path for persistence
VECTOR_STORE_PATH = os.path.join(os.getcwd(), "data", "vector_store")

# Initialize vector store service and load existing store if it exists
RAG_VECTOR_STORE = VectorStoreService(embeddings)
if os.path.exists(VECTOR_STORE_PATH):
    logger.info(f"Loading existing vector store from {VECTOR_STORE_PATH}")
    try:
        RAG_VECTOR_STORE = VectorStoreService.load(VECTOR_STORE_PATH, embeddings)
    except Exception as e:
        logger.error(f"Failed to load vector store: {str(e)}")
        # Continue with empty vector store if load fails
        RAG_VECTOR_STORE = VectorStoreService(embeddings)
