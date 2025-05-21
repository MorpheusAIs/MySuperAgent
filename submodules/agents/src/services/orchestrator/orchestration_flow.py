"""
CrewAI Flow that:
1. Summarises recent chat.
2. Lets an LLM break the user prompt into sub‑tasks (structured output).
3. Lets the same LLM map each sub‑task to the best agent (structured output).
4. Runs sub‑crews sequentially, feeding context from previous subtasks into subsequent ones.
5. Synthesises the final answer.
"""

from __future__ import annotations

import logging
from asyncio import TimeoutError, wait_for
from typing import Any, Dict, List, Optional

from config import LLM_DELEGATOR
from crewai import LLM, Crew, Process, Task
from crewai.flow.flow import Flow, listen, start
from services.secrets import get_secret

from .actions.handler import extract_final_answer_actions
from .helpers.context_optimization import optimize_context_block
from .helpers.context_utils import create_focused_task_description, summarize_previous_outputs, truncate_text
from .helpers.retry_utils import retry_with_backoff
from .helpers.utils import parse_llm_structured_output
from .orchestration_state import (
    Assignment,
    AssignmentPlan,
    OrchestrationState,
    ProcessingTime,
    SubtaskOutput,
    SubtaskPlan,
    Telemetry,
    TokenUsage,
)
from .progress_listener import (
    emit_final_answer_actions,
    emit_final_complete,
    emit_flow_end,
    emit_flow_start,
    emit_subtask_dispatch,
    emit_subtask_result,
    emit_synthesis_complete,
    emit_synthesis_start,
)
from .registry.agent_registry import AgentRegistry

logger = logging.getLogger(__name__)

# Constants to control execution flow
MAX_SUBTASKS = 5  # Keep original limit for complex tasks
SUBTASK_TIMEOUT = 180  # Maximum time (seconds) to wait for a subtask to complete
DEFAULT_TASK_OUTPUT = "Unable to complete this task within the allowed constraints."


