// Storage operations
export {
  getMessagesHistory,
  getOrCreateConversation,
  getUploadedFileStatus,
  setUploadedFileStatus,
  getLastMessage,
  getChatHistoryAsString,
} from "@/services/chat-management/storage";

// Conversation management
export {
  createNewConversation,
  deleteConversation,
  getAllConversations,
  updateConversationTitle,
} from "@/services/chat-management/conversations";

// Message management
export {
  addMessageToHistory,
  clearMessagesHistory,
} from "@/services/chat-management/messages";

// API integration
export { writeMessage, uploadFile } from "@/services/chat-management/api";
