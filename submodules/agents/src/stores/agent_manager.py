import importlib
import logging
from typing import Any, Dict, List, Optional, Tuple

from config import load_agent_configs, setup_logging
from langchain_ollama import ChatOllama
from langchain_together import ChatTogether
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.tools import StructuredTool
from models.service.agent_config import AgentConfig

from config import LLM_AGENT

logger = setup_logging()


class AgentManager:
    """
    Manages the loading, selection and activation of agents in the system.

    Attributes:
        active_agent (Optional[str]): Currently active agent name
        selected_agents (List[str]): List of selected agent names
        config (Dict): Configuration dictionary for agents
        agents (Dict[str, Any]): Dictionary of loaded agent instances
        llm (ChatOllama): Language model instance
        mcp_clients (Dict[str, MultiServerMCPClient]): Dictionary of MCP clients
    """

    def __init__(self, config: List[Dict]) -> None:
        """
        Initialize the AgentManager.

        Args:
            config (Dict): Configuration dictionary containing agent definitions
        """
        self.active_agent: Optional[str] = None
        self.selected_agents: List[str] = []
        self.config: List[Dict] = config
        self.agents: Dict[str, Any] = {}
        self.llm: Optional[ChatOllama | ChatTogether] = LLM_AGENT

        # Select first 6 agents by default
        self.set_selected_agents([agent["name"] for agent in config])
        # self.load_all_agents(LLM, EMBEDDINGS)
        logger.info(f"AgentManager initialized with {len(self.selected_agents)} agents")

    def _load_agent(self, agent_config: Dict) -> bool:
        """
        Load a single agent from its configuration.

        Args:
            agent_config (Dict): Configuration for the agent to load

        Returns:
            bool: True if agent loaded successfully, False otherwise
        """
        try:
            module = importlib.import_module(agent_config["path"])
            agent_class = getattr(module, agent_config["class_name"])
            self.agents[agent_config["name"]] = agent_class(agent_config, self.llm)
            logger.info(f"Loaded agent: {agent_config['name']}")
            return True
        except Exception as e:
            logger.error(f"Failed to load agent {agent_config['name']}: {str(e)}")
            return False

    def load_all_agents(self, llm: ChatOllama) -> None:
        """
        Load all available agents with the given language and embedding models.

        Args:
            llm (ChatOllama): Language model instance
        """
        self.llm = llm
        for agent_config in self.get_available_agents():
            self._load_agent(agent_config)
        logger.info(f"Loaded {len(self.agents)} agents")

    async def create_mcp_agent(self, agent_data: Dict) -> Dict:
        """
        Create a new MCP agent dynamically.

        Args:
            agent_data (Dict): Agent configuration data from the UI

        Returns:
            Dict: The created agent configuration
        """
        try:
            # Create a unique name for the agent
            agent_name = agent_data["human_readable_name"].replace(" ", "_").lower()

            # Test connection and get tools from the MCP server
            test_client = MultiServerMCPClient(
                {
                    agent_name: {
                        "url": agent_data["mcp_server_url"],
                        "transport": "sse",
                    }
                }
            )
            async with test_client as client:
                # Get the tools from the MCP server
                tools: List[StructuredTool] = client.get_tools()

                # Log the tools for debugging
                logger.info(f"Retrieved {len(tools)} tools from MCP server")

                # Extract tool schemas properly from StructuredTools
                tool_schemas = []
                for tool in tools:
                    try:
                        logger.info(f"Tool: {tool.name}, Description: {tool.description}")

                        # Extract schema based on tool type
                        schema_dict = None

                        # For StructuredTool with Pydantic schema
                        if hasattr(tool, "args_schema") and tool.args_schema is not None:
                            if hasattr(tool.args_schema, "model_json_schema"):
                                schema_dict = tool.args_schema.model_json_schema()

                        # Add the tool schema with available information
                        if schema_dict:
                            tool_schemas.append(
                                {
                                    "name": tool.name,
                                    "description": tool.description,
                                    "properties": schema_dict.get("properties", {}),
                                    "required": schema_dict.get("required", []),
                                }
                            )
                        else:
                            # Fallback if we can't get schema directly
                            tool_schemas.append({"name": tool.name, "description": tool.description})

                    except Exception as e:
                        logger.warning(f"Error processing tool {getattr(tool, 'name', 'unknown')}: {str(e)}")
                        # Ensure we at least capture the name and description
                        tool_schemas.append(
                            {"name": getattr(tool, "name", "unknown"), "description": getattr(tool, "description", "")}
                        )

                logger.info(f"Tool schemas: {tool_schemas}")

                # Create agent config using the AgentConfig model with tools from MCP
                agent_config = AgentConfig(
                    path="services.agents.mcp_agent.agent",
                    name=agent_name,
                    class_name="MCPAgent",
                    description=agent_data["description"],
                    delegator_description=agent_data["delegator_description"],
                    human_readable_name=agent_data["human_readable_name"],
                    command=agent_data["command"],
                    upload_required=agent_data.get("upload_required", False),
                    is_enabled=agent_data.get("is_enabled", True),
                    tools=tool_schemas,
                    mcp_server_url=agent_data["mcp_server_url"],
                ).model_dump()

                # Add to config
                # End of Selection
                self.config.append(agent_config)

                # Load the agent
                self._load_agent(agent_config)

                # Add to selected agents
                if agent_name not in self.selected_agents:
                    self.selected_agents.append(agent_name)

            logger.info(f"Created new MCP agent: {agent_name}")
            return agent_config

        except Exception as e:
            logger.error(f"Failed to create MCP agent: {str(e)}")
            raise Exception(f"Failed to create MCP agent: {str(e)}")

    def get_active_agent(self) -> Optional[str]:
        """
        Get the name of the currently active agent.

        Returns:
            Optional[str]: Name of active agent or None if no agent is active
        """
        return self.active_agent

    def set_active_agent(self, agent_name: Optional[str]) -> None:
        """
        Set the active agent.

        Args:
            agent_name (Optional[str]): Name of agent to activate

        Raises:
            ValueError: If agent_name is not in selected_agents
        """
        self.active_agent = agent_name

    def clear_active_agent(self) -> None:
        """Clear the currently active agent."""
        self.active_agent = None

    def get_available_agents(self):
        """
        Get list of all available agents from config.

        Returns:
            List[Dict]: List of agent configurations
        """
        return self.config

    def get_selected_agents(self) -> List[str]:
        """
        Get list of currently selected agent names.

        Returns:
            List[str]: List of selected agent names
        """
        return self.selected_agents

    def set_selected_agents(self, agent_names: List[str]) -> None:
        """
        Set the list of selected agents.

        Args:
            agent_names (List[str]): Names of agents to select

        Raises:
            ValueError: If any agent name is invalid
        """
        valid_names = {agent["name"] for agent in self.config}
        invalid_names = [name for name in agent_names if name not in valid_names]

        if invalid_names:
            raise ValueError(f"Invalid agent names provided: {invalid_names}")

        self.selected_agents = agent_names

        if self.active_agent not in agent_names:
            self.clear_active_agent()

    def get_agent_config(self, agent_name: str) -> Optional[Dict]:
        """
        Get configuration for a specific agent.

        Args:
            agent_name (str): Name of agent

        Returns:
            Optional[Dict]: Agent configuration if found, None otherwise
        """
        return next((agent for agent in self.config if agent["name"] == agent_name), None)

    def get_agent(self, agent_name: str) -> Optional[Any]:
        """
        Get agent instance by name.

        Args:
            agent_name (str): Name of agent

        Returns:
            Optional[Any]: Agent instance if found, None otherwise
        """
        return self.agents.get(agent_name)

    def get_agent_by_command(self, command: str) -> Optional[str]:
        """
        Get agent name by command.

        Args:
            command (str): Command to look up

        Returns:
            Optional[str]: Agent name if found, None otherwise
        """
        for agent in self.config:
            if agent["command"] == command:
                return agent["name"]
        return None

    def parse_command(self, message: str) -> Tuple[Optional[str], str]:
        """
        Parse a message for commands.

        Args:
            message (str): Message to parse

        Returns:
            Tuple[Optional[str], str]: Tuple of (agent_name, message_without_command)
        """
        if not message.startswith("/"):
            return None, message

        parts = message[1:].split(maxsplit=1)
        command = parts[0]
        remaining_message = parts[1] if len(parts) > 1 else ""

        agent_name = self.get_agent_by_command(command)
        return agent_name, remaining_message


# Create an instance to act as a singleton store
agent_configs = load_agent_configs()
logger.info(f"Loaded {len(agent_configs)} agents")
agent_manager_instance = AgentManager(agent_configs)
