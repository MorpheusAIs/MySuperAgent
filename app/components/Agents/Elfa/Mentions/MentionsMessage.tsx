import React, { useState } from "react";
import {
  Eye,
  MessageCircle,
  Heart,
  Repeat,
  ChevronDown,
  ChevronUp,
  Bookmark,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import styles from "./MentionsMessage.module.css";
import { ElfaMentionsMessageProps } from "./MentionsMessage.types";
import { Text } from "@chakra-ui/react";

const INITIAL_DISPLAY_COUNT = 3;

const formatNumber = (num?: number): string => {
  if (!num) return "0";
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
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

export const ElfaMentionsMessage: React.FC<ElfaMentionsMessageProps> = ({
  metadata,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!metadata?.success || !metadata?.data) {
    return <Text>Failed to load mentions data.</Text>;
  }

  const mentions = metadata.data;
  const displayMentions = showAll
    ? mentions
    : mentions.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Latest Social Media Mentions</span>
        <span className={styles.total}>Total: {mentions.length} mentions</span>
      </div>

      {displayMentions.map((mention) => (
        <div key={mention.id} className={styles.mentionCard}>
          <div className={styles.accountInfo}>
            <div className={styles.accountDetails}>
              {mention.account?.data?.profileImageUrl ? (
                <Image
                  src={mention.account.data.profileImageUrl}
                  alt={mention.account.username || "Profile"}
                  className={styles.profileImage}
                  width={48}
                  height={48}
                />
              ) : (
                <div className={styles.profilePlaceholder}></div>
              )}
              <div>
                <div className={styles.accountName}>
                  {mention.account?.data?.name || "Unknown"}
                  {mention.account?.isVerified && (
                    <span className={styles.verifiedBadge}>
                      <CheckCircle size={12} />
                    </span>
                  )}
                </div>
                <div className={styles.username}>
                  @{mention.account?.username || "unknown"}
                </div>
              </div>
            </div>
            <div className={styles.followInfo}>
              <span>
                {formatNumber(mention.account?.followerCount)} followers
              </span>
            </div>
          </div>

          <div className={styles.content}>{mention.content}</div>

          <div className={styles.metricsList}>
            <div className={styles.metric}>
              <Eye size={16} />
              <span>{formatNumber(mention.viewCount)}</span>
            </div>
            <div className={styles.metric}>
              <Repeat size={16} />
              <span>{formatNumber(mention.repostCount)}</span>
            </div>
            <div className={styles.metric}>
              <MessageCircle size={16} />
              <span>{formatNumber(mention.replyCount)}</span>
            </div>
            <div className={styles.metric}>
              <Heart size={16} />
              <span>{formatNumber(mention.likeCount)}</span>
            </div>
            <div className={styles.metric}>
              <Bookmark size={16} />
              <span>{formatNumber(mention.bookmarkCount)}</span>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.timestamp}>
              {formatDate(mention.mentionedAt)}
            </div>
            {mention.originalUrl && (
              <a
                href={mention.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.viewOriginal}
              >
                View Original <ExternalLink size={14} />
              </a>
            )}
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
              Show More ({mentions.length - INITIAL_DISPLAY_COUNT} more){" "}
              <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
};
