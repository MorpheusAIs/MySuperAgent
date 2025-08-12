// CodexTopTokensMessage.types.ts

interface Token {
  address: string;
  name: string;
  symbol: string;
  networkId: number;
  createdAt: number;
  lastTransaction: number;
  imageBannerUrl?: string;
  imageLargeUrl?: string;
  imageSmallUrl?: string;
  imageThumbUrl?: string;
  price: number;
  marketCap?: string;
  liquidity: string;
  volume: string;
  priceChange1?: number;
  priceChange4?: number;
  priceChange12?: number;
  priceChange24?: number;
  txnCount24?: number;
  uniqueBuys24?: number;
  uniqueSells24?: number;
}

interface TopTokensMetadata {
  success: boolean;
  data: Token[];
}

interface CodexTopTokensMessageProps {
  metadata: TopTokensMetadata;
}

export type { CodexTopTokensMessageProps, TopTokensMetadata, Token };
