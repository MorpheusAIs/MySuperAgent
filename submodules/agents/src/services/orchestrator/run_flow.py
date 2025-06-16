import logging
from typing import Any, Dict, Tuple

from config import LLM_AGENT
from models.service.chat_models import AgentResponse, ChatRequest
from services.orchestrator.helpers.error_handler import safe_orchestration_response

# ------------------------------------------------------------
# 1.  Import flow + registry
from services.orchestrator.orchestration_flow import OrchestrationFlow
from services.orchestrator.registry.agent_bootstrap import bootstrap_agents

logger = logging.getLogger(__name__)


# -------------------------------------------------------------------
# STEP 2 – Run the orchestration (async)
# -------------------------------------------------------------------
async def run_orchestration(chat_request: ChatRequest) -> Tuple[str, AgentResponse]:
    try:
        logger.info(f"Starting orchestration flow for prompt: {chat_request.prompt.content[:100]}...")

        # 2a) initialize tools and agents (only registers if not already registered)
        bootstrap_agents(LLM_AGENT)

        # 2b) instantiate the flow with request_id and selected model if available
        flow = OrchestrationFlow(
            request_id=chat_request.request_id,
            user_selected_model=chat_request.selected_model
        )

        # 2c) kick off 🚀

        # Include ALL chat history - the summarization step will handle token reduction intelligently
        full_history = chat_request.chat_history if chat_request.chat_history else []

        logger.info(f"Chat history length: {len(full_history)}")

        try:
            final_answer: Dict[str, Any] = await flow.kickoff_async(
                inputs={
                    "chat_prompt": chat_request.prompt.content,
                    "chat_history": [m.content for m in full_history],
                }
            )

            logger.info("Flow completed successfully")

            # Wrap the final answer in an AgentResponse, and include metadata
            return "basic_crew", AgentResponse.success(
                content=final_answer.get("final_answer", "Your request has been processed."),
                metadata={
                    "subtask_outputs": final_answer.get("subtask_outputs", []),
                },
            )
        except Exception as flow_error:
            logger.error(f"Error during flow execution: {str(flow_error)}")
            logger.error(f"Flow error type: {type(flow_error)}")
            import traceback

            logger.error(f"Stack trace: {traceback.format_exc()}")
            raise

    except Exception as e:
        logger.error(f"Error in run_orchestration: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback

        logger.error(f"Stack trace: {traceback.format_exc()}")

        # Return a safe response with error handling
        return "basic_crew", safe_orchestration_response(error=e, content=None, metadata={"error_message": str(e)})
