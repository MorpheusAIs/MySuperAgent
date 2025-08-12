// OneInchSwapMessage.types.ts

export interface SwapMetadata {
  src?: string;
  dst?: string;
  src_address?: string;
  dst_address?: string;
  src_amount?: number;
  dst_amount?: number;
}

export interface OneInchSwapMessageProps {
  content: string | React.ReactNode;
  metadata?: SwapMetadata;
}

// Note: Main SwapTx type is now imported directly from useSwapTransaction.ts
