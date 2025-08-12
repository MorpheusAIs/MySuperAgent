import { getStorageData, saveStorageData } from "@/services/LocalStorage/core";
import {
  DEFAULT_MESSAGE,
  DEFAULT_CONVERSATION_ID,
} from "@/services/LocalStorage/config";
import { clearMessagesHistory } from "@/services/ChatManagement/messages";

/**
 * Create a new conversation
 */
export const createNewConversation = (): string => {
  const data = getStorageData();
  const newId = `chat_${data.lastConversationId + 1}`;
  const timestamp = Date.now();

  data.conversations[newId] = {
    id: newId,
    name: "New Conversation",
    messages: [{ ...DEFAULT_MESSAGE, timestamp }],
    createdAt: timestamp,
    hasUploadedFile: false,
  };

  data.lastConversationId += 1;
  saveStorageData(data);

  return newId;
};

/**
 * Delete a conversation
 */
export const deleteConversation = (conversationId: string): void => {
  if (conversationId === DEFAULT_CONVERSATION_ID) {
    // Clear messages instead of deleting the default conversation
    clearMessagesHistory(DEFAULT_CONVERSATION_ID);
    return;
  }

  const data = getStorageData();
  if (data.conversations[conversationId]) {
    delete data.conversations[conversationId];
    saveStorageData(data);
  }
};

/**
 * Get all conversations, sorted with default first, then by creation date
 */
export const getAllConversations = () => {
  const data = getStorageData();
  const sortedIds = Object.keys(data.conversations).sort((a, b) => {
    if (a === DEFAULT_CONVERSATION_ID) return -1;
    if (b === DEFAULT_CONVERSATION_ID) return 1;
    return data.conversations[b].createdAt - data.conversations[a].createdAt;
  });

  return sortedIds.map((id) => data.conversations[id]);
};

/**
 * Update the title of a conversation
 */
export const updateConversationTitle = async (
  conversationId: string,
  newTitle: string
) => {
  try {
    const data = getStorageData();

    if (data.conversations[conversationId]) {
      data.conversations[conversationId].name = newTitle;
      saveStorageData(data);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to update conversation title:", error);
    throw error;
  }
};
