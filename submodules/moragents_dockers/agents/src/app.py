import logging
import os
import time

import uvicorn
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.embeddings import OllamaEmbeddings
from langchain_ollama import ChatOllama
from pydantic import BaseModel
from src.config import Config
from src.delegator import Delegator
from src.models.messages import ChatRequest
from src.stores import agent_manager, chat_manager
from src.routes import (
    agent_manager_routes,
    chat_manager_routes,
    key_manager_routes,
    wallet_manager_routes,
)

# Constants
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    filename="app.log",
    filemode="a",
)
logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

llm = ChatOllama(
    model=Config.OLLAMA_MODEL,
    base_url=Config.OLLAMA_URL,
)
embeddings = OllamaEmbeddings(model=Config.OLLAMA_EMBEDDING_MODEL, base_url=Config.OLLAMA_URL)

delegator = Delegator(agent_manager, llm, embeddings)

# Include base store routes
app.include_router(agent_manager_routes.router)
app.include_router(key_manager_routes.router)
app.include_router(chat_manager_routes.router)
app.include_router(wallet_manager_routes.router)

# Agent route imports
from src.agents.rag.routes import router as rag_routes
from src.agents.mor_claims.routes import router as claim_routes
from src.agents.tweet_sizzler.routes import router as tweet_routes
from src.agents.token_swap.routes import router as swap_routes

# Include agent routes
app.include_router(rag_routes.router)
app.include_router(claim_routes.router)
app.include_router(tweet_routes.router)
app.include_router(swap_routes.router)


async def get_active_agent_for_chat(prompt: dict) -> str:
    """Get the active agent for handling the chat request."""
    active_agent = agent_manager.get_active_agent()
    if active_agent:
        return active_agent

    logger.info("No active agent, getting delegator response")
    start_time = time.time()
    result = delegator.get_delegator_response(prompt)
    logger.info(f"Delegator response time: {time.time() - start_time:.2f} seconds")
    logger.info(f"Delegator response: {result}")

    if "agent" not in result:
        logger.error(f"Missing 'agent' key in delegator response: {result}")
        raise ValueError("Invalid delegator response: missing 'agent' key")

    return result["agent"]


def validate_agent_response(response: dict, current_agent: str) -> dict:
    """Validate and process the agent's response."""
    if not current_agent:
        logger.error("All agents failed to provide a valid response")
        raise HTTPException(
            status_code=500,
            detail="All available agents failed to process the request",
        )

    if isinstance(response, tuple) and len(response) == 2:
        error_message, status_code = response
        logger.error(f"Error from agent: {error_message}")
        raise HTTPException(status_code=status_code, detail=error_message)

    if not isinstance(response, dict) or "role" not in response or "content" not in response:
        logger.error(f"Invalid response format: {response}")
        raise HTTPException(status_code=500, detail="Invalid response format")

    return response


@app.post("/chat")
async def chat(chat_request: ChatRequest):
    prompt = chat_request.prompt.dict()
    chat_manager.add_message(prompt)

    try:
        delegator.reset_attempted_agents()
        active_agent = await get_active_agent_for_chat(prompt)

        logger.info(f"Delegating chat to active agent: {active_agent}")
        current_agent, response = delegator.delegate_chat(active_agent, chat_request)

        validated_response = validate_agent_response(response, current_agent)
        chat_manager.add_response(validated_response, current_agent)

        logger.info(f"Sending response: {validated_response}")
        return validated_response

    except TimeoutError:
        logger.error("Chat request timed out")
        raise HTTPException(status_code=504, detail="Request timed out")
    except ValueError as ve:
        logger.error(f"Input formatting error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in chat route: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)
