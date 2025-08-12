// VotedTokensMessage.types.ts

interface VotedToken {
  mint: string;
  up_count: number;
  vote_count: number;
}

interface VotedTokensMetadata {
  tokens: VotedToken[];
}

interface VotedTokensMessageProps {
  metadata: VotedTokensMetadata;
}

export type { VotedTokensMessageProps, VotedTokensMetadata, VotedToken };
