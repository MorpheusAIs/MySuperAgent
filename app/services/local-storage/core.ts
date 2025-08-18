import { LocalStorageData } from "@/services/types";
import {
  STORAGE_KEY,
  DEFAULT_MESSAGE,
  DEFAULT_CONVERSATION_ID,
  DEFAULT_CONVERSATION_NAME,
} from "./config";

// Initialize local storage with default data
export const initializeStorage = (): LocalStorageData => {
  const defaultData: LocalStorageData = {
    conversations: {
      [DEFAULT_CONVERSATION_ID]: {
        id: DEFAULT_CONVERSATION_ID,
        name: DEFAULT_CONVERSATION_NAME,
        messages: [DEFAULT_MESSAGE],
        createdAt: Date.now(),
        hasUploadedFile: false,
      },
    },
    lastConversationId: 0,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

// Get all data from local storage
export const getStorageData = (): LocalStorageData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return initializeStorage();
  }

  try {
    const parsedData = JSON.parse(data) as LocalStorageData;

    return parsedData;
  } catch (error) {
    console.error("Error parsing chat data from localStorage:", error);
    return initializeStorage();
  }
};

// Save data to local storage
export const saveStorageData = (data: LocalStorageData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Cleanup corrupted messages from storage
export const cleanupCorruptedMessages = (): void => {
  const data = getStorageData();
  let hasCorruptedMessages = false;
  
  // Check each conversation
  Object.keys(data.conversations).forEach(conversationId => {
    const conversation = data.conversations[conversationId];
    
    // Filter out messages that have the wrong structure
    const cleanMessages = conversation.messages.filter(message => {
      // Check if message has the correct structure
      if (!message.role || !message.content) {
        console.warn(`Removing corrupted message in conversation ${conversationId}:`, message);
        hasCorruptedMessages = true;
        return false;
      }
      
      // Check if message accidentally contains API response structure
      if ('response' in message && 'current_agent' in message) {
        console.warn(`Removing API response in conversation ${conversationId}:`, message);
        hasCorruptedMessages = true;
        return false;
      }
      
      return true;
    });
    
    // Update messages if any were removed
    if (cleanMessages.length !== conversation.messages.length) {
      conversation.messages = cleanMessages;
    }
  });
  
  // Save cleaned data if any messages were removed
  if (hasCorruptedMessages) {
    console.log('Cleaned corrupted messages from storage');
    saveStorageData(data);
  }
};
