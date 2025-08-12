import { ChatMessage } from "@/services/types";

export interface TelemetryData {
  processing_time?: {
    duration: number;
  };
  token_usage?: {
    prompt?: number;
    response?: number;
    total?: number;
  };
}

export interface StreamingState {
  subtask?: string;
  agents?: string[];
  output?: string;
  status: 'idle' | 'dispatching' | 'processing' | 'synthesizing' | 'complete';
  progress: number;
  telemetry?: TelemetryData;
  currentAgentIndex?: number;
  totalAgents?: number;
  streamingContent?: string;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Record<string, ChatMessage[]>;
  currentConversationId: string;
  isLoading: boolean;
  error: string | null;
  conversationTitles: Record<string, string>;
  streamingState?: StreamingState;
  currentView: 'jobs' | 'chat';
}

export type ChatAction =
  | {
      type: "SET_MESSAGES";
      payload: { conversationId: string; messages: ChatMessage[] };
    }
  | { type: "SET_CURRENT_CONVERSATION"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "ADD_OPTIMISTIC_MESSAGE";
      payload: { conversationId: string; message: ChatMessage };
    }
  | {
      type: "SET_CONVERSATION_TITLE";
      payload: { conversationId: string; title: string };
    }
  | {
      type: "SET_STREAMING_STATE";
      payload: StreamingState;
    }
  | {
      type: "UPDATE_STREAMING_PROGRESS";
      payload: Partial<StreamingState>;
    }
  | {
      type: "SET_STREAMING_CONTENT";
      payload: { content: string; isStreaming: boolean };
    }
  | {
      type: "SET_CURRENT_VIEW";
      payload: 'jobs' | 'chat';
    };

export interface ChatContextType {
  state: ChatState;
  setCurrentConversation: (id: string) => void;
  sendMessage: (
    message: string,
    file: File | null,
    useResearch?: boolean,
    conversationId?: string
  ) => Promise<void>;
  refreshMessages: () => Promise<void>;
  refreshAllTitles: () => Promise<void>;
  refreshJobs: () => Promise<void>;
  deleteChat: (conversationId: string) => Promise<void>;
  setCurrentView: (view: 'jobs' | 'chat') => void;
}
