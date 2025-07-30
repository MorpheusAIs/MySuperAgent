export type ChatMessageBase = {
  role: string;
  content: string | any;
  responseType?: string;
  agentName?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  requires_action?: boolean;
  action_type?: string;
  timestamp?: number;
  id?: string;
  isStreaming?: boolean;
};

export type UserMessage = ChatMessageBase & {
  role: "user";
  content: string;
};

export type AssistantMessage = ChatMessageBase & {
  role: "assistant";
  content:
    | string
    | ImageMessageContent
    | CryptoDataMessageContent
    | BaseMessageContent
    | SwapMessageContent
    | ClaimMessagePayload;
};

export interface Conversation {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  hasUploadedFile: boolean;
  scheduledJobId?: number;
}

export interface LocalStorageData {
  conversations: { [key: string]: Conversation };
  lastConversationId: number;
}

export type SwapTxPayloadType = {
  dstAmount: string;
  tx: {
    data: string;
    from: string;
    gas: number;
    gasPrice: string;
    to: string;
    value: string;
  };
};

export type ApproveTxPayloadType = {
  data: string;
  gasPrice: string;
  to: string;
  value: string;
};

export type SwapMessageContent = {
  content: string;
  metadata: SwapMessagePayload;
  requires_action: boolean;
  action_type: "swap";
};

export type SwapMessagePayload = {
  dst: string;
  dst_address: string;
  dst_amount: number;
  src: string;
  src_address: string;
  src_amount: number;
  approve_tx_cb: string;
  swap_tx_cb: string;
};

export type ImageMessageContent = {
  success: boolean;
  service: string;
  image: string;
  error?: string;
};

export type CryptoDataMessageContent = {
  data: string;
  coinId: string;
};

export type BaseMessageContent = {
  message: string;
  actionType?: string;
};

export type ClaimTransactionPayload = {
  to: string;
  data: string;
  value: string;
  gas: string;
  chainId: string;
};

export type ClaimMessagePayload = {
  content: {
    transactions: {
      pool: number;
      transaction: ClaimTransactionPayload;
    }[];
    claim_tx_cb: string;
  };
  role: "claim";
};

export type ChatMessage = UserMessage | AssistantMessage;

export type ChatsListItem = {
  index: number;
  title: string;
};

export interface XCredentials {
  api_key: string;
  api_secret: string;
  access_token: string;
  access_token_secret: string;
  bearer_token: string;
}

export interface CoinbaseCredentials {
  cdp_api_key: string;
  cdp_api_secret: string;
}

export interface OneInchCredentials {
  api_key: string;
}

/**
 * Represents all available agent types in the system.
 * Each agent type corresponds to a specific message renderer and functionality.
 */
export enum AgentType {
  /**
   * Handles image generation requests and responses
   */
  IMAGEN = "imagen",

  /**
   * Processes and displays cryptocurrency data and charts
   */
  CRYPTO_DATA = "crypto_data",

  /**
   * Manages Base blockchain operations (transfers and swaps)
   */
  BASE_AGENT = "base_agent",

  /**
   * Handles token swap operations across different protocols
   */
  TOKEN_SWAP = "token_swap",

  /**
   * Provides DEX screening and token analysis
   */
  DEXSCREENER = "dexscreener",

  /**
   * Provides DEX screening and token analysis
   */
  ELFA = "elfa",

  /**
   * Provides crypto data via Codex.io
   */
  CODEX = "codex",

  /**
   * Manages Dollar Cost Averaging (DCA) strategies
   */
  DCA_AGENT = "dca_agent",

  /**
   * Processes and formats tweet content
   */
  TWEET_SIZZLER = "tweet_sizzler",

  /**
   * Manages MOR claims and rewards tracking
   */
  MOR_CLAIMS = "mor_claims",

  /**
   * Manages MOR rewards tracking
   */
  MOR_REWARDS = "mor_rewards",

  /**
   * Manages real-time search operations
   */
  REALTIME_SEARCH = "realtime_search",

  /**
   * Manages crypto news analysis
   */
  CRYPTO_NEWS = "crypto_news",

  /**
   * Manages crypto news analysis
   */
  NEWS_AGENT = "news_agent",

  /**
   * Manages document analysis / RAG
   */
  RAG = "rag",

  /**
   * Manages Rugcheck XYZ
   */
  RUGCHECK = "rugcheck",

  /**
   * The BasicOrchestrator crew combining multiple agents
   */
  BASIC_CREW = "basic_crew",

  /**
   * The DEFAULT agent
   */
  DEFAULT = "default",
}

/**
 * Type representing the possible action types for the Base agent
 */
export enum BaseAgentActionType {
  TRANSFER = "transfer",
  SWAP = "swap",
}

/**
 * Type guard to check if a string is a valid AgentType
 */
export const isValidAgentType = (type: string): type is AgentType => {
  return Object.values(AgentType).includes(type as AgentType);
};
