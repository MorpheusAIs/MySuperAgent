import { AssistantMessage } from "@/services/types";

// Storage key
export const STORAGE_KEY = "chat_data";

// Default conversation ID
export const DEFAULT_CONVERSATION_ID = "default";

// Default conversation name
export const DEFAULT_CONVERSATION_NAME = "Default Chat";

// Default welcome message that appears in all new conversations
export const DEFAULT_MESSAGE: AssistantMessage = {
  role: "assistant",
  agentName: "default",
  content: `This highly experimental chatbot is not intended for making important decisions. Its
            responses are generated using AI models and may not always be accurate.
            By using this chatbot, you acknowledge that you use it at your own discretion
            and assume all risks associated with its limitations and potential errors.`,
  timestamp: Date.now(),
  metadata: {},
  requires_action: false,
};
