import React from "react";
import { Users, BarChart3, Percent } from "lucide-react";
import styles from "./AccountSmartStatsMessage.module.css";
import { ElfaAccountSmartStatsMessageProps } from "./AccountSmartStatsMessage.types";
import { Text } from "@chakra-ui/react";

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const ElfaAccountSmartStatsMessage: React.FC<
  ElfaAccountSmartStatsMessageProps
> = ({ metadata }) => {
  if (!metadata.success || !metadata.data) {
    return <Text>Failed to load account statistics.</Text>;
  }

  const stats = metadata.data;

  // Calculate engagement quality score (simplified example)
  const engagementQuality = Math.min(
    100,
    Math.round(
      stats.followerEngagementRatio * 100 + stats.averageEngagement / 10
    )
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Account Smart Statistics</span>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Users size={18} />
            <span>Smart Following</span>
          </div>
          <div className={styles.statValue}>
            {formatNumber(stats.smartFollowingCount)}
          </div>
          <div className={styles.statDescription}>
            Number of high-value accounts following this profile
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <BarChart3 size={18} />
            <span>Average Engagement</span>
          </div>
          <div className={styles.statValue}>
            {stats.averageEngagement.toFixed(2)}
          </div>
          <div className={styles.statDescription}>
            Average interactions per post
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Percent size={18} />
            <span>Follower Engagement Ratio</span>
          </div>
          <div className={styles.statValue}>
            {(stats.followerEngagementRatio * 100).toFixed(2)}%
          </div>
          <div className={styles.statDescription}>
            Percentage of followers who engage regularly
          </div>
        </div>
      </div>

      <div className={styles.insightSection}>
        <div className={styles.insightHeader}>Engagement Quality Score</div>
        <div className={styles.scoreContainer}>
          <div className={styles.scoreBar}>
            <div
              className={styles.scoreProgress}
              style={{ width: `${engagementQuality}%` }}
            />
          </div>
          <div className={styles.scoreValue}>{engagementQuality}/100</div>
        </div>
        <div className={styles.insightText}>
          {engagementQuality >= 80
            ? "Excellent engagement quality with high follower interaction."
            : engagementQuality >= 60
            ? "Good engagement quality with active follower base."
            : engagementQuality >= 40
            ? "Moderate engagement quality with potential for improvement."
            : "Low engagement quality. Consider improving content strategy."}
        </div>
      </div>
    </div>
  );
};
