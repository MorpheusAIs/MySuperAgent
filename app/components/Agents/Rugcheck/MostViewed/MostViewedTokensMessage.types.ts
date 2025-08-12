// ViewedTokensMessage.types.ts

interface TokenMetadata {
  name?: string;
  symbol?: string;
  [key: string]: any;
}

interface ViewedToken {
  mint: string;
  metadata: TokenMetadata;
  visits: number;
  user_visits: number;
}

interface ViewedTokensMetadata {
  tokens: ViewedToken[];
}

interface ViewedTokensMessageProps {
  metadata: ViewedTokensMetadata;
}

export type {
  ViewedTokensMessageProps,
  ViewedTokensMetadata,
  ViewedToken,
  TokenMetadata,
};
