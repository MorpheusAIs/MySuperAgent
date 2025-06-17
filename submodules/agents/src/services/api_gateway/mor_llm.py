"""
MOR API Custom LLM Implementation for CrewAI

This module provides a custom LLM implementation for the MOR API that follows
the CrewAI BaseLLM pattern, allowing integration with the MySuperAgent platform.
"""

from typing import Any, Dict, List, Optional, Union
import json
import requests
from crewai import BaseLLM


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
        response_format: Optional[Any] = None
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
            tools: Optional list of tool definitions (not supported by MOR API currently)
            callbacks: Optional callbacks (not used in this implementation)
            available_functions: Optional function definitions (not supported currently)
            
        Returns:
            String response from the LLM
            
        Raises:
            TimeoutError: If the request times out
            RuntimeError: If the API request fails
            ValueError: If the response format is invalid
        """
        # Convert string to message format if needed
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]
        
        # Handle structured output by modifying the prompt
        if self.response_format and hasattr(self.response_format, 'model_json_schema'):
            # Add JSON schema instruction to the last user message
            schema = self.response_format.model_json_schema()
            json_instruction = (
                f"\n\nIMPORTANT: You must respond with valid JSON that matches this exact schema:\n"
                f"{schema}\n"
                f"Do not include any text before or after the JSON. Only return the JSON object."
            )
            
            # Find the last user message and append the instruction
            for i in range(len(messages) - 1, -1, -1):
                if messages[i].get("role") == "user":
                    messages[i]["content"] += json_instruction
                    break
        
        # Prepare request payload with careful parameter handling
        payload = {
            "model": self.model if self.model != "default" else "LMR-ClaudeAI-Sonnet",
            "messages": messages,
        }
        
        # Only add temperature if it's a valid value
        if self.temperature is not None and 0.0 <= self.temperature <= 2.0:
            payload["temperature"] = self.temperature
        
        # Add tools if provided and supported
        if tools and self.supports_function_calling():
            payload["tools"] = tools
        
        try:
            # Debug logging
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"🔥 USING MOR LLM - Model: {self.model}")
            logger.info(f"MOR API Request payload: {payload}")
            logger.info(f"MOR API Endpoint: {self.endpoint}")
            
            # Make API call
            response = requests.post(
                self.endpoint,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=self.timeout
            )
            
            # Debug response on failure
            if not response.ok:
                logger.error(f"MOR API Error Response: {response.status_code} - {response.text}")
            
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            # Extract message from response
            message = result["choices"][0]["message"]
            
            # Check if there are tool calls (function calling)
            if "tool_calls" in message and available_functions:
                return self._handle_function_calls(
                    message["tool_calls"], messages, tools, available_functions
                )
            
            # Extract content from response
            content = message.get("content", "")
            
            # Handle stop words if they exist
            if hasattr(self, 'stop') and self.stop:
                for stop_word in self.stop:
                    if stop_word in content:
                        content = content.split(stop_word)[0]
                        break
            
            # Handle structured output
            if self.response_format and hasattr(self.response_format, 'model_validate_json'):
                try:
                    # Try to parse as JSON and validate against the schema
                    return self.response_format.model_validate_json(content)
                except Exception as e:
                    # If parsing fails, try to extract JSON from the content
                    try:
                        import re
                        json_match = re.search(r'\{.*\}', content, re.DOTALL)
                        if json_match:
                            return self.response_format.model_validate_json(json_match.group())
                    except Exception:
                        pass
                    # If all else fails, return the raw content
                    logger.warning(f"Failed to parse structured output: {e}")
                    return content
            
            return content
            
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
        available_functions: Dict[str, Any]
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
                    messages.append({
                        "role": "assistant",
                        "content": None,
                        "tool_calls": [tool_call]
                    })
                    
                    # Add function result to message history
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "name": function_name,
                        "content": str(function_result)
                    })
                    
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