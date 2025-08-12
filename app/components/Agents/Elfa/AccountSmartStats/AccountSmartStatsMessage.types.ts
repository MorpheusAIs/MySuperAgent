// ElfaAccountSmartStatsMessage.types.ts

interface AccountSmartStats {
  followerEngagementRatio: number;
  averageEngagement: number;
  smartFollowingCount: number;
}

interface AccountSmartStatsMetadata {
  success: boolean;
  data: AccountSmartStats;
}

interface ElfaAccountSmartStatsMessageProps {
  metadata: AccountSmartStatsMetadata;
}

export type {
  ElfaAccountSmartStatsMessageProps,
  AccountSmartStats,
  AccountSmartStatsMetadata,
};
