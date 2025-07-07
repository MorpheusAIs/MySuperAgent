import { ChatMessage } from "@/services/types";
import { getStorageData, saveStorageData } from "@/services/LocalStorage/core";
import { DEFAULT_CONVERSATION_ID } from "@/services/LocalStorage/config";
import { createNewConversation } from "@/services/ChatManagement/conversations";

/**
 * Get messages history for a specific conversation
 */
export const getMessagesHistory = (
  conversationId: string = DEFAULT_CONVERSATION_ID
): ChatMessage[] => {
  const data = getStorageData();
  // Don't create a new conversation if it doesn't exist - just return empty array
  if (!data.conversations[conversationId]) {
    return [];
  }
  return [...(data.conversations[conversationId].messages || [])];
};

/**
 * Get or create a conversation by ID
 */
export const getOrCreateConversation = (
  conversationId: string = DEFAULT_CONVERSATION_ID
): string => {
  const data = getStorageData();

  if (!data.conversations[conversationId]) {
    if (conversationId === DEFAULT_CONVERSATION_ID) {
      // If the default conversation doesn't exist, it will be created
      // during the getStorageData() call via migrations
      return DEFAULT_CONVERSATION_ID;
    } else {
      // For non-default conversations, create a new one
      return createNewConversation();
    }
  }

  return conversationId;
};

/**
 * Get the file upload status for a conversation
 */
export const getUploadedFileStatus = (
  conversationId: string = DEFAULT_CONVERSATION_ID
): boolean => {
  const data = getStorageData();
  const convId = getOrCreateConversation(conversationId);
  return data.conversations[convId]?.hasUploadedFile || false;
};

/**
 * Set the file upload status for a conversation
 */
export const setUploadedFileStatus = (
  hasFile: boolean,
  conversationId: string = DEFAULT_CONVERSATION_ID
): void => {
  const data = getStorageData();
  const convId = getOrCreateConversation(conversationId);

  if (data.conversations[convId]) {
    data.conversations[convId].hasUploadedFile = hasFile;
    saveStorageData(data);
  }
};

/**
 * Get the last message from a conversation
 */
export const getLastMessage = (
  conversationId: string = DEFAULT_CONVERSATION_ID
): ChatMessage | null => {
  const messages = getMessagesHistory(conversationId);
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

/**
 * Get chat history as a formatted string
 */
export const getChatHistoryAsString = (
  conversationId: string = DEFAULT_CONVERSATION_ID
): string => {
  const messages = getMessagesHistory(conversationId);
  return messages
    .map(
      (msg) =>
        `${msg.role}: ${
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content)
        }`
    )
    .join("\n");
};
