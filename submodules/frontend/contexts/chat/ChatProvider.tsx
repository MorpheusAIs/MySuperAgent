import React, {
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useChainId, useAccount } from "wagmi";
import { ChatMessage } from "@/services/types";
import { getHttpClient } from "@/services/constants";
import {
  writeMessage,
  uploadFile,
  generateConversationTitle,
  writeMessageStream,
  StreamingEvent,
} from "@/services/ChatManagement/api";
import { getMessagesHistory } from "@/services/ChatManagement/storage";
import { addMessageToHistory } from "@/services/ChatManagement/messages";
import { getStorageData, cleanupCorruptedMessages } from "@/services/LocalStorage/core";
import { deleteConversation } from "@/services/ChatManagement/conversations";
import { chatReducer, initialState } from "@/contexts/chat/ChatReducer";
import ChatContext from "@/contexts/chat/ChatContext";

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const chainId = useChainId();
  const { address } = useAccount();

  // Track conversations that have already attempted title generation
  const titleGenerationAttempted = useRef<Set<string>>(new Set());
  // Track active title generation requests to prevent duplicates
  const pendingTitleGeneration = useRef<Set<string>>(new Set());

  // Load initial messages and titles for default conversation
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const messages = getMessagesHistory("default");
        dispatch({
          type: "SET_MESSAGES",
          payload: { conversationId: "default", messages },
        });

        // Load conversation titles from localStorage
        const data = getStorageData();
        const titles: Record<string, string> = {};

        Object.keys(data.conversations).forEach((convId) => {
          if (data.conversations[convId].name) {
            titles[convId] = data.conversations[convId].name;
            // Mark conversations with custom titles as already having attempted title generation
            if (data.conversations[convId].name !== "New Conversation") {
              titleGenerationAttempted.current.add(convId);
            }
          }
        });

        // Set all titles at once
        Object.entries(titles).forEach(([convId, title]) => {
          dispatch({
            type: "SET_CONVERSATION_TITLE",
            payload: { conversationId: convId, title },
          });
        });
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };

    loadInitialData();
  }, []);

  // Set current conversation and load its messages
  const setCurrentConversation = useCallback(
    async (conversationId: string) => {
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversationId });

      // Always load messages to ensure we have the latest
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const messages = getMessagesHistory(conversationId);
        dispatch({
          type: "SET_MESSAGES",
          payload: { conversationId, messages },
        });

          // Load conversation title if available
          const data = getStorageData();
          if (data.conversations[conversationId]?.name) {
            dispatch({
              type: "SET_CONVERSATION_TITLE",
              payload: {
                conversationId,
                title: data.conversations[conversationId].name,
              },
            });

            // Mark as having a custom title if it's not the default
            if (
              data.conversations[conversationId].name !== "New Conversation"
            ) {
              titleGenerationAttempted.current.add(conversationId);
            }
          }
        } catch (error) {
          console.error(
            `Failed to load conversation ${conversationId}:`,
            error
          );
          dispatch({
            type: "SET_ERROR",
            payload: "Failed to load conversation",
          });
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
    },
    []
  );

  // Refresh messages and title for current conversation
  const refreshMessages = useCallback(async () => {
    const { currentConversationId } = state;
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Get latest messages
      const messages = getMessagesHistory(currentConversationId);
      dispatch({
        type: "SET_MESSAGES",
        payload: { conversationId: currentConversationId, messages },
      });

      // Get latest title
      const data = getStorageData();
      if (data.conversations[currentConversationId]?.name) {
        dispatch({
          type: "SET_CONVERSATION_TITLE",
          payload: {
            conversationId: currentConversationId,
            title: data.conversations[currentConversationId].name,
          },
        });
      }

      // After receiving a response, check if we need to generate a title
      // but ensure we don't trigger this logic repeatedly for the same conversation
      maybeGenerateTitle(currentConversationId, messages);
    } catch (error) {
      console.error("Failed to refresh conversation data:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to refresh conversation",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.currentConversationId]);

  // Refresh all conversation titles from storage
  const refreshAllTitles = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Get storage data which contains all conversations
      const data = getStorageData();

      // For each conversation
      Object.keys(data.conversations).forEach((conversationId) => {
        // Update title if one exists
        if (data.conversations[conversationId]?.name) {
          dispatch({
            type: "SET_CONVERSATION_TITLE",
            payload: {
              conversationId,
              title: data.conversations[conversationId].name,
            },
          });
        }
      });
    } catch (error) {
      console.error("Failed to refresh all conversation titles:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to refresh conversation titles",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Safe title generation that avoids infinite loops
  const maybeGenerateTitle = useCallback(
    (conversationId: string, messages: ChatMessage[]) => {
      // Skip if we've already attempted to generate a title for this conversation
      if (titleGenerationAttempted.current.has(conversationId)) return;

      // Skip if there's a pending title generation request
      if (pendingTitleGeneration.current.has(conversationId)) return;

      // Only generate title if there are enough messages
      // and at least one is from the assistant (indicating a response occurred)
      const hasAgentResponse = messages.some((m) => m.role === "assistant");
      const hasEnoughMessages = messages.length >= 5;
      const currentTitle = state.conversationTitles[conversationId];
      const hasDefaultTitle =
        currentTitle === "New Conversation" || !currentTitle;

      if (hasEnoughMessages && hasAgentResponse && hasDefaultTitle) {
        // Mark as attempted regardless of outcome
        titleGenerationAttempted.current.add(conversationId);
        pendingTitleGeneration.current.add(conversationId);

        // Run title generation outside the current execution context
        setTimeout(() => {
          generateConversationTitle(messages, getHttpClient(), conversationId)
            .then((title) => {
              if (title) {
                dispatch({
                  type: "SET_CONVERSATION_TITLE",
                  payload: { conversationId, title },
                });
              }
            })
            .catch((error) => {
              console.error("Failed to generate conversation title:", error);
            })
            .finally(() => {
              // Clean up pending request tracking
              pendingTitleGeneration.current.delete(conversationId);
            });
        }, 0);
      }
    },
    [state.conversationTitles]
  );

  // Send message or file
  const sendMessage = useCallback(
    async (
      message: string,
      file: File | null,
      useResearch: boolean = false,
      conversationId?: string
    ) => {
      if (!message && !file) return;

      // Use provided conversationId or fall back to current conversation from state
      const targetConversationId = conversationId || state.currentConversationId;
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        if (!file) {
          // Text message flow
          // Add optimistic user message
          const optimisticMessage: ChatMessage = {
            role: "user",
            content: message,
            timestamp: Date.now(),
          };

          // Update UI immediately
          dispatch({
            type: "ADD_OPTIMISTIC_MESSAGE",
            payload: {
              conversationId: targetConversationId,
              message: optimisticMessage,
            },
          });

          // Use streaming for research mode
          if (useResearch) {
            // Reset streaming state
            dispatch({
              type: "SET_STREAMING_STATE",
              payload: {
                status: "processing",
                progress: 0,
                telemetry: undefined,
                currentAgentIndex: undefined,
                totalAgents: undefined,
              },
            });

            await writeMessageStream(
              message,
              getHttpClient(),
              chainId,
              address || "",
              targetConversationId,
              (event: StreamingEvent) => {
                // Handle streaming events

                // Turn off loading when first event arrives
                dispatch({ type: "SET_LOADING", payload: false });

                switch (event.type) {
                  case "connected":
                    break;
                  case "chunk":
                    // Handle streaming text chunks - show progress with content
                    dispatch({
                      type: "UPDATE_STREAMING_PROGRESS",
                      payload: {
                        status: "processing",
                        output: event.content,
                      },
                    });
                    break;
                  case "complete":
                    // Final completion event - add the message to chat
                    
                    // Reset streaming state
                    dispatch({
                      type: "SET_STREAMING_STATE",
                      payload: {
                        status: "idle",
                        progress: 0,
                        telemetry: undefined,
                        subtask: undefined,
                        agents: undefined,
                        output: undefined,
                        currentAgentIndex: undefined,
                        totalAgents: undefined,
                      },
                    });

                    // Turn off loading
                    dispatch({ type: "SET_LOADING", payload: false });

                    // Add the final message to chat AND save to localStorage
                    if (event.response && event.response.content) {
                      const finalMessage: ChatMessage = {
                        role: "assistant",
                        content: event.response.content,
                        timestamp: Date.now(),
                        metadata: event.response.metadata,
                      };
                      
                      // Save to localStorage first so refreshMessages includes it
                      addMessageToHistory(finalMessage, targetConversationId);
                      
                      // Then add to state
                      dispatch({
                        type: "ADD_OPTIMISTIC_MESSAGE",
                        payload: {
                          conversationId: targetConversationId,
                          message: finalMessage,
                        },
                      });
                    }
                    break;
                  case "parse_error":
                    // Parse errors are handled internally
                    break;
                  default:
                    // Unhandled events are ignored
                    break;
                }
              },
              (response: ChatMessage) => {
                // Completion handler - response now includes metadata with subtask_outputs

                // Reset streaming state
                dispatch({
                  type: "SET_STREAMING_STATE",
                  payload: {
                    status: "idle",
                    progress: 0,
                    telemetry: undefined,
                    subtask: undefined,
                    agents: undefined,
                    output: undefined,
                    currentAgentIndex: undefined,
                    totalAgents: undefined,
                  },
                });

                // Turn off loading
                dispatch({ type: "SET_LOADING", payload: false });

                // Add the final message with crew metadata
                dispatch({
                  type: "ADD_OPTIMISTIC_MESSAGE",
                  payload: {
                    conversationId: targetConversationId,
                    message: response,
                  },
                });
              },
              (error: Error) => {
                // Error handler


                // Don't show parse errors to user - they're handled internally
                if (!error.message.includes("parse")) {
                  dispatch({ type: "SET_ERROR", payload: error.message });
                }

                dispatch({ type: "SET_LOADING", payload: false });

                // Reset streaming state on error
                dispatch({
                  type: "SET_STREAMING_STATE",
                  payload: {
                    status: "idle",
                    progress: 0,
                    telemetry: undefined,
                    subtask: undefined,
                    agents: undefined,
                    output: undefined,
                    currentAgentIndex: undefined,
                    totalAgents: undefined,
                  },
                });
              }
            );
          } else {
            // Non-streaming flow
            await writeMessage(
              message,
              getHttpClient(),
              chainId,
              address || "",
              targetConversationId,
              useResearch
            );

            // Refresh messages to get server response
            await refreshMessages();
          }
        } else {
          // File upload flow
          await uploadFile(file, getHttpClient(), targetConversationId);
          // Refresh messages to get server response
          await refreshMessages();
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        dispatch({ type: "SET_ERROR", payload: "Failed to send message" });

        // Always ensure loading is turned off
        dispatch({ type: "SET_LOADING", payload: false });

        // And reset streaming state
        dispatch({
          type: "SET_STREAMING_STATE",
          payload: {
            status: "idle",
            progress: 0,
            telemetry: undefined,
            subtask: undefined,
            agents: undefined,
            output: undefined,
            currentAgentIndex: undefined,
            totalAgents: undefined,
          },
        });
      }
    },
    [chainId, address, refreshMessages, state.currentConversationId]
  );

  // Delete conversation
  const deleteChat = useCallback(
    async (conversationId: string) => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        deleteConversation(conversationId);

        // Remove from title generation tracking
        titleGenerationAttempted.current.delete(conversationId);
        pendingTitleGeneration.current.delete(conversationId);

        // If current conversation was deleted, switch to default
        if (conversationId === state.currentConversationId) {
          dispatch({ type: "SET_CURRENT_CONVERSATION", payload: "default" });
          const defaultMessages = getMessagesHistory("default");
          dispatch({
            type: "SET_MESSAGES",
            payload: { conversationId: "default", messages: defaultMessages },
          });
        }
      } catch (error) {
        console.error("Failed to delete conversation:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to delete conversation",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.currentConversationId]
  );

  const setCurrentView = useCallback((view: 'jobs' | 'chat') => {
    dispatch({ type: "SET_CURRENT_VIEW", payload: view });
  }, []);

  // Context value
  const value = {
    state,
    setCurrentConversation,
    sendMessage,
    refreshMessages,
    refreshAllTitles,
    deleteChat,
    setCurrentView,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
