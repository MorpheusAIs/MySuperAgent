from typing import List, Dict, Optional
from pydantic import BaseModel


class AgentConfig(BaseModel):
    """
    Configuration model for agents in the system.

    Attributes:
        path (str): Import path to the agent module
        class_name (str): Name of the agent class to instantiate
        description (str): Description of what the agent does
        delegator_description (str): Description of what the agent does for use in the delegator
        human_readable_name (str): User-friendly display name for the agent
        command (str): Command used to invoke this agent (e.g. "dexscreener")
        upload_required (bool): Whether this agent requires file uploads to function
    """

    path: str
    class_name: str
    description: str
    delegator_description: str
    name: Optional[str] = None
    human_readable_name: str
    command: str
    upload_required: bool = False
    is_enabled: bool = True
    tools: List[Dict] = []
    mcp_server_url: Optional[str] = None
