import React, {
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useChainId, useAccount } from "wagmi";
import { ChatMessage } from "@/services/types";
import { getHttpClient } from "@/services/config/constants";
import {
  writeMessage,
  uploadFile,
  generateConversationTitle,
  writeMessageStream,
  StreamingEvent,
} from "@/services/chat-management/api";
import { getMessagesHistory } from "@/services/chat-management/storage";
import { addMessageToHistory } from "@/services/chat-management/messages";
import JobsAPI from "@/services/api/jobs";
import { useWalletAddress } from "@/services/wallet/utils";
import { Job, Message } from "@/services/database/db";
import { chatReducer, initialState } from "@/contexts/chat/ChatReducer";
import ChatContext from "@/contexts/chat/ChatContext";

interface ChatProviderProps {
  children: ReactNode;
}

// Convert database message to ChatMessage format
const convertMessageToChatMessage = (message: Message): ChatMessage => {
  return {
    id: message.id,
    role: message.role as any,
    content: message.content,
    responseType: message.response_type,
    agentName: message.agent_name,
    error_message: message.error_message,
    metadata: message.metadata,
    requires_action: message.requires_action,
    action_type: message.action_type,
    timestamp: new Date(message.created_at).getTime(),
    isStreaming: message.is_streaming,
  };
};

// Convert ChatMessage to database message format
const convertChatMessageToMessage = (chatMessage: ChatMessage, jobId: string, orderIndex: number): Omit<Message, 'id' | 'created_at'> => {
  return {
    job_id: jobId,
    role: chatMessage.role as any,
    content: chatMessage.content,
    response_type: chatMessage.responseType,
    agent_name: chatMessage.agentName,
    error_message: chatMessage.error_message,
    metadata: chatMessage.metadata || {},
    requires_action: chatMessage.requires_action || false,
    action_type: chatMessage.action_type,
    is_streaming: chatMessage.isStreaming || false,
    order_index: orderIndex,
  };
};

