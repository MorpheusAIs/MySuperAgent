import logging
from typing import Any, Dict, List, Optional, Tuple

from langchain.schema import AIMessage, HumanMessage, SystemMessage
from src.stores import chat_manager

logger = logging.getLogger(__name__)


class Delegator:
    def __init__(self, agent_manager, llm, embeddings):
        self.agent_manager = agent_manager
        self.llm = llm  # Keep llm instance on delegator
        self.attempted_agents = set()  # Track attempted agents within a chat session

        # Load all agents via agent manager
        self.agent_manager.load_all_agents(llm, embeddings)
        logger.info(f"Delegator initialized with {len(self.agent_manager.agents)} agents")
        logger.info(f"Selected agents: {self.agent_manager.get_selected_agents()}")

    def reset_attempted_agents(self):
        """Reset the set of attempted agents"""
        self.attempted_agents = set()
        logger.info("Reset attempted agents")

    def get_available_unattempted_agents(self) -> List[Dict]:
        """Get available agents that haven't been attempted yet"""
        return [
            agent_config
            for agent_config in self.agent_manager.get_available_agents()
            if agent_config["name"] in self.agent_manager.get_selected_agents()
            and agent_config["name"] not in self.attempted_agents
            and agent_config["name"] != "default agent"  # Exclude default agent
            and not (
                agent_config["upload_required"] and not chat_manager.get_uploaded_file_status()
            )
        ]

    def get_delegator_response(self, prompt: Dict) -> Dict[str, str]:
        """Get appropriate agent based on prompt, excluding previously attempted agents"""
        logger.info(f"Selected agents: {self.agent_manager.get_selected_agents()}")
        available_agents = self.get_available_unattempted_agents()
        logger.info(f"Available, unattempted agents: {available_agents}")

        if not available_agents:
            # If no specialized agents are available, use default agent as last resort
            if "default agent" not in self.attempted_agents:
                return {"agent": "default agent"}
            raise ValueError("No remaining agents available for current state")

        system_prompt = (
            "Your name is Morpheus. "
            "Your primary function is to select the correct agent from the list of available agents based on the user's input. "
            "You MUST use the 'select_agent' function to select an agent. "
            "Available agents and their descriptions:\n"
            + "\n".join(f"- {agent['name']}: {agent['description']}" for agent in available_agents)
        )

        tools = [
            {
                "name": "select_agent",
                "description": "Choose which agent should be used to respond to the user query",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "agent": {
                            "type": "string",
                            "enum": [agent["name"] for agent in available_agents],
                            "description": "The name of the agent to be used",
                        }
                    },
                    "required": ["agent"],
                },
            }
        ]

        agent_selection_llm = self.llm.bind_tools(tools, tool_choice="select_agent")
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt["content"]),
        ]

        result = agent_selection_llm.invoke(messages)
        tool_calls = result.tool_calls

        if not tool_calls:
            raise ValueError("No agent was selected by the model")

        selected_agent = tool_calls[0]
        logger.info(f"Selected agent: {selected_agent}")
        selected_agent_name = selected_agent.get("args", {}).get("agent")

        # Track this agent as attempted
        self.attempted_agents.add(selected_agent_name)
        logger.info(
            f"Added {selected_agent_name} to attempted agents. Current attempts: {self.attempted_agents}"
        )

        return {"agent": selected_agent_name}

    def delegate_chat(self, agent_name: str, chat_request: Any) -> Tuple[Optional[str], Any]:
        """Delegate chat to specific agent with cascading fallback"""
        logger.info(f"Attempting to delegate chat to agent: {agent_name}")

        if agent_name not in self.agent_manager.get_selected_agents():
            logger.warning(f"Attempted to delegate to unselected agent: {agent_name}")
            return self._try_next_agent(chat_request)

        agent = self.agent_manager.get_agent(agent_name)
        if not agent:
            logger.error(f"Agent {agent_name} is selected but not loaded")
            return self._try_next_agent(chat_request)

        try:
            result = agent.chat(chat_request)
            logger.info(f"Chat delegation to {agent_name} completed successfully")
            return agent_name, result
        except Exception as e:
            logger.error(f"Error during chat delegation to {agent_name}: {str(e)}")
            return self._try_next_agent(chat_request)

    def _try_next_agent(self, chat_request: Any) -> Tuple[Optional[str], Any]:
        """Try to get a response from the next best available agent"""
        try:
            # Get next best agent
            result = self.get_delegator_response(chat_request.prompt.dict())

            if "agent" not in result:
                return None, {"error": "No suitable agent found"}

            next_agent = result["agent"]
            logger.info(f"Cascading to next agent: {next_agent}")

            return self.delegate_chat(next_agent, chat_request)
        except ValueError as ve:
            # No more agents available
            logger.error(f"No more agents available: {str(ve)}")
            return None, {"error": "All available agents have been attempted without success"}
