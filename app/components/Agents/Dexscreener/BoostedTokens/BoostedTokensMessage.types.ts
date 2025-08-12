// BoostedTokensMessage.types.ts

interface TokenLink {
  type: string;
  label: string;
  url: string;
}

interface BoostedToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string | null;
  header?: string | null;
  description?: string | null;
  links?: TokenLink[] | null;
  amount: number;
  totalAmount: number;
}

interface BoostedTokensMetadata {
  chain_id?: string | null;
  tokens: BoostedToken[];
}

interface BoostedTokensMessageProps {
  metadata: BoostedTokensMetadata;
}

export type {
  BoostedTokensMessageProps,
  BoostedTokensMetadata,
  BoostedToken,
  TokenLink,
};
