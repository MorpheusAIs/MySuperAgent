import logging

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from stores import agent_manager_instance

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/available")
async def get_available_agents() -> JSONResponse:
    """Get the list of currently available agents"""
    return JSONResponse(
        content={
            "selected_agents": agent_manager_instance.get_selected_agents(),
            "available_agents": agent_manager_instance.get_available_agents(),
        }
    )


@router.post("/selected")
async def set_selected_agents(request: Request) -> JSONResponse:
    """Set which agents should be selected"""
    data = await request.json()
    agent_names = data.get("agents", [])

    agent_manager_instance.set_selected_agents(agent_names)
    logger.info(f"Newly selected agents: {agent_manager_instance.get_selected_agents()}")

    return JSONResponse(content={"status": "success", "agents": agent_names})


@router.get("/commands")
async def get_agent_commands() -> JSONResponse:
    """Get the list of available agent commands"""
    available_agents = agent_manager_instance.get_available_agents()
    commands = [
        {
            "command": agent["command"],
            "description": agent["description"],
            "name": agent["human_readable_name"],
        }
        for agent in available_agents
    ]
    return JSONResponse(content={"commands": commands})


class CreateAgentRequest(BaseModel):
    """Request model for creating a new agent"""

    human_readable_name: str
    command: str
    description: str
    delegator_description: str
    mcp_server_url: str
    upload_required: bool = False
    is_enabled: bool = True


@router.post("/create")
async def create_agent(agent_data: CreateAgentRequest) -> JSONResponse:
    """Create a new MCP agent"""
    try:
        # Validate that the command is unique
        commands = [agent["command"] for agent in agent_manager_instance.get_available_agents()]
        if agent_data.command in commands:
            raise HTTPException(status_code=400, detail=f"Command '{agent_data.command}' already exists")

        # Create the agent
        agent_config = await agent_manager_instance.create_mcp_agent(agent_data.model_dump())

        return JSONResponse(
            content={
                "status": "success",
                "message": f"Agent '{agent_data.human_readable_name}' created successfully",
                "agent": {
                    "name": agent_config["name"],
                    "human_readable_name": agent_config["human_readable_name"],
                    "command": agent_config["command"],
                    "description": agent_config["description"],
                    "tools": [tool["name"] for tool in agent_config.get("tools", [])],
                },
            },
            status_code=201,
        )
    except Exception as e:
        logger.error(f"Error creating agent: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating agent: {str(e)}")