# --------------------------------------------------------------------- #
# Flow implementation
# --------------------------------------------------------------------- #
class OrchestrationFlow(Flow[OrchestrationState]):
    def __init__(self, standard_model: str = "gemini/gemini-2.5-flash-preview-04-17", request_id: Optional[str] = None):
        super().__init__()
        self.request_id = request_id
        self.standard_model = standard_model
        self.standard_model_api_key = get_secret("GeminiApiKey")

        # Use a more efficient model for simple tasks
        self.efficient_model = "gemini/gemini-1.5-flash"

    # 1️⃣  Summarise recent chat -----------------------------------------
    @start()
    async def initialise(self) -> None:
        print(f"Initialising flow with state: {self.state}")

        # Emit flow start event if streaming
        if self.request_id:
            await emit_flow_start(self.request_id)

        chat_prompt = self.state.chat_prompt
        chat_history = self.state.chat_history
        self.state.chat_prompt = chat_prompt

        # Only summarize chat history that's relevant to the current prompt
        history_text = "\n".join(chat_history)
        if history_text:
            llm = LLM(model=self.efficient_model, api_key=self.standard_model_api_key)

            @retry_with_backoff(max_attempts=3, base_delay=1.0, exceptions=(Exception,))
            def summarize_chat():
                return llm.call(
                    "Review the conversation history and extract ONLY information that is relevant "
                    "to answering this current prompt/request. If no information is relevant, return "
                    "an empty string. Do not include irrelevant context.\n\n"
                    f"Current prompt: {chat_prompt}\n\n"
                    f"Conversation history:\n{history_text}"
                )

            try:
                resp = summarize_chat()
                self.state.chat_history_summary = resp.strip()
            except Exception as e:
                logger.error(f"Failed to summarize chat history: {e}")
                self.state.chat_history_summary = ""  # Fallback to empty summary
        else:
            self.state.chat_history_summary = ""

    # 2️⃣  Sub‑task planning (LLM function‑call, structured) -------------
    @listen(initialise)
    def create_subtasks(self):
        # Curate the full prompt, with
        prompt = (
            "Break this goal into minimal essential subtasks (1-3 preferred, max 4). "
            "At the end, we will synthesize the results from the subtasks into a final answer. "
            "So, don't include subtasks that are summarization or post-processing related to synthesis. "
            "Each subtask should be specific, actionable, and necessary. "
            "Avoid redundancy - each subtask should have a distinct purpose. "
            "The subtasks should directly address the core goal - do not be distracted by context. "
            "Return ONLY valid JSON.\n"
            f"Goal: {self.state.chat_prompt}"
        )

        # Only add chat summary if it's meaningful
        if self.state.chat_history_summary:
            prompt += (
                "\nNote: Below is a summary of relevant details from prior chat history. "
                "Use these details only if they provide specific information needed to complete subtasks. "
                "Do not create subtasks just to incorporate this context - focus on the core goal.\n"
                f"Relevant chat details: {self.state.chat_history_summary}"
            )

        # Use FULL MODEL for critical subtask planning - this is too important to use an efficient model, and
        # is not limited by retrieval, but rather by latent reasoning capability.
        llm = LLM(model=self.standard_model, response_format=SubtaskPlan, api_key=self.standard_model_api_key)

        @retry_with_backoff(max_attempts=3, base_delay=1.0, exceptions=(Exception,))
        def create_subtask_plan():
            return llm.call(prompt)

        try:
            plan_response = create_subtask_plan()
            plan = parse_llm_structured_output(plan_response, SubtaskPlan, logger, "SubtaskPlan")

            # Limit number of subtasks as a precaution to prevent too much complexity,
            # sometimes the subtask plan forgets that we synthesize separately.
            if plan and plan.subtasks and len(plan.subtasks) > MAX_SUBTASKS:
                plan.subtasks = plan.subtasks[:MAX_SUBTASKS]

            self.state.subtasks = plan.subtasks if plan and plan.subtasks else []
        except Exception as e:
            logger.error(f"Failed to create subtask plan: {e}")
            # Fallback to a single generic subtask
            self.state.subtasks = ["Complete the user's request"]

    # 3️⃣  Agent assignment (LLM decides, structured) --------------------
    @listen(create_subtasks)
    def assign_agents(self):
        agent_descriptions = AgentRegistry.llm_choice_payload()
        prompt = (
            "Select 1-4 best agents per subtask. "
            "Match agent expertise to task requirements. "
            "Prefer specialized agents over generalists. "
            "Return ONLY valid JSON.\n"
            f"Agents:\n{agent_descriptions}\n"
            f"Subtasks: {self.state.subtasks}"
        )
        # Use FULL MODEL for critical agent assignment - this is too important to use efficient model
        llm = LLM(model=self.standard_model, response_format=AssignmentPlan, api_key=self.standard_model_api_key)

        @retry_with_backoff(max_attempts=3, base_delay=1.0, exceptions=(Exception,))
        def assign_agents_to_tasks():
            return llm.call(prompt)

        try:
            mapping_response = assign_agents_to_tasks()
            mapping = parse_llm_structured_output(mapping_response, AssignmentPlan, logger, "AssignmentPlan")

            if mapping and mapping.assignments:
                self.state.assignments = mapping.assignments
            else:
                # Fallback: assign default agent to each subtask
                self.state.assignments = [
                    Assignment(subtask=subtask, agents=["default"]) for subtask in self.state.subtasks
                ]
        except Exception as e:
            logger.error(f"Failed to assign agents: {e}")
            # Fallback to default agent for all subtasks
            self.state.assignments = [
                Assignment(subtask=subtask, agents=["default"]) for subtask in self.state.subtasks
            ]

    # 4️⃣  Run each sub‑task sequentially ----------------------------------
    @listen(assign_agents)
    async def run_sub_crews(self):
        import time

        async def _execute(
            subtask: str, agents: List[str], previous_outputs: Optional[List[SubtaskOutput]] = None
        ) -> SubtaskOutput:
            # Get only necessary agents for efficiency
            crew_agents = [AgentRegistry.get(agent_name) for agent_name in agents]

            # Early exit if no agents were found
            if not crew_agents:
                logger.error(f"No agents found for subtask: {subtask}")
                return SubtaskOutput(
                    subtask=subtask,
                    output="Error: No agents available to execute this task",
                    agents=agents,
                    telemetry=Telemetry(
                        processing_time=ProcessingTime(start_time=time.time(), end_time=time.time(), duration=0)
                    ),
                )

            # Create smart summary of previous work - more context for recent tasks
            previous_context = ""
            if previous_outputs:
                previous_context = (
                    summarize_previous_outputs(
                        previous_outputs,
                        max_total_context=10000,  # Increased for better flow
                    )
                    + "\n"
                )

            # Create focused task description with proper context
            enhanced_subtask = create_focused_task_description(
                subtask=subtask,
                chat_prompt=self.state.chat_prompt,
                chat_summary=self.state.chat_history_summary,
                previous_context=previous_context,
                max_total_length=1500,
            )

            # Track processing time
            start_time = time.time()

            crew = Crew(
                agents=crew_agents,
                tasks=[
                    Task(
                        description=enhanced_subtask,
                        expected_output="Clear, complete answer to the specific task",
                        agent=crew_agents[0],
                    )
                ],
                process=Process.sequential,
                manager_llm=LLM_DELEGATOR,
                verbose=False,
            )

            try:
                # Add timeout to prevent hanging tasks
                result = await wait_for(crew.kickoff_async(), timeout=SUBTASK_TIMEOUT)

                end_time = time.time()

                # Extract token usage if available
                token_usage = TokenUsage()
                if result.token_usage:
                    token_usage = TokenUsage(
                        total_tokens=result.token_usage.total_tokens or 0,
                        prompt_tokens=result.token_usage.prompt_tokens or 0,
                        completion_tokens=result.token_usage.completion_tokens or 0,
                        cached_prompt_tokens=result.token_usage.cached_prompt_tokens or 0,
                    )

                # Create processing time tracking
                processing_time = ProcessingTime(
                    start_time=start_time, end_time=end_time, duration=end_time - start_time
                )

                # Create telemetry object
                telemetry = Telemetry(token_usage=token_usage, processing_time=processing_time)

                # Safely extract output string
                output_str = ""
                try:
                    output_str = str(result.raw)

                    # Check for iteration limits
                    if output_str and ("Maximum iterations reached" in output_str or "iteration limit" in output_str):
                        logger.warning(f"Task hit iteration limit: {subtask}")
                        output_str = truncate_text(output_str, 500)
                except Exception as e:
                    logger.error(f"Error extracting result for subtask '{subtask}': {e}")
                    output_str = "Task completed but output could not be extracted properly"

                # Return structured output
                return SubtaskOutput(
                    subtask=subtask,
                    output=output_str,
                    agents=agents,
                    telemetry=telemetry,
                )

            except TimeoutError:
                # Handle timeout
                end_time = time.time()
                processing_time = ProcessingTime(
                    start_time=start_time, end_time=end_time, duration=end_time - start_time
                )
                telemetry = Telemetry(processing_time=processing_time)

                logger.warning(f"Task timed out: {subtask}")
                return SubtaskOutput(
                    subtask=subtask,
                    output=f"Task timed out. {DEFAULT_TASK_OUTPUT}",
                    agents=agents,
                    telemetry=telemetry,
                )

            except Exception as e:
                # Handle any other exceptions
                end_time = time.time()
                processing_time = ProcessingTime(
                    start_time=start_time, end_time=end_time, duration=end_time - start_time
                )
                telemetry = Telemetry(processing_time=processing_time)

                logger.error(f"Error executing task '{subtask}': {str(e)}")
                return SubtaskOutput(
                    subtask=subtask,
                    output=f"Error: {str(e)[:100]}",
                    agents=agents,
                    telemetry=telemetry,
                )

        # Execute subtasks sequentially and accumulate results
        completed_outputs = []
        for assignment in self.state.assignments:
            # Emit dispatch event if streaming
            if self.request_id:
                await emit_subtask_dispatch(self.request_id, assignment.subtask, assignment.agents)

            output = await _execute(assignment.subtask, assignment.agents, completed_outputs)
            completed_outputs.append(output)

            # Emit result event if streaming with telemetry data
            if self.request_id:
                # Convert telemetry to dict format for JSON serialization
                telemetry_dict = None
                if output.telemetry:
                    telemetry_dict = {
                        "processing_time": (
                            {
                                "start_time": output.telemetry.processing_time.start_time,
                                "end_time": output.telemetry.processing_time.end_time,
                                "duration": output.telemetry.processing_time.duration,
                            }
                            if output.telemetry.processing_time
                            else None
                        ),
                        "token_usage": (
                            {
                                "total_tokens": output.telemetry.token_usage.total_tokens,
                                "prompt_tokens": output.telemetry.token_usage.prompt_tokens,
                                "completion_tokens": output.telemetry.token_usage.completion_tokens,
                                "cached_prompt_tokens": output.telemetry.token_usage.cached_prompt_tokens,
                            }
                            if output.telemetry.token_usage
                            else None
                        ),
                    }
                await emit_subtask_result(
                    self.request_id, assignment.subtask, output.output, assignment.agents, telemetry_dict
                )

        # Store outputs in state
        self.state.subtask_outputs = completed_outputs

    # 5️⃣  Synthesise final answer ---------------------------------------
    @listen(run_sub_crews)
    async def synthesise(self) -> Dict[str, Any]:
        # Emit synthesis start event if streaming
        if self.request_id:
            await emit_synthesis_start(self.request_id)

        # Create comprehensive synthesis prompt
        prompt = (
            "Synthesize these results into a clear and thorough answer that directly addresses the user's request. "
            "Ensure your response is well-structured and covers all relevant information from the results. "
            "While being comprehensive, maintain clarity by organizing key points logically. "
            "Focus on providing actionable insights and complete explanations where needed. "
            "Do not include meta-commentary or phrases like 'based on the results'. "
            "Simply provide the synthesized answer in a natural, informative way.\n\n"
            f"User request: {self.state.chat_prompt}\n\n"
            "Results:\n"
        )

        # Optimize and include context from subtask outputs
        for i, subtask_output in enumerate(self.state.subtask_outputs):
            # Use context optimization to preserve important information
            optimized_output = optimize_context_block(
                subtask_output.output,
                max_length=15000 if i < 2 else 5000,  # Allow more content for first outputs
                preserve_start=500,  # Preserve more context from start
                preserve_end=300,  # Preserve key conclusions at end
            )

            # Include subtask details and agent information
            agent_info = f"[Executed by: {', '.join(subtask_output.agents)}]" if subtask_output.agents else ""
            prompt += f"\n{i+1}. Task: {subtask_output.subtask}\n{agent_info}\nOutput:\n{optimized_output}\n"

        llm = LLM(model=self.standard_model, api_key=self.standard_model_api_key)

        @retry_with_backoff(max_attempts=3, base_delay=1.0, exceptions=(Exception,))
        def synthesize_final_answer():
            return llm.call(prompt)

        try:
            resp = synthesize_final_answer()
            self.state.final_answer = resp.strip()

            # Identify and extract potential final answer actions
            self.state.final_answer_actions = await extract_final_answer_actions(
                chat_prompt=self.state.chat_prompt,
                final_answer=self.state.final_answer,
                standard_model=self.standard_model,
                efficient_model=self.efficient_model,
                standard_model_api_key=self.standard_model_api_key
            )

        except Exception as e:
            logger.error(f"Failed to synthesize final answer: {e}")
            # Fallback: concatenate subtask outputs
            self.state.final_answer = "\n\n".join(
                f"{i+1}. {output.subtask}\n{output.output}" for i, output in enumerate(self.state.subtask_outputs)
            )
            self.state.final_answer_actions = []

        # Emit synthesis complete, final answer actions, and final complete events if streaming
        if self.request_id:
            await emit_synthesis_complete(self.request_id, self.state.final_answer, self.state.final_answer_actions)

            # Emit final answer actions if any were identified
            if self.state.final_answer_actions:
                await emit_final_answer_actions(self.request_id, self.state.final_answer_actions)

            await emit_flow_end(self.request_id)
            await emit_final_complete(self.request_id, self.state.final_answer_actions)

        return {
            "final_answer": self.state.final_answer,
            "subtask_outputs": self.state.subtask_outputs,
            "final_answer_actions": self.state.final_answer_actions,
        }