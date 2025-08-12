// DexPairsMessage.types.ts

interface TokenLink {
  type: string;
  label: string;
  url: string;
}

interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string | null;
  header?: string | null;
  description?: string | null;
  links?: TokenLink[] | null;
  symbol?: string;
}

interface Transaction {
  buys: number;
  sells: number;
}

interface VolumeData {
  h24?: number;
  h6?: number;
  h1?: number;
  m5?: number;
}

interface PriceChangeData {
  h24?: string | number;
  h6?: string | number;
  h1?: string | number;
  m5?: string | number;
}

interface LiquidityData {
  usd?: number | string;
  base?: number | string;
  quote?: number | string;
}

interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: TokenProfile;
  quoteToken: TokenProfile;
  priceNative: number;
  priceUsd?: number | null;
  txns?: {
    h24?: Transaction;
    h6?: Transaction;
    h1?: Transaction;
    m5?: Transaction;
  };
  volume?: VolumeData;
  priceChange?: PriceChangeData;
  liquidity?: LiquidityData;
  fdv?: number | null;
  pairCreatedAt?: number | null;
  info?: {
    websites?: any[];
    socials?: any[];
  };
}

interface DexPairsMetadata {
  pairs: DexPair[];
}

interface DexPairsMessageProps {
  metadata: DexPairsMetadata;
}

export type {
  DexPairsMessageProps,
  DexPairsMetadata,
  DexPair,
  TokenProfile,
  TokenLink,
  Transaction,
  VolumeData,
  PriceChangeData,
  LiquidityData,
};
