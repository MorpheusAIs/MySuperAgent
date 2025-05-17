import { ChatState, ChatAction } from "@/contexts/chat/types";

// Initial state
export const initialState: ChatState = {
  messages: {},
  currentConversationId: "default",
  isLoading: false,
  error: null,
  conversationTitles: {},
  streamingState: {
    status: 'idle',
    progress: 0,
  },
};

/**
 * Reducer for chat state management
 */
export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
      };

    case "SET_CURRENT_CONVERSATION":
      return {
        ...state,
        currentConversationId: action.payload,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "ADD_OPTIMISTIC_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: [
            ...(state.messages[action.payload.conversationId] || []),
            action.payload.message,
          ],
        },
      };

    case "SET_CONVERSATION_TITLE":
      return {
        ...state,
        conversationTitles: {
          ...state.conversationTitles,
          [action.payload.conversationId]: action.payload.title,
        },
      };

    case "SET_STREAMING_STATE":
      return {
        ...state,
        streamingState: action.payload,
      };

    case "UPDATE_STREAMING_PROGRESS":
      const currentState = state.streamingState || { status: 'idle', progress: 0 };
      return {
        ...state,
        streamingState: {
          ...currentState,
          ...action.payload,
        },
      };

    default:
      return state;
  }
}
