// Core interfaces for agent system
export interface ChatRequest {
  prompt: {
    role: string;
    content: string;
  };
  chatHistory?: Array<{
    role: string;
    content: string;
  }>;
  conversationId: string;
  requestId?: string;
  useResearch?: boolean;
  selectedAgents?: string[];
}

export enum ResponseType {
  SUCCESS = 'success',
  ERROR = 'error',
  NEEDS_INFO = 'needs_info',
  ACTION_REQUIRED = 'action_required',
  RESEARCH = 'research',
}

export interface AgentResponse {
  responseType: ResponseType;
  content?: string;
  errorMessage?: string;
  actionType?: string;
  metadata?: Record<string, any>;
}

export interface AgentDefinition {
  name: string;
  description: string;
  capabilities: string[];
  tags?: string[];
}

export interface TelemetryData {
  processingTime?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    cachedPromptTokens?: number;
  };
}

export interface SubtaskOutput {
  subtask: string;
  output: string;
  agents: string[];
  telemetry?: TelemetryData;
}