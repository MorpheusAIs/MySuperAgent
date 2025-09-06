"use client";

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
  writeOrchestratedMessage,
  uploadFile,
  generateConversationTitle,
} from "@/services/chat-management/api";
import { getMessagesHistory } from "@/services/chat-management/storage";
import { addMessageToHistory } from "@/services/chat-management/messages";
import JobsAPI from "@/services/api-clients/jobs";
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

        // Set current conversation to the first job (most recent) if any exist
        if (jobs.length > 0) {
          dispatch({
            type: "SET_CURRENT_CONVERSATION",
            payload: jobs[0].id,
          });
        } else {
          // No jobs exist, don't set a current conversation
          // User will create their first job through the UI
          dispatch({
            type: "SET_CURRENT_CONVERSATION",
            payload: "",
          });
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        // Fallback to localStorage if database fails
        await loadLocalStorageData();
      }
    };

    loadInitialData();
  }, [address, getAddress]);

  // Load initial data from localStorage when no wallet is connected
  const loadLocalStorageData = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error("Error loading localStorage data:", error);
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string, file: File | null = null, useResearch: boolean = false, jobId?: string): Promise<void> => {
      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          // No wallet connected, use localStorage-based messaging
          return await sendLocalStorageMessage(message, file, useResearch, jobId);
        }

        const currentConvId = jobId || state.currentConversationId;
        if (!currentConvId) {
          throw new Error("No conversation selected");
        }

        // Get next order index for messages
        const existingMessages = await JobsAPI.getMessages(walletAddress, currentConvId);
        let nextOrderIndex = existingMessages.length;

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

        // Update job status to running
        await JobsAPI.updateJob(currentConvId, {
          wallet_address: walletAddress,
          status: 'running'
        });

        // Handle file upload if present
        if (file) {
          try {
            const httpClient = getHttpClient();
            await uploadFile(file, httpClient);
          } catch (uploadError) {
            console.error("File upload error:", uploadError);
          }
        }

        // Prepare message for API
        const messageToSend = file ? `${message}\n\nFile: ${file.name}` : message;

        // Use direct chat endpoint (no streaming)
        const httpClient = getHttpClient();
        
        dispatch({
          type: "SET_LOADING",
          payload: true,
        });

        try {
          // Call orchestration API with timeout and retries
          const response = await Promise.race([
            httpClient.post("/api/v1/chat/orchestrate", {
              prompt: {
                role: "user",
                content: messageToSend,
              },
              chatHistory: state.messages[currentConvId] || [],
              conversationId: currentConvId,
              useResearch: true, // Always use orchestration
              walletAddress: walletAddress,
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Orchestration request timeout after 6 minutes')), 6 * 60 * 1000)
            )
          ]);

          if (response.data) {
            const { response: agentResponse, current_agent } = response.data;
            
            // Create assistant message with proper metadata
            const assistantMessage: ChatMessage = {
              role: "assistant",
              content: agentResponse.content,
              agentName: current_agent,
              error_message: agentResponse.error_message,
              metadata: {
                ...agentResponse.metadata,
                // Ensure orchestration metadata is present
                selectedAgent: agentResponse.metadata?.selectedAgent || current_agent,
                selectionReasoning: agentResponse.metadata?.selectionReasoning,
                availableAgents: agentResponse.metadata?.availableAgents,
                agentType: agentResponse.metadata?.agentType,
                userSpecificAgents: agentResponse.metadata?.userSpecificAgents,
                isOrchestration: true,
              },
              requires_action: agentResponse.requires_action,
              action_type: agentResponse.action_type,
              timestamp: Date.now(),
            };

            // Save assistant response to database
            await JobsAPI.createMessage(walletAddress, currentConvId, convertChatMessageToMessage(assistantMessage, currentConvId, nextOrderIndex));
            
            // Update job status
            await JobsAPI.updateJob(currentConvId, {
              wallet_address: walletAddress,
              status: 'completed'
            });

            // Add assistant message to state
            dispatch({
              type: "ADD_OPTIMISTIC_MESSAGE",
              payload: { conversationId: currentConvId, message: assistantMessage },
            });

            // Generate title if this is a new conversation
            if (!titleGenerationAttempted.current.has(currentConvId)) {
              titleGenerationAttempted.current.add(currentConvId);
              
              if (!pendingTitleGeneration.current.has(currentConvId)) {
                pendingTitleGeneration.current.add(currentConvId);
                
                try {
                  const messages = state.messages[currentConvId] || [];
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
          }

        } catch (error: any) {
          console.error("Chat error:", error);
          
          // Determine error message based on error type
          let errorContent = "I encountered an error while processing your request. Please try again.";
          let errorDetails = error.message || "Unknown error occurred";
          
          if (error.message?.includes('timeout')) {
            errorContent = "Your request took too long to process and was cancelled. Please try again with a simpler request.";
            errorDetails = `Request timeout: ${error.message}`;
          } else if (error.message?.includes('Agent')) {
            errorContent = "There was an issue with the AI agent system. Please try again in a moment.";
            errorDetails = `Agent error: ${error.message}`;
          }
          
          // Save error message to database with retry logic
          const errorMessage: ChatMessage = {
            role: "assistant",
            content: errorContent,
            error_message: errorDetails,
            timestamp: Date.now(),
          };
          
          try {
            await JobsAPI.createMessage(walletAddress, currentConvId, convertChatMessageToMessage(errorMessage, currentConvId, nextOrderIndex));
          } catch (dbError) {
            console.error("Failed to save error message to database:", dbError);
            // Continue with UI update even if DB save fails
          }
          
          // Update job status with retry logic
          try {
            await JobsAPI.updateJob(currentConvId, {
              wallet_address: walletAddress,
              status: 'failed'
            });
          } catch (dbError) {
            console.error("Failed to update job status to failed:", dbError);
            // Continue with UI update even if DB save fails
          }

          dispatch({
            type: "ADD_OPTIMISTIC_MESSAGE",
            payload: { conversationId: currentConvId, message: errorMessage },
          });
        } finally {
          dispatch({
            type: "SET_LOADING",
            payload: false,
          });
        }
      } catch (error: any) {
        console.error("Send message error:", error);
        dispatch({ type: "SET_ERROR", payload: error.message || "Failed to send message" });
      }
    },
    [state.currentConversationId, state.messages, getAddress, chainId]
  );

  // Send message using localStorage (no wallet)
  const sendLocalStorageMessage = useCallback(
    async (message: string, file: File | null = null, useResearch: boolean = false, conversationId?: string): Promise<void> => {
      try {
        const httpClient = getHttpClient();
        const convId = conversationId || state.currentConversationId;

        if (!convId) {
          throw new Error("No conversation selected");
        }

        // Handle file upload if present
        if (file) {
          try {
            await uploadFile(file, httpClient);
          } catch (uploadError) {
            console.error("File upload error:", uploadError);
          }
        }

        // Prepare message for API
        const messageToSend = file ? `${message}\n\nFile: ${file.name}` : message;

        dispatch({
          type: "SET_LOADING",
          payload: true,
        });

        try {
          // For localStorage users, use writeOrchestratedMessage which handles localStorage
          const updatedMessages = await writeOrchestratedMessage(
            messageToSend,
            httpClient,
            chainId,
            'temp-address',
            convId,
            true  // Always use orchestration (research mode)
          );

          // Update state with messages from localStorage
          dispatch({
            type: "SET_MESSAGES",
            payload: { conversationId: convId, messages: updatedMessages },
          });

          // Generate title for new conversations
          if (!titleGenerationAttempted.current.has(convId)) {
            titleGenerationAttempted.current.add(convId);
            
            try {
              const generatedTitle = await generateConversationTitle(updatedMessages, httpClient, convId);
              dispatch({
                type: "SET_CONVERSATION_TITLE",
                payload: { conversationId: convId, title: generatedTitle },
              });
            } catch (titleError) {
              console.error("Failed to generate title:", titleError);
            }
          }
        } catch (error: any) {
          console.error("Chat error:", error);
          throw error;
        } finally {
          dispatch({
            type: "SET_LOADING",
            payload: false,
          });
        }
      } catch (error: any) {
        console.error("Send localStorage message error:", error);
        dispatch({ type: "SET_ERROR", payload: error.message || "Failed to send message" });
      }
    },
    [state.currentConversationId, chainId]
  );

  const setCurrentConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      try {
        dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversationId });

        const walletAddress = getAddress();
        if (!walletAddress) {
          // No wallet, load from localStorage
          const messages = getMessagesHistory(conversationId);
          dispatch({
            type: "SET_MESSAGES",
            payload: { conversationId, messages },
          });
        } else {
          // Load messages from database
          const messages = await JobsAPI.getMessages(walletAddress, conversationId);
          const chatMessages = messages.map(convertMessageToChatMessage);
          
          dispatch({
            type: "SET_MESSAGES",
            payload: { conversationId, messages: chatMessages },
          });
        }
      } catch (error) {
        console.error("Error setting current conversation:", error);
      }
    },
    [getAddress]
  );

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
      
      jobs.forEach((job: Job) => {
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

  const refreshJobs = useCallback(async () => {
    // This is a placeholder - refreshJobs functionality can be added if needed
    await refreshMessages();
  }, [refreshMessages]);

  const setCurrentView = useCallback((view: 'jobs' | 'chat') => {
    dispatch({ type: "SET_CURRENT_VIEW", payload: view });
  }, []);

  const contextValue = {
    state,
    sendMessage,
    setCurrentConversation,
    refreshMessages,
    refreshAllTitles,
    deleteChat,
    refreshJobs,
    setCurrentView,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};