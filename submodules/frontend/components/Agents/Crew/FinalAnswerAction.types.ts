/**
 * Supported final answer action types
 */
export enum FinalAnswerActionType {
  TWEET = "tweet",
  SWAP = "swap",
  TRANSFER = "transfer",
  IMAGE_GENERATION = "image_generation",
  ANALYSIS = "analysis",
  // Add more action types as needed
}

/**
 * Base metadata interface for all final answer actions
 */
export interface FinalAnswerActionBaseMetadata {
  agent: string; // Agent responsible for executing the action
  action_id?: string; // Optional unique identifier for the action
  timestamp?: number; // Optional timestamp when the action was created
}

/**
 * Tweet-specific action metadata
 */
export interface TweetActionMetadata extends FinalAnswerActionBaseMetadata {
  content: string; // The content of the tweet
  hashtags?: string[]; // Optional hashtags to include
  image_url?: string; // Optional URL to an image to attach
}

/**
 * Swap-specific action metadata
 */
export interface SwapActionMetadata extends FinalAnswerActionBaseMetadata {
  from_token: string;
  to_token: string;
  amount: string;
  slippage?: number;
}

/**
 * Transfer-specific action metadata
 */
export interface TransferActionMetadata extends FinalAnswerActionBaseMetadata {
  token: string;
  to_address: string;
  amount: string;
}

/**
 * Image generation action metadata
 */
export interface ImageGenerationActionMetadata extends FinalAnswerActionBaseMetadata {
  prompt: string;
  negative_prompt?: string;
  style?: string;
}

/**
 * Analysis action metadata
 */
export interface AnalysisActionMetadata extends FinalAnswerActionBaseMetadata {
  type: string; // Type of analysis (e.g., "token", "wallet", "trade")
  subject: string; // Subject of analysis
  parameters?: Record<string, any>; // Additional parameters for the analysis
}

/**
 * Union type for all action metadata types
 */
export type FinalAnswerActionMetadata =
  | TweetActionMetadata
  | SwapActionMetadata
  | TransferActionMetadata
  | ImageGenerationActionMetadata
  | AnalysisActionMetadata;

/**
 * Final answer action interface
 */
export interface FinalAnswerAction {
  action_type: FinalAnswerActionType;
  metadata: FinalAnswerActionMetadata;
  description?: string; // Optional human-readable description of the action
}

/**
 * List of supported final answer actions
 */
export const SUPPORTED_FINAL_ANSWER_ACTIONS = [
  {
    type: FinalAnswerActionType.TWEET,
    name: "Tweet",
    description: "Create and share a tweet",
    agent: "tweet_sizzler",
  },
  {
    type: FinalAnswerActionType.SWAP,
    name: "Token Swap",
    description: "Swap one token for another",
    agent: "token_swap",
  },
  {
    type: FinalAnswerActionType.TRANSFER,
    name: "Token Transfer",
    description: "Transfer tokens to an address",
    agent: "token_swap",
  },
  {
    type: FinalAnswerActionType.IMAGE_GENERATION,
    name: "Generate Image",
    description: "Generate an image based on a prompt",
    agent: "imagen",
  },
  {
    type: FinalAnswerActionType.ANALYSIS,
    name: "Analysis",
    description: "Analyze tokens, wallets, or trades",
    agent: "codex",
  },
];