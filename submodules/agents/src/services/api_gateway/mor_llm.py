"""
MOR API Custom LLM Implementation for CrewAI

This module provides a custom LLM implementation for the MOR API that follows
the CrewAI BaseLLM pattern, allowing integration with the MySuperAgent platform.
"""

import json
import logging
from typing import Any, Dict, List, Optional, Union

import requests
from crewai import BaseLLM

logger = logging.getLogger(__name__)


class MORLLM(BaseLLM):
    """
    Custom LLM implementation for MOR API integration with CrewAI.

    This class provides a wrapper around the MOR API (https://api.mor.org) that
    follows the CrewAI BaseLLM interface, enabling seamless integration with
    the MySuperAgent orchestration system.
    """

    def __init__(
        self,
        model: str = "default",
        api_key: str = "sk-MOC63G.ac75f74343013115d31781f641857db2282ee62f90abe6cee7ab4ae0da82fae6",
        endpoint: str = "https://api.mor.org/api/v1/chat/completions",
        temperature: Optional[float] = 0.7,
        timeout: int = 30,
        response_format: Optional[Any] = None,
    ):
        """
        Initialize the MOR LLM.

        Args:
            model: The model name to use (default: "default")
            api_key: API key for authentication
            endpoint: API endpoint URL
            temperature: Sampling temperature (0.0 to 1.0)
            timeout: Request timeout in seconds
            response_format: Pydantic model for structured output
        """
        # REQUIRED: Call parent constructor with model and temperature
        super().__init__(model=model, temperature=temperature)

        self.api_key = api_key
        self.endpoint = endpoint
        self.timeout = timeout
        self.response_format = response_format

    def _prepare_messages(self, messages: Union[str, List[Dict[str, str]]]) -> List[Dict[str, str]]:
        """Prepare messages for API call."""
        if isinstance(messages, str):
            return [{"role": "user", "content": messages}]

        if self.response_format and hasattr(self.response_format, "model_json_schema"):
            schema = self.response_format.model_json_schema()
            json_instruction = (
                f"\n\nIMPORTANT: You must respond with valid JSON that matches this exact schema:\n"
                f"{schema}\n"
                f"Do not include any text before or after the JSON. Only return the JSON object."
            )

            for i in range(len(messages) - 1, -1, -1):
                if messages[i].get("role") == "user":
                    messages[i]["content"] += json_instruction
                    break

        return messages

    def _prepare_payload(self, messages: List[Dict[str, str]], tools: Optional[List[dict]] = None) -> Dict[str, Any]:
        """Prepare API request payload."""
        payload = {
            "model": self.model if self.model != "default" else "LMR-ClaudeAI-Sonnet",
            "messages": messages,
        }

        if self.temperature is not None and 0.0 <= self.temperature <= 2.0:
            payload["temperature"] = self.temperature

        if tools and self.supports_function_calling():
            payload["tools"] = tools

        return payload

    def _process_response(self, content: str) -> Union[str, Any]:
        """Process and format the API response."""
        if hasattr(self, "stop") and self.stop:
            for stop_word in self.stop:
                if stop_word in content:
                    content = content.split(stop_word)[0]
                    break

        if not self.response_format or not hasattr(self.response_format, "model_validate_json"):
            return content

        try:
            return self.response_format.model_validate_json(content)
        except Exception as e:
            try:
                import re
                import json

                # Try to extract JSON from markdown code blocks first
                markdown_json_match = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", content, re.DOTALL)
                if markdown_json_match:
                    json_content = markdown_json_match.group(1)
                    logger.info(f"Extracted JSON from markdown: {json_content}")

                    # Special handling for AssignmentPlan - if we get an array, wrap it
                    if hasattr(self.response_format, "__name__") and self.response_format.__name__ == "AssignmentPlan":
                        try:
                            parsed = json.loads(json_content)
                            if isinstance(parsed, list):
                                # Convert array to AssignmentPlan format
                                wrapped_json = {"assignments": parsed}
                                logger.info(f"Wrapped array for AssignmentPlan: {wrapped_json}")
                                return self.response_format.model_validate(wrapped_json)
                        except:
                            pass

                    return self.response_format.model_validate_json(json_content)

                # Fallback: try to find any JSON object or array
                json_match = re.search(r"(\{.*\}|\[.*\])", content, re.DOTALL)
                if json_match:
                    json_content = json_match.group(1)
                    logger.info(f"Extracted JSON fallback: {json_content}")

                    # Special handling for AssignmentPlan - if we get an array, wrap it
                    if hasattr(self.response_format, "__name__") and self.response_format.__name__ == "AssignmentPlan":
                        try:
                            parsed = json.loads(json_content)
                            if isinstance(parsed, list):
                                # Convert array to AssignmentPlan format
                                wrapped_json = {"assignments": parsed}
                                logger.info(f"Wrapped array for AssignmentPlan: {wrapped_json}")
                                return self.response_format.model_validate(wrapped_json)
                        except:
                            pass

                    return self.response_format.model_validate_json(json_content)
            except Exception as parse_e:
                logger.warning(f"Failed to parse extracted JSON: {parse_e}")
                pass
            logger.warning(f"Failed to parse structured output: {e}")
            return content

    def call(
        self,
        messages: Union[str, List[Dict[str, str]]],
        tools: Optional[List[dict]] = None,
        callbacks: Optional[List[Any]] = None,
        available_functions: Optional[Dict[str, Any]] = None,
    ) -> Union[str, Any]:
        """
        Call the MOR LLM with the given messages.

        Args:
            messages: Either a string or list of message dicts with 'role' and 'content'
            tools: Optional list of tool definitions
            callbacks: Optional callbacks (not used)
            available_functions: Optional function definitions

        Returns:
            String response from the LLM

        Raises:
            TimeoutError: If the request times out
            RuntimeError: If the API request fails
            ValueError: If the response format is invalid
        """
        prepared_messages = self._prepare_messages(messages)
        payload = self._prepare_payload(prepared_messages, tools)

        logger.info(f"🔥 USING MOR LLM - Model: {self.model}")
        logger.info(f"MOR API Request payload: {payload}")
        logger.info(f"MOR API Endpoint: {self.endpoint}")

        try:
            response = requests.post(
                self.endpoint,
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json=payload,
                timeout=self.timeout,
            )

            if not response.ok:
                logger.error(f"MOR API Error Response: {response.status_code} - {response.text}")

            response.raise_for_status()
            result = response.json()
            message = result["choices"][0]["message"]

            if "tool_calls" in message and available_functions:
                return self._handle_function_calls(message["tool_calls"], prepared_messages, tools, available_functions)

            return self._process_response(message.get("content", ""))

        except requests.Timeout:
            raise TimeoutError(f"MOR LLM request timed out after {self.timeout} seconds")
        except requests.RequestException as e:
            raise RuntimeError(f"MOR LLM request failed: {str(e)}")
        except (KeyError, IndexError) as e:
            raise ValueError(f"Invalid MOR API response format: {str(e)}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse MOR API response as JSON: {str(e)}")

    def _handle_function_calls(
        self,
        tool_calls: List[Dict[str, Any]],
        messages: List[Dict[str, str]],
        tools: Optional[List[dict]],
        available_functions: Dict[str, Any],
    ) -> str:
        """
        Handle function calling with proper message flow.

        Args:
            tool_calls: List of tool calls from the LLM response
            messages: Current message history
            tools: Available tool definitions
            available_functions: Dictionary of callable functions

        Returns:
            Final response after function execution
        """
        for tool_call in tool_calls:
            function_name = tool_call["function"]["name"]

            if function_name in available_functions:
                try:
                    # Parse and execute function
                    function_args = json.loads(tool_call["function"]["arguments"])
                    function_result = available_functions[function_name](**function_args)

                    # Add function call to message history
                    messages.append({"role": "assistant", "content": None, "tool_calls": [tool_call]})

                    # Add function result to message history
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "name": function_name,
                            "content": str(function_result),
                        }
                    )

                    # Call LLM again with updated context
                    return self.call(messages, tools, None, available_functions)

                except (json.JSONDecodeError, KeyError, TypeError) as e:
                    # Function call failed, return error message
                    return f"Function call failed: {str(e)}"
                except Exception as e:
                    # Unexpected error during function execution
                    return f"Function execution error: {str(e)}"

        return "Function call completed but no valid functions were executed"

    def supports_function_calling(self) -> bool:
        """
        Return whether this LLM supports function calling.

        The MOR API supports function calling similar to OpenAI's format.
        """
        return True

    def supports_stop_words(self) -> bool:
        """
        Return whether this LLM supports stop sequences.

        The MOR API doesn't natively support stop words, but we handle
        them manually in the call() method, so we return False to indicate
        CrewAI should let us handle them.
        """
        return False

    def get_context_window_size(self) -> int:
        """
        Return the context window size of the MOR LLM.

        This is a conservative estimate. The actual context window may vary
        depending on the specific model being used through the MOR API.
        """
        return 8192

    def __str__(self) -> str:
        """String representation of the MOR LLM."""
        return f"MORLLM(model={self.model}, temperature={self.temperature})"

    def __repr__(self) -> str:
        """Detailed string representation of the MOR LLM."""
        return (
            f"MORLLM(model='{self.model}', temperature={self.temperature}, "
            f"endpoint='{self.endpoint}', timeout={self.timeout})"
        )
