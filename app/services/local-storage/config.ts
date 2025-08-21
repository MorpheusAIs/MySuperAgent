import { AssistantMessage } from "@/services/types";

// Storage key
export const STORAGE_KEY = "chat_data";

// Default conversation ID
export const DEFAULT_CONVERSATION_ID = "default";

// Default conversation name
export const DEFAULT_CONVERSATION_NAME = "Default Chat";

// Default welcome message that appears in all new conversations
// Set to null to avoid auto-creating messages in new conversations
export const DEFAULT_MESSAGE: AssistantMessage | null = null;
