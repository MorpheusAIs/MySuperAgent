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

        // Set the first job as current if no current conversation
        if (jobs.length > 0 && !state.currentConversationId) {
          dispatch({ type: "SET_CURRENT_CONVERSATION_ID", payload: jobs[0].id });
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        // Fallback to localStorage if database fails
        await loadLocalStorageData();
      }
    };

    loadInitialData();
  }, [getAddress]);

  // Load initial data from localStorage when no wallet is connected
  const loadLocalStorageData = useCallback(async () => {
    try {
      const { getStorageData } = await import("@/services/local-storage/core");
      const data = getStorageData();
      
      // Load conversations from localStorage
      Object.entries(data.conversations).forEach(([id, conversation]) => {
        dispatch({
          type: "SET_MESSAGES",
          payload: { conversationId: id, messages: conversation.messages },
        });
        
        dispatch({
          type: "SET_CONVERSATION_TITLE",
          payload: { conversationId: id, title: conversation.name },
        });
      });

      // Set current conversation
      const conversationIds = Object.keys(data.conversations);
      if (conversationIds.length > 0 && !state.currentConversationId) {
        dispatch({ type: "SET_CURRENT_CONVERSATION_ID", payload: conversationIds[0] });
      }
    } catch (error) {
      console.error("Error loading localStorage data:", error);
    }
  }, [state.currentConversationId]);

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
          payload: { conversationId: currentConvId, isLoading: true },
        });

        try {
          const messages = await writeOrchestratedMessage(
            messageToSend,
            httpClient,
            chainId,
            walletAddress,
            currentConvId,
            useResearch
          );

          // Find the assistant's response (should be the last message)
          const assistantResponse = messages.find(m => m.role === 'assistant');
          if (assistantResponse) {
            // Save assistant response to database
            await JobsAPI.createMessage(walletAddress, currentConvId, convertChatMessageToMessage(assistantResponse, currentConvId, nextOrderIndex));
            
            // Update job status
            await JobsAPI.updateJob(currentConvId, {
              wallet_address: walletAddress,
              status: 'completed'
            });

            dispatch({
              type: "ADD_OPTIMISTIC_MESSAGE",
              payload: { conversationId: currentConvId, message: assistantResponse },
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
          }

        } catch (error: any) {
          console.error("Chat error:", error);
          
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
        } finally {
          dispatch({
            type: "SET_LOADING",
            payload: { conversationId: currentConvId, isLoading: false },
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
          payload: { conversationId: convId, isLoading: true },
        });

        try {
          const messages = await writeOrchestratedMessage(
            messageToSend,
            httpClient,
            chainId,
            'temp-address',
            convId,
            useResearch
          );

          // Update messages in state (writeMessage also handles localStorage)
          dispatch({
            type: "SET_MESSAGES",
            payload: { conversationId: convId, messages },
          });

          // Generate title for new conversations
          if (!titleGenerationAttempted.current.has(convId)) {
            titleGenerationAttempted.current.add(convId);
            
            try {
              const generatedTitle = await generateConversationTitle(messages, httpClient, convId);
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
            payload: { conversationId: convId, isLoading: false },
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
        dispatch({ type: "SET_CURRENT_CONVERSATION_ID", payload: conversationId });

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

  const contextValue = {
    state,
    sendMessage,
    setCurrentConversation,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};