// ElfaTrendingTokensMessage.types.ts

interface TokenData {
  token: string;
  current_count: number;
  previous_count: number;
  change_percent: number;
}

interface TrendingTokensData {
  pageSize: number;
  page: number;
  total: number;
  data: TokenData[];
}

interface TrendingTokensMetadata {
  success: boolean;
  data: TrendingTokensData;
}

interface ElfaTrendingTokensMessageProps {
  metadata: TrendingTokensMetadata;
}

export type {
  ElfaTrendingTokensMessageProps,
  TokenData,
  TrendingTokensData,
  TrendingTokensMetadata,
};
