# --------------------------------------------------------------------- #
# pydantic models for flow state & LLM tool schemas
# --------------------------------------------------------------------- #

from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel

from .actions import FinalAnswerAction


class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cached_prompt_tokens: int = 0

    class Config:
        # Ensure proper type coercion
        arbitrary_types_allowed = False


class ProcessingTime(BaseModel):
    start_time: float = 0
    end_time: float = 0
    duration: float = 0

    class Config:
        # Ensure proper type coercion
        arbitrary_types_allowed = False


class Telemetry(BaseModel):
    token_usage: TokenUsage = TokenUsage()
    processing_time: ProcessingTime = ProcessingTime()

    class Config:
        # Ensure proper type coercion
        arbitrary_types_allowed = False


class SubtaskOutput(BaseModel):
    subtask: str = ""
    output: str = ""
    agents: List[str] = []
    telemetry: Telemetry = Telemetry()

    class Config:
        # Ensure proper type coercion
        arbitrary_types_allowed = False


class SubtaskPlan(BaseModel):
    subtasks: List[str]


class Assignment(BaseModel):
    subtask: str
    agents: List[str]


class AssignmentPlan(BaseModel):
    assignments: List[Assignment]


class OrchestrationState(BaseModel):
    chat_prompt: str = ""
    chat_history: List[str] = []
    chat_history_summary: str = ""
    subtasks: List[str] = []
    assignments: List[Assignment] = []
    subtask_outputs: List[SubtaskOutput] = []
    final_answer: str | None = None
    final_answer_actions: List[FinalAnswerAction] = []