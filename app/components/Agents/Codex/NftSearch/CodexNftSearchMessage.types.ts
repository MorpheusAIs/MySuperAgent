// CodexNftSearchMessage.types.ts

interface NftItem {
  address: string;
  average: string;
  ceiling: string;
  floor: string;
  id: string;
  imageUrl?: string | null;
  name?: string | null;
  networkId: number;
  symbol?: string | null;
  tradeCount: string;
  tradeCountChange: number;
  volume: string;
  volumeChange: number;
  window: string;
}

interface NftSearchMetadata {
  success: boolean;
  hasMore: number;
  items: NftItem[];
}

interface CodexNftSearchMessageProps {
  metadata: NftSearchMetadata;
}

export type { CodexNftSearchMessageProps, NftItem, NftSearchMetadata };
