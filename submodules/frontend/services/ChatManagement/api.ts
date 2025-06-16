import { ChatMessage, UserMessage } from "@/services/types";
import { DEFAULT_CONVERSATION_ID } from "@/services/LocalStorage/config";
import { getMessagesHistory } from "@/services/ChatManagement/storage";
import { addMessageToHistory } from "@/services/ChatManagement/messages";
import { getOrCreateConversation } from "@/services/ChatManagement/storage";
import { getStorageData } from "../LocalStorage/core";
import { saveStorageData } from "../LocalStorage/core";
import { trackEvent, trackError, trackTiming } from "@/services/analytics";

// LocalStorage key for selected agents
const SELECTED_AGENTS_KEY = "selectedAgents";

/**
 * Send a message to the backend API and handle the response
 */
export const writeMessage = async (
  message: string,
  backendClient: any,
  chainId: number,
  address: string,
  conversationId: string = DEFAULT_CONVERSATION_ID,
  useResearch: boolean = false
): Promise<ChatMessage[]> => {
  const convId = getOrCreateConversation(conversationId);
  const currentHistory = getMessagesHistory(convId);

  const newMessage: UserMessage = {
    role: "user",
    content: message,
    timestamp: Date.now(),
  };

  // Add user message to local storage
  addMessageToHistory(newMessage, convId);

  // Get selected agents from localStorage
  let selectedAgents: string[] = [];
  try {
    const savedAgents = localStorage.getItem(SELECTED_AGENTS_KEY);
    if (savedAgents) {
      selectedAgents = JSON.parse(savedAgents);
    }
  } catch (err) {
    console.error("Error loading selected agents from localStorage:", err);
  }

  // Track message sent event
  trackEvent('agent.message_sent', {
    conversationId,
    selectedAgents,
    researchMode: useResearch,
    messageLength: message.length,
  });

  const startTime = Date.now();

  try {
    // Send message along with conversation history to backend
    const response = await backendClient.post("/api/v1/chat", {
      prompt: {
        role: "user",
        content: message,
      },
      chat_history: currentHistory,
      chain_id: String(chainId),
      wallet_address: address,
      use_research: useResearch,
      selected_agents: selectedAgents,
    });

    // Process response
    if (response.data) {
      // Extract the assistant response from the API response
      const { response: agentResponse, current_agent } = response.data;
      
      // Create a proper ChatMessage from the agent response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: agentResponse.content,
        agentName: current_agent,
        error_message: agentResponse.error_message,
        metadata: agentResponse.metadata,
        requires_action: agentResponse.requires_action,
        action_type: agentResponse.action_type,
        timestamp: Date.now(),
      };
      
      // Add assistant's response to local storage
      addMessageToHistory(assistantMessage, convId);
      
      // Track response received event
      trackEvent('agent.response_received', {
        conversationId,
        agentName: current_agent,
        hasError: !!agentResponse.error_message,
        requiresAction: !!agentResponse.requires_action,
        actionType: agentResponse.action_type,
      });
      
      // Track response timing
      trackTiming('agent.response_received', startTime, {
        agentName: current_agent,
        researchMode: useResearch,
      });
    }

    // Return the updated messages after API response is processed
    return getMessagesHistory(convId);
  } catch (error) {
    console.error("Failed to send message:", error);
    
    // Track error event
    trackError('chat.api.writeMessage', error as Error, {
      conversationId,
      selectedAgents,
      researchMode: useResearch,
    });
    
    throw error;
  }
};

/**
 * Upload a file to the chat API
 * Note: This is a placeholder function - implement according to your API
 */
