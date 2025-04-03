import time
from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import Query
from langchain.schema import AIMessage, BaseMessage, HumanMessage
from pydantic import BaseModel, Field


class ResponseType(Enum):
    """Enum to distinguish between different types of responses"""

    SUCCESS = "success"
    NEEDS_INFO = "needs_info"  # When we need more information from the user
    ERROR = "error"  # For breaking errors
    ACTION_REQUIRED = "action_required"  # For non-breaking issues that should be logged


class ChatMessage(BaseModel):
    """Enhanced chat message model that includes all agent response fields"""

    role: str
    content: str
    agentName: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    requires_action: Optional[bool] = False
    action_type: Optional[str] = None
    timestamp: Optional[float] = Field(default_factory=lambda: time.time())

    def from_agent_response(self, response: "AgentResponse", agent_name: str) -> "ChatMessage":
        """Create a ChatMessage from an AgentResponse"""
        return ChatMessage(
            role="assistant",
            content=response.content,
            agentName=agent_name,
            error_message=response.error_message,
            metadata=response.metadata,
            requires_action=response.requires_action,
            action_type=response.action_type,
        )


class ChatRequest(BaseModel):
    prompt: ChatMessage
    chain_id: str
    wallet_address: str
    conversation_id: str = Query(default="default")
    use_multiagent: bool = Query(default=False)
    chat_history: List[ChatMessage] = Field(default_factory=list)

    @property
    def messages_for_llm(self) -> List[BaseMessage]:
        """Get formatted message history for LLM, including current prompt"""
        messages: List[BaseMessage] = []

        # Add chat history messages up to the past 5 messages
        for i, msg in enumerate(reversed(self.chat_history[:5])):
            if msg.role == "user":
                messages.append(HumanMessage(content=f"Chat History index {i}: {msg.content}"))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=f"Chat History index {i}: {msg.content}"))

        # Add current prompt
        messages.append(HumanMessage(content=f"Current Prompt: {self.prompt.content}"))

        return messages


class Conversation(BaseModel):
    messages: List[ChatMessage]
    has_uploaded_file: bool = False


class AgentResponse(BaseModel):
    """Base response model for all agent responses"""

    response_type: ResponseType
    content: str
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    requires_action: Optional[bool] = False
    action_type: Optional[str] = None

    def to_chat_message(self, agent_name: str) -> ChatMessage:
        """Convert AgentResponse to ChatMessage"""
        content = self.content
        if self.error_message:
            content = f"{content} {self.error_message}"

        return ChatMessage(
            role="assistant",
            content=content,
            agentName=agent_name,
            error_message=self.error_message,
            metadata=self.metadata,
            requires_action=self.requires_action,
            action_type=self.action_type,
        )

    @classmethod
    def success(
        cls,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        action_type: Optional[str] = None,
    ) -> "AgentResponse":
        """Create a successful response"""
        return cls(
            response_type=ResponseType.SUCCESS,
            content=content,
            metadata=metadata or {},
            action_type=action_type,
        )

    @classmethod
    def error(cls, error_message: str) -> "AgentResponse":
        """Create an error response"""
        return cls(
            response_type=ResponseType.ERROR,
            content=(
                "An unexpected error occurred. "
                "Please raise this issue in Discord so developers can fix it. "
                "The error message is:"
            ),
            error_message=error_message,
        )

    @classmethod
    def needs_info(cls, content: str, metadata: Optional[Dict[str, Any]] = None) -> "AgentResponse":
        """Create a response requesting more information from user"""
        return cls(
            response_type=ResponseType.NEEDS_INFO,
            content=content,
            metadata=metadata or {},
        )

    @classmethod
    def action_required(
        cls, content: str, action_type: str, metadata: Optional[Dict[str, Any]] = None
    ) -> "AgentResponse":
        """Create a response that requires user action"""
        return cls(
            response_type=ResponseType.ACTION_REQUIRED,
            content=content,
            requires_action=True,
            action_type=action_type,
            metadata=metadata or {},
        )
