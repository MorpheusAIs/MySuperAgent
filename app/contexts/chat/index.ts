// Storage operations
export {
  getMessagesHistory,
  getOrCreateConversation,
  getUploadedFileStatus,
  setUploadedFileStatus,
  getLastMessage,
  getChatHistoryAsString,
} from "@/services/ChatManagement/storage";

// Conversation management
export {
  createNewConversation,
  deleteConversation,
  getAllConversations,
  updateConversationTitle,
} from "@/services/ChatManagement/conversations";

// Message management
export {
  addMessageToHistory,
  clearMessagesHistory,
} from "@/services/ChatManagement/messages";

// API integration
export { writeMessage, uploadFile } from "@/services/ChatManagement/api";