export const uploadFile = async (
  file: File,
  backendClient: any,
  conversationId: string = DEFAULT_CONVERSATION_ID
): Promise<ChatMessage[]> => {
  const convId = getOrCreateConversation(conversationId);

  try {
    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    // Track file upload start
    trackEvent('file.upload_started', {
      conversationId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    
    const uploadStartTime = Date.now();

    // Upload file to backend
    const response = await backendClient.post("/rag/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Process response
    if (response.data) {
      // Add system message about file upload
      addMessageToHistory(
        {
          role: "user",
          content: `Uploaded file: ${file.name}`,
          timestamp: Date.now(),
        },
        convId
      );

      // Add assistant's response
      addMessageToHistory(response.data, convId);
      
      // Track successful upload
      trackTiming('file.upload_completed', uploadStartTime, {
        conversationId,
        fileName: file.name,
        fileSize: file.size,
      });
    }

    return getMessagesHistory(convId);
  } catch (error) {
    console.error("Failed to upload file:", error);
    
    // Track upload error
    trackError('file.upload', error as Error, {
      conversationId,
      fileName: file.name,
      fileSize: file.size,
    });
    
    throw error;
  }
};

/**
 * Generate a title for a conversation based on chat history
 * @param messages Array of chat messages to generate title from
 * @param backendClient Axios client instance
 * @param conversationId Optional conversation ID
 * @returns Generated title string
 */
export const generateConversationTitle = async (
  messages: ChatMessage[],
  backendClient: any,
  conversationId: string = DEFAULT_CONVERSATION_ID
): Promise<string> => {
  try {
    const response = await backendClient.post("/api/v1/generate-title", {
      chat_history: messages,
      conversation_id: conversationId,
    });

    if (response.data && response.data.title) {
      const data = getStorageData();
      data.conversations[conversationId].name = response.data.title;
      saveStorageData(data);

      return response.data.title;
    }

    throw new Error("No title returned from API");
  } catch (error) {
    console.error("Failed to generate conversation title:", error);
    throw error;
  }
};

/**
 * Interface for streaming progress events
 */
export interface StreamingEvent {
  type: string;
  timestamp: string;
  data: {
    message?: string;
    subtask?: string;
    output?: string;
    agents?: string[];
    task?: string;
    agent?: string;
    final_answer?: string;
    processing_time?: number;
    token_usage?: {
      prompt?: number;
      response?: number;
      total?: number;
    };
    current_agent_index?: number;
    total_agents?: number;
  };
}

/**
 * Send a message with streaming support for research mode
 */
export const writeMessageStream = async (
  message: string,
  backendClient: any,
  chainId: number,
  address: string,
  conversationId: string = DEFAULT_CONVERSATION_ID,
  onEvent: (event: StreamingEvent) => void,
  onComplete: (response: ChatMessage) => void,
  onError: (error: Error) => void
): Promise<void> => {
  const convId = getOrCreateConversation(conversationId);
  const currentHistory = getMessagesHistory(convId);

  const newMessage: UserMessage = {
    role: "user",
    content: message,
    timestamp: Date.now(),
  };

  // Add user message to local storage
  addMessageToHistory(newMessage, convId);

  // Get selected agents from localStorage
  let selectedAgents: string[] = [];
  try {
    const savedAgents = localStorage.getItem(SELECTED_AGENTS_KEY);
    if (savedAgents) {
      selectedAgents = JSON.parse(savedAgents);
    }
  } catch (err) {
    console.error("Error loading selected agents from localStorage:", err);
  }

  // Track research initiated event
  trackEvent('research.initiated', {
    conversationId,
    selectedAgents,
    messageLength: message.length,
  });

  const startTime = Date.now();

  const baseUrl = backendClient.defaults.baseURL || "";
  console.log("Starting stream request to:", `${baseUrl}/api/v1/chat/stream`);

  // Use fetch with proper streaming support
  try {
    const response = await fetch(`${baseUrl}/api/v1/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: {
          role: "user",
          content: message,
        },
        chat_history: currentHistory,
        chain_id: String(chainId),
        wallet_address: address,
        use_research: true,
        selected_agents: selectedAgents,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let finalAnswer: string | null = null;
    let subtaskOutputs: any[] = [];
    let contributingAgents: string[] = [];
    let finalAnswerActions: any[] = [];
    let globalTelemetry = {
      total_processing_time: 0,
      total_token_usage: {
        prompt: 0,
        response: 0,
        total: 0,
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === "") continue;

        // Skip event lines - we only care about data lines
        if (trimmedLine.startsWith("event:")) {
          continue;
        }

        if (trimmedLine.startsWith("data:")) {
          const data = trimmedLine.slice(5).trim();
          if (!data) continue;

          console.log("Raw data line:", trimmedLine);
          console.log("Parsed data:", data);

          try {
            // Handle case where data: prefix might be included in the JSON
            let jsonStr = data;

            // First remove any leading "data:" prefix
            if (data.startsWith("data:")) {
              jsonStr = data.slice(5).trim();
            }

            // Check if it's an event type line instead of JSON
            if (jsonStr.startsWith("event:")) {
              // Extract the event type
              const eventType = jsonStr.slice(6).trim();
              // Create a synthetic event object for UI
              const syntheticEvent = {
                type: eventType,
                timestamp: new Date().toISOString(),
                data: {
                  message: `Event: ${eventType}`,
                },
              };
              onEvent(syntheticEvent);
              continue;
            }

            const event = JSON.parse(jsonStr);
            console.log("Parsed event:", event);
            onEvent(event);
            
            // Track streaming progress
            if (event.type === 'subtask_dispatch') {
              trackEvent('research.agent_progress', {
                conversationId,
                agentName: event.data.agent,
                subtask: event.data.subtask,
                totalAgents: event.data.total_agents,
                currentAgentIndex: event.data.current_agent_index,
              });
            }

            // Handle specific event types
            switch (event.type) {
              case "synthesis_complete":
                finalAnswer = event.data.final_answer;
                // Check if final_answer_actions are present in synthesis_complete event
                if (event.data.final_answer_actions && event.data.final_answer_actions.length > 0) {
                  console.log("Final answer actions detected in synthesis_complete:", event.data.final_answer_actions);
                  // Save final_answer_actions for later use in the assistantMessage
                  finalAnswerActions = event.data.final_answer_actions;
                }
                break;
              case "final_answer_actions":
                console.log("Final answer actions event received:", event.data.actions);
                // Save final_answer_actions for later use in the assistantMessage
                finalAnswerActions = event.data.actions;
                break;
              case "subtask_dispatch":
              case "subtask_result":
                // Extract telemetry from event data
                let telemetry = undefined;
                if (event.data.telemetry) {
                  console.log("Raw telemetry from event:", JSON.stringify(event.data.telemetry, null, 2));
                  telemetry = event.data.telemetry;
                  
                  // Accumulate global telemetry
                  if (event.data.telemetry.processing_time?.duration) {
                    globalTelemetry.total_processing_time += event.data.telemetry.processing_time.duration;
                  }
                  
                  if (event.data.telemetry.token_usage) {
                    const usage = event.data.telemetry.token_usage;
                    globalTelemetry.total_token_usage.prompt += usage.prompt_tokens || 0;
                    globalTelemetry.total_token_usage.response += usage.completion_tokens || 0;
                    globalTelemetry.total_token_usage.total += usage.total_tokens || 0;
                  }
                  console.log("Accumulated global telemetry:", JSON.stringify(globalTelemetry, null, 2));
                }
                
                // Collect subtask outputs with proper telemetry format
                const subtaskOutput: any = {
                  subtask: event.data.subtask,
                  output: event.data.output || "",
                  agents: event.data.agents || [],
                };
                
                // Add properly formatted telemetry
                if (telemetry) {
                  subtaskOutput.telemetry = {
                    processing_time: telemetry.processing_time,
                    token_usage: telemetry.token_usage,
                  };
                }
                
                // Check if we already have this subtask
                const existingIndex = subtaskOutputs.findIndex(
                  s => s.subtask === subtaskOutput.subtask
                );
                
                if (existingIndex >= 0) {
                  // Update existing subtask
                  subtaskOutputs[existingIndex] = {
                    ...subtaskOutputs[existingIndex],
                    ...subtaskOutput,
                    output: subtaskOutput.output || subtaskOutputs[existingIndex].output,
                  };
                } else {
                  // Add new subtask
                  subtaskOutputs.push(subtaskOutput);
                }
                
                // Collect contributing agents
                if (event.data.agents) {
                  event.data.agents.forEach((agent: string) => {
                    if (!contributingAgents.includes(agent)) {
                      contributingAgents.push(agent);
                    }
                  });
                }
                break;
              case "synthesis_complete":
                finalAnswer = event.data.final_answer;
                break;
              case "stream_complete":
                // Create final assistant message with metadata including telemetry
                const metadata: any = {
                  collaboration: "orchestrated",
                  contributing_agents: contributingAgents,
                  subtask_outputs: subtaskOutputs,
                  // Add global telemetry in the format CrewResponseMessage expects
                  token_usage: globalTelemetry.total_token_usage.total > 0 ? {
                    total_tokens: globalTelemetry.total_token_usage.total,
                    prompt_tokens: globalTelemetry.total_token_usage.prompt,
                    completion_tokens: globalTelemetry.total_token_usage.response,
                  } : undefined,
                  processing_time: globalTelemetry.total_processing_time > 0 ? {
                    duration: globalTelemetry.total_processing_time,
                  } : undefined,
                };
                
                // Add final_answer_actions if present in the event
                if (finalAnswerActions && finalAnswerActions.length > 0) {
                  console.log("Final answer actions being added to metadata:", finalAnswerActions);
                  metadata.final_answer_actions = finalAnswerActions;
                } else if (event.data.final_answer_actions && event.data.final_answer_actions.length > 0) {
                  console.log("Final answer actions from stream_complete:", event.data.final_answer_actions);
                  metadata.final_answer_actions = event.data.final_answer_actions;
                }
                
                const assistantMessage: ChatMessage = {
                  role: "assistant",
                  content: finalAnswer || "Request completed.",
                  timestamp: Date.now(),
                  agentName: "basic_crew",
                  metadata,
                };

                // Add to history and notify completion
                addMessageToHistory(assistantMessage, convId);
                
                // Track research completed event
                trackEvent('research.completed', {
                  conversationId,
                  agentCount: contributingAgents.length,
                  subtaskCount: subtaskOutputs.length,
                  totalTokens: globalTelemetry.total_token_usage.total,
                  duration: Date.now() - startTime,
                });
                
                // Track timing
                trackTiming('research.completed', startTime, {
                  conversationId,
                  agentCount: contributingAgents.length,
                });
                
                onComplete(assistantMessage);
                return;
              case "error":
                const errorMsg = event.data.message || "Stream error";
                trackError('research.streaming', new Error(errorMsg), {
                  conversationId,
                  selectedAgents,
                });
                onError(new Error(errorMsg));
                return;
            }
          } catch (err) {
            console.error("Error parsing JSON from data:", data);
            console.error("Parse error:", err);
            // Try to create an error event for UI
            try {
              const errorEvent = {
                type: "parse_error",
                timestamp: new Date().toISOString(),
                data: {
                  message: `Failed to parse: ${data}`,
                  error: err instanceof Error ? err.message : String(err),
                },
              };
              onEvent(errorEvent);
            } catch (innerErr) {
              // Ignore if we can't even create the error event
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error("Failed to stream message:", error);
    
    // Track streaming error
    trackError('research.streaming', error, {
      conversationId,
      selectedAgents,
    });
    
    onError(error);
  }
};
