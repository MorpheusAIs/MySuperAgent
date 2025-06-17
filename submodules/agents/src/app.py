import os

import uvicorn
from config import load_agent_routes, setup_logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.config.config import Config
from routes import agent_manager_routes, chat_routes, models_routes, wallet_manager_routes

CONF = Config.get_instance()
logger = setup_logging()


def create_app() -> FastAPI:
    """Factory function that builds and returns a fully‑configured FastAPI app."""
    app = FastAPI()

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Create /uploads directory once per process
    upload_folder = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    logger.info("Upload folder created at %s", upload_folder)

    # Core routers
    routers = [
        chat_routes.router,
        agent_manager_routes.router,
        wallet_manager_routes.router,
        models_routes.router,
        *load_agent_routes(),  # dynamically discovered agent routers
    ]

    for router in routers:
        app.include_router(router)

    return app


# The ASGI application object that Uvicorn imports
app: FastAPI = create_app()


if __name__ == "__main__":
    # Running directly (e.g. `python src/app.py`) — *no* auto‑reload here
    uvicorn.run(
        app,
        host=CONF.get("host", "default"),
        port=CONF.get_int("port", "default"),
        workers=CONF.get_int("workers", "default"),
        reload=False,  # avoid the double‑import issue
    )