export const ChatProviderDB = ({ children }: ChatProviderProps) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const chainId = useChainId();
  const { address, getAddress } = useWalletAddress();

  // Track conversations that have already attempted title generation
  const titleGenerationAttempted = useRef<Set<string>>(new Set());
  // Track active title generation requests to prevent duplicates
  const pendingTitleGeneration = useRef<Set<string>>(new Set());

  // Load initial data from database
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          // No wallet connected, fall back to localStorage
          return await loadLocalStorageData();
        }
        const jobs = await JobsAPI.getJobs(walletAddress);
        
        // If no jobs exist, create a default job
        if (jobs.length === 0) {
          const defaultJob = await JobsAPI.createJob(walletAddress, {
            name: 'Default Conversation',
            initial_message: 'Hello! How can I help you today?',
            is_scheduled: false,
            has_uploaded_file: false
          });
          
          // Create initial message
          await JobsAPI.createMessage(walletAddress, defaultJob.id, {
            role: 'assistant',
            content: 'Hello! How can I help you today?',
            order_index: 0
          });
          
          jobs.push(defaultJob);
        }

        // Load messages for each job and set up state
        for (const job of jobs) {
          const messages = await JobsAPI.getMessages(walletAddress, job.id);
          const chatMessages = messages.map(convertMessageToChatMessage);
          
          dispatch({
            type: "SET_MESSAGES",
            payload: { conversationId: job.id, messages: chatMessages },
          });

          dispatch({
            type: "SET_CONVERSATION_TITLE",
            payload: { conversationId: job.id, title: job.name },
          });
        }

        // Set current conversation to the first job (most recent)
        if (jobs.length > 0) {
          dispatch({
            type: "SET_CURRENT_CONVERSATION",
            payload: jobs[0].id,
          });
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        // Fallback to localStorage if database fails
        const { getMessagesHistory } = await import("@/services/chat-management/storage");
        const { getStorageData } = await import("@/services/local-storage/core");
        
        const messages = getMessagesHistory("default");
        dispatch({
          type: "SET_MESSAGES",
          payload: { conversationId: "default", messages },
        });

        const data = getStorageData();
        Object.entries(data.conversations).forEach(([id, conversation]) => {
          dispatch({
            type: "SET_CONVERSATION_TITLE",
            payload: { conversationId: id, title: conversation.name },
          });
        });
      }
    };

    // Load data regardless of wallet connection
    loadInitialData();
  }, [address, getAddress]);

  const setCurrentConversation = useCallback((conversationId: string) => {
    dispatch({
      type: "SET_CURRENT_CONVERSATION",
      payload: conversationId,
    });
  }, []);

  const refreshMessages = useCallback(async () => {
    try {
      const walletAddress = getAddress();
      if (!walletAddress) {
        // No wallet connected, skip refresh
        return;
      }
      const jobs = await JobsAPI.getJobs(walletAddress);
      
      for (const job of jobs) {
        const messages = await JobsAPI.getMessages(walletAddress, job.id);
        const chatMessages = messages.map(convertMessageToChatMessage);
        
        dispatch({
          type: "SET_MESSAGES",
          payload: { conversationId: job.id, messages: chatMessages },
        });
      }
    } catch (error) {
      console.error("Error refreshing messages:", error);
    }
  }, [getAddress]);

  const refreshAllTitles = useCallback(async () => {
    try {
      const walletAddress = getAddress();
      if (!walletAddress) {
        // No wallet connected, skip refresh
        return;
      }
      const jobs = await JobsAPI.getJobs(walletAddress);
      
      jobs.forEach(job => {
        dispatch({
          type: "SET_CONVERSATION_TITLE",
          payload: { conversationId: job.id, title: job.name },
        });
      });
    } catch (error) {
      console.error("Error refreshing titles:", error);
    }
  }, [getAddress]);

  const deleteChat = useCallback(async (conversationId: string) => {
    try {
      const walletAddress = getAddress();
      if (!walletAddress) {
        console.error("No wallet connected - cannot delete chat");
        return;
      }
      await JobsAPI.deleteJob(walletAddress, conversationId);
      
      // Remove from state
      dispatch({
        type: "SET_MESSAGES",
        payload: { conversationId, messages: [] },
      });
      
      // If this was the current conversation, switch to another one
      if (state.currentConversationId === conversationId) {
        const jobs = await JobsAPI.getJobs(walletAddress);
        if (jobs.length > 0) {
          setCurrentConversation(jobs[0].id);
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }, [getAddress, state.currentConversationId, setCurrentConversation]);

  const sendMessage = useCallback(
    async (
      message: string,
      file: File | null,
      useResearch: boolean = true,
      conversationId?: string
    ) => {
      const walletAddress = getAddress();
      const currentConvId = conversationId || state.currentConversationId;
      
      if (!currentConvId) {
        throw new Error("No active conversation");
      }

      // If no wallet is connected, fall back to localStorage-based messaging
      if (!walletAddress) {
        return await sendMessageWithLocalStorage(message, file, useResearch, currentConvId);
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        // Get current messages to determine order
        const currentMessages = state.messages[currentConvId] || [];
        let nextOrderIndex = currentMessages.length;

        // Add optimistic user message
        const optimisticUserMessage: ChatMessage = {
          role: "user",
          content: message,
          timestamp: Date.now(),
        };

        dispatch({
          type: "ADD_OPTIMISTIC_MESSAGE",
          payload: { conversationId: currentConvId, message: optimisticUserMessage },
        });

        // Save user message to database
        await JobsAPI.createMessage(walletAddress, currentConvId, {
          role: 'user',
          content: message,
          order_index: nextOrderIndex
        });
        nextOrderIndex++;

        // Handle file upload if present
        if (file) {
          await uploadFile(file, getHttpClient(), conversationId);
          
          // Update job to indicate file was uploaded
          await JobsAPI.updateJob(currentConvId, {
            wallet_address: walletAddress,
            has_uploaded_file: true
          });
        }

        // Prepare message for API
        const messageToSend = file ? `${message}\n\nFile: ${file.name}` : message;

        // Stream the response
        const httpClient = getHttpClient();
        await writeMessageStream(
          httpClient,
          currentConvId,
          messageToSend,
          useResearch,
          {
            onStart: () => {
              dispatch({
                type: "SET_STREAMING_STATE",
                payload: {
                  status: "dispatching",
                  progress: 0,
                  subtask: "Initializing request...",
                  agents: [],
                  output: "",
                  isStreaming: true,
                  streamingContent: "",
                },
              });
            },
            onProgress: (event: StreamingEvent) => {
              dispatch({
                type: "UPDATE_STREAMING_PROGRESS",
                payload: {
                  status: event.status,
                  progress: event.progress || 0,
                  subtask: event.subtask,
                  agents: event.agents,
                  output: event.output,
                  currentAgentIndex: event.currentAgentIndex,
                  totalAgents: event.totalAgents,
                  telemetry: event.telemetry,
                },
              });
            },
            onStreamContent: (content: string) => {
              dispatch({
                type: "SET_STREAMING_CONTENT",
                payload: { content, isStreaming: true },
              });
            },
            onComplete: async (finalResponse: ChatMessage) => {
              // Save assistant response to database
              await JobsAPI.createMessage(walletAddress, currentConvId, convertChatMessageToMessage(finalResponse, currentConvId, nextOrderIndex));
              
              // Update job status
              await JobsAPI.updateJob(currentConvId, {
                wallet_address: walletAddress,
                status: 'completed'
              });

              dispatch({
                type: "ADD_OPTIMISTIC_MESSAGE",
                payload: { conversationId: currentConvId, message: finalResponse },
              });

              dispatch({
                type: "SET_STREAMING_CONTENT",
                payload: { content: "", isStreaming: false },
              });

              dispatch({
                type: "SET_STREAMING_STATE",
                payload: {
                  status: "idle",
                  progress: 100,
                  subtask: "",
                  agents: [],
                  output: "",
                  isStreaming: false,
                  streamingContent: "",
                },
              });

              // Generate title if this is a new conversation
              if (!titleGenerationAttempted.current.has(currentConvId)) {
                titleGenerationAttempted.current.add(currentConvId);
                
                if (!pendingTitleGeneration.current.has(currentConvId)) {
                  pendingTitleGeneration.current.add(currentConvId);
                  
                  try {
                    const messages = getMessagesHistory(currentConvId);
                    const generatedTitle = await generateConversationTitle(messages, httpClient, currentConvId);
                    
                    // Update job name in database
                    await JobsAPI.updateJob(currentConvId, {
                      wallet_address: walletAddress,
                      name: generatedTitle
                    });
                    
                    dispatch({
                      type: "SET_CONVERSATION_TITLE",
                      payload: { conversationId: currentConvId, title: generatedTitle },
                    });
                  } catch (titleError) {
                    console.error("Failed to generate title:", titleError);
                  } finally {
                    pendingTitleGeneration.current.delete(currentConvId);
                  }
                }
              }
            },
            onError: async (error: any) => {
              console.error("Streaming error:", error);
              
              // Save error message to database
              const errorMessage: ChatMessage = {
                role: "assistant",
                content: "I encountered an error while processing your request. Please try again.",
                error_message: error.message || "Unknown error occurred",
                timestamp: Date.now(),
              };
              
              await JobsAPI.createMessage(walletAddress, currentConvId, convertChatMessageToMessage(errorMessage, currentConvId, nextOrderIndex));
              
              // Update job status
              await JobsAPI.updateJob(currentConvId, {
                wallet_address: walletAddress,
                status: 'failed'
              });

              dispatch({
                type: "ADD_OPTIMISTIC_MESSAGE",
                payload: { conversationId: currentConvId, message: errorMessage },
              });

              dispatch({
                type: "SET_STREAMING_STATE",
                payload: {
                  status: "idle",
                  progress: 0,
                  subtask: "",
                  agents: [],
                  output: "",
                  isStreaming: false,
                  streamingContent: "",
                },
              });

              dispatch({ type: "SET_ERROR", payload: error.message || "Unknown error occurred" });
            },
          }
        );
      } catch (error: any) {
        console.error("Send message error:", error);
        dispatch({ type: "SET_ERROR", payload: error.message || "Failed to send message" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.currentConversationId, state.messages, getAddress]
  );

  // Load initial data from localStorage when no wallet is connected
  const loadLocalStorageData = useCallback(async () => {
    try {
      const { getStorageData } = await import("@/services/local-storage/core");
      
      const data = getStorageData();
      
      // Load messages for each conversation
      Object.entries(data.conversations).forEach(([convId, conversation]) => {
        const messages = getMessagesHistory(convId);
        
        dispatch({
          type: "SET_MESSAGES",
          payload: { conversationId: convId, messages },
        });

        dispatch({
          type: "SET_CONVERSATION_TITLE",
          payload: { conversationId: convId, title: conversation.name },
        });
      });

      // Set current conversation to the default or first available
      const conversationIds = Object.keys(data.conversations);
      if (conversationIds.length > 0) {
        const currentConv = conversationIds.includes("default") ? "default" : conversationIds[0];
        dispatch({
          type: "SET_CURRENT_CONVERSATION",
          payload: currentConv,
        });
      }
    } catch (error) {
      console.error("Error loading localStorage data:", error);
    }
  }, []);

  // Fallback function for sending messages when no wallet is connected
  const sendMessageWithLocalStorage = useCallback(
    async (
      message: string,
      file: File | null,
      useResearch: boolean = true,
      conversationId: string
    ) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        // Add optimistic user message
        const optimisticUserMessage: ChatMessage = {
          role: "user",
          content: message,
          timestamp: Date.now(),
        };

        dispatch({
          type: "ADD_OPTIMISTIC_MESSAGE",
          payload: { conversationId, message: optimisticUserMessage },
        });

        // Save user message to localStorage
        addMessageToHistory(optimisticUserMessage, conversationId);

        // Handle file upload if present
        if (file) {
          await uploadFile(file, getHttpClient(), conversationId);
        }

        // Prepare message for API
        const messageToSend = file ? `${message}\n\nFile: ${file.name}` : message;

        // Stream the response
        const httpClient = getHttpClient();
        await writeMessageStream(
          httpClient,
          conversationId,
          messageToSend,
          useResearch,
          {
            onStart: () => {
              dispatch({
                type: "SET_STREAMING_STATE",
                payload: {
                  status: "dispatching",
                  progress: 0,
                  subtask: "Initializing request...",
                  agents: [],
                  output: "",
                  isStreaming: true,
                  streamingContent: "",
                },
              });
            },
            onProgress: (event: StreamingEvent) => {
              dispatch({
                type: "UPDATE_STREAMING_PROGRESS",
                payload: {
                  status: event.status,
                  progress: event.progress || 0,
                  subtask: event.subtask,
                  agents: event.agents,
                  output: event.output,
                  currentAgentIndex: event.currentAgentIndex,
                  totalAgents: event.totalAgents,
                  telemetry: event.telemetry,
                },
              });
            },
            onStreamContent: (content: string) => {
              dispatch({
                type: "SET_STREAMING_CONTENT",
                payload: { content, isStreaming: true },
              });
            },
            onComplete: async (finalResponse: ChatMessage) => {
              // Save assistant response to localStorage
              addMessageToHistory(finalResponse, conversationId);

              dispatch({
                type: "ADD_OPTIMISTIC_MESSAGE",
                payload: { conversationId, message: finalResponse },
              });

              dispatch({
                type: "SET_STREAMING_CONTENT",
                payload: { content: "", isStreaming: false },
              });

              dispatch({
                type: "SET_STREAMING_STATE",
                payload: {
                  status: "idle",
                  progress: 100,
                  subtask: "",
                  agents: [],
                  output: "",
                  isStreaming: false,
                  streamingContent: "",
                },
              });

              // Generate title if this is a new conversation
              if (!titleGenerationAttempted.current.has(conversationId)) {
                titleGenerationAttempted.current.add(conversationId);
                
                if (!pendingTitleGeneration.current.has(conversationId)) {
                  pendingTitleGeneration.current.add(conversationId);
                  
                  try {
                    const messages = getMessagesHistory(conversationId);
                    const generatedTitle = await generateConversationTitle(messages, httpClient, conversationId);
                    
                    dispatch({
                      type: "SET_CONVERSATION_TITLE",
                      payload: { conversationId, title: generatedTitle },
                    });
                  } catch (titleError) {
                    console.error("Failed to generate title:", titleError);
                  } finally {
                    pendingTitleGeneration.current.delete(conversationId);
                  }
                }
              }
            },
            onError: async (error: any) => {
              console.error("Streaming error:", error);
              
              // Save error message to localStorage
              const errorMessage: ChatMessage = {
                role: "assistant",
                content: "I encountered an error while processing your request. Please try again.",
                error_message: error.message || "Unknown error occurred",
                timestamp: Date.now(),
              };
              
              addMessageToHistory(errorMessage, conversationId);

              dispatch({
                type: "ADD_OPTIMISTIC_MESSAGE",
                payload: { conversationId, message: errorMessage },
              });

              dispatch({
                type: "SET_STREAMING_STATE",
                payload: {
                  status: "idle",
                  progress: 0,
                  subtask: "",
                  agents: [],
                  output: "",
                  isStreaming: false,
                  streamingContent: "",
                },
              });

              dispatch({ type: "SET_ERROR", payload: error.message || "Unknown error occurred" });
            },
          }
        );
      } catch (error: any) {
        console.error("Send message error:", error);
        dispatch({ type: "SET_ERROR", payload: error.message || "Failed to send message" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [getAddress]
  );

  const setCurrentView = useCallback((view: 'jobs' | 'chat') => {
    dispatch({
      type: "SET_CURRENT_VIEW",
      payload: view,
    });
  }, []);

  const refreshJobs = useCallback(async () => {
    // Placeholder for job refresh functionality
    // This can be implemented when jobs management is needed
    console.log("refreshJobs called");
  }, []);

  const contextValue = {
    state,
    setCurrentConversation,
    sendMessage,
    refreshMessages,
    refreshAllTitles,
    refreshJobs,
    deleteChat,
    setCurrentView,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};