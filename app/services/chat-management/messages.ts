import { ChatMessage } from "@/services/types";
import { getStorageData, saveStorageData } from "@/services/local-storage/core";
import {
  DEFAULT_MESSAGE,
  DEFAULT_CONVERSATION_ID,
} from "@/services/local-storage/config";
import { getOrCreateConversation } from "@/services/chat-management/storage";
import { getHttpClient } from "@/services/config/constants";
import { generateConversationTitle } from "@/services/chat-management/api";

/**
 * Add a message to a conversation history
 */
export const addMessageToHistory = async (
  message: ChatMessage,
  conversationId: string = DEFAULT_CONVERSATION_ID
): Promise<void> => {
  const data = getStorageData();
  const convId = getOrCreateConversation(conversationId);

  // Ensure the message has a timestamp
  if (!message.timestamp) {
    message.timestamp = Date.now();
  }

  data.conversations[convId].messages.push(message);

  saveStorageData(data);
};

/**
 * Clear all messages from a conversation, leaving only the default message
 */
export const clearMessagesHistory = (
  conversationId: string = DEFAULT_CONVERSATION_ID
): void => {
  const data = getStorageData();
  const convId = getOrCreateConversation(conversationId);

  if (data.conversations[convId]) {
    // Keep only the default message
    data.conversations[convId].messages = [
      { ...DEFAULT_MESSAGE, timestamp: Date.now() },
    ];
    data.conversations[convId].hasUploadedFile = false;
    saveStorageData(data);
  }
};
