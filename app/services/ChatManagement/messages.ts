import { ChatMessage } from "@/services/types";
import { getStorageData, saveStorageData } from "@/services/LocalStorage/core";
import {
  DEFAULT_MESSAGE,
  DEFAULT_CONVERSATION_ID,
} from "@/services/LocalStorage/config";
import { getOrCreateConversation } from "@/services/ChatManagement/storage";
import { getHttpClient } from "@/services/constants";
import { generateConversationTitle } from "@/services/ChatManagement/api";

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
