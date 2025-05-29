/**
 * Types for token usage information from the LLM.
 */
export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/**
 * Types for task summary information from each agent task.
 */
export interface TaskSummary {
  task_index: number;
  output_length: number;
  output_preview: string;
}

/**
 * Types for processing time tracking.
 */
export interface ProcessingTime {
  start_time?: number;
  end_time?: number;
  duration?: number;
}

/**
 * Types for subtask telemetry information.
 */
export interface Telemetry {
  token_usage?: TokenUsage;
  processing_time?: ProcessingTime;
}

/**
 * Types for subtask outputs from orchestration.
 */
export interface SubtaskOutput {
  key?: string; // backward compatibility
  value?: string; // backward compatibility
  subtask?: string;
  output?: string;
  agents?: string[];
  telemetry?: Telemetry;
}

/**
 * Import Final Answer Action types
 */
export * from './FinalAnswerAction.types';

/**
 * Metadata structure for crew responses as returned by BasicOrchestrator.
 */
export interface CrewResponseMetadata {
  /**
   * Indicates if the response was produced through agent collaboration
   */
  collaboration?: string;

  /**
   * List of agents that contributed to the response
   */
  contributing_agents?: string[];

  /**
   * Token usage statistics from the LLM
   */
  token_usage?: TokenUsage;

  /**
   * Summaries of each task executed by the crew
   */
  task_summaries?: TaskSummary[];

  /**
   * Outputs from subtasks in orchestration flows
   */
  subtask_outputs?: SubtaskOutput[];

  /**
   * Action-based results that can be executed from the UI
   */
  final_answer_actions?: import('./FinalAnswerAction.types').FinalAnswerAction[];

  /**
   * Any additional metadata fields
   */
  [key: string]: any;
}
