// ElfaTopMentionsMessage.types.ts

interface Metrics {
  view_count: number;
  repost_count: number;
  reply_count: number;
  like_count: number;
}

interface Mention {
  id: number;
  content: string;
  mentioned_at: string;
  metrics: Metrics;
}

interface TopMentionsData {
  pageSize: number;
  page: number;
  total: number;
  data: Mention[];
}

interface TopMentionsMetadata {
  success: boolean;
  data: TopMentionsData;
}

interface ElfaTopMentionsMessageProps {
  metadata: TopMentionsMetadata;
}

export type {
  ElfaTopMentionsMessageProps,
  Mention,
  Metrics,
  TopMentionsData,
  TopMentionsMetadata,
};
