// CodexTopHoldersMessage.types.ts

interface TokenPair {
  token0: string;
  token1: string;
}

interface Exchange {
  name: string;
}

interface TokenDetails {
  address: string;
  decimals: number;
  name: string;
  networkId: number;
  symbol: string;
}

interface TokenFilterResult {
  buyCount1?: number;
  high1?: string;
  txnCount1?: number;
  uniqueTransactions1?: number;
  volume1?: string;
  liquidity?: string;
  marketCap?: string;
  priceUSD?: string;
  pair?: TokenPair;
  exchanges?: Exchange[];
  token?: TokenDetails;
}

interface TopHoldersMetadata {
  success: boolean;
  data: number; // Percentage owned by top 10 holders
  token_info?: TokenFilterResult;
}

interface CodexTopHoldersMessageProps {
  metadata: TopHoldersMetadata;
}

export type { CodexTopHoldersMessageProps, TopHoldersMetadata };
