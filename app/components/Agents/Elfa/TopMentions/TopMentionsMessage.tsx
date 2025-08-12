// ElfaTopMentionsMessage.tsx
import React, { useState } from "react";
import {
  Eye,
  MessageCircle,
  Heart,
  Repeat,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import styles from "./TopMentionsMessage.module.css";
import {
  ElfaTopMentionsMessageProps,
  Mention,
} from "./TopMentionsMessage.types";
import { Text } from "@chakra-ui/react";

const INITIAL_DISPLAY_COUNT = 3;

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

export const ElfaTopMentionsMessage: React.FC<ElfaTopMentionsMessageProps> = ({
  metadata,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!metadata.success || !metadata.data) {
    return <Text>Failed to load mentions data.</Text>;
  }

  const { data: mentions, total } = metadata.data;
  const displayMentions = showAll
    ? mentions
    : mentions.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Top Social Mentions</span>
        <span className={styles.total}>
          Total: {total} mentions over the last 1D
        </span>
      </div>

      {displayMentions.map((mention: Mention) => (
        <div key={mention.id} className={styles.mentionCard}>
          <div className={styles.content}>{mention.content}</div>

          <div className={styles.metricsList}>
            <div className={styles.metric}>
              <Eye size={16} />
              <span>{formatNumber(mention.metrics.view_count)}</span>
            </div>
            <div className={styles.metric}>
              <Repeat size={16} />
              <span>{formatNumber(mention.metrics.repost_count)}</span>
            </div>
            <div className={styles.metric}>
              <MessageCircle size={16} />
              <span>{formatNumber(mention.metrics.reply_count)}</span>
            </div>
            <div className={styles.metric}>
              <Heart size={16} />
              <span>{formatNumber(mention.metrics.like_count)}</span>
            </div>
          </div>

          <div className={styles.timestamp}>
            {formatDate(mention.mentioned_at)}
          </div>
        </div>
      ))}

      {mentions.length > INITIAL_DISPLAY_COUNT && (
        <button
          onClick={() => setShowAll(!showAll)}
          className={styles.showMoreButton}
        >
          {showAll ? (
            <>
              Show Less <ChevronUp size={16} />
            </>
          ) : (
            <>
              Show More <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
};
