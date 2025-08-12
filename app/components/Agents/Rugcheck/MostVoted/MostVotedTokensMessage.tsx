import React, { useState } from "react";
import { ThumbsUp, Vote, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Text } from "@chakra-ui/react";
import styles from "./MostVotedTokensMessage.module.css";
import { VotedTokensMessageProps } from "./MostVotedTokensMessage.types";

const INITIAL_DISPLAY_COUNT = 5;

export const VotedTokensMessage: React.FC<VotedTokensMessageProps> = ({
  metadata,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!metadata?.tokens || metadata.tokens.length === 0) {
    return (
      <div className={styles.container}>
        <Text className={styles.title}>No token voting data available</Text>
      </div>
    );
  }

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getApprovalClass = (upvotes: number, total: number) => {
    const ratio = upvotes / total;
    if (ratio >= 0.8) return styles.highApproval;
    if (ratio >= 0.5) return styles.mediumApproval;
    return styles.lowApproval;
  };

  const displayTokens = showAll
    ? metadata.tokens
    : metadata.tokens.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Most Voted Tokens (24h)</Text>
        <Text className={styles.subtitle}>
          Top {metadata.tokens.length} tokens by community votes
        </Text>
      </div>

      <div className={styles.tokenList}>
        {displayTokens.map((token, index) => (
          <div key={token.mint} className={styles.tokenCard}>
            <div className={styles.tokenHeader}>
              <div className={styles.tokenInfo}>
                <div className={styles.rankBadge}>#{index + 1}</div>
                <div className={styles.addressWrapper}>
                  <span className={styles.address}>
                    {truncateAddress(token.mint)}
                  </span>
                  <button
                    onClick={() => handleCopy(token.mint)}
                    className={styles.copyButton}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.statsGroup}>
                <div className={styles.statItem}>
                  <ThumbsUp size={14} className={styles.statIcon} />
                  <div className={styles.statValue}>
                    {token.up_count.toLocaleString()}
                  </div>
                </div>

                <div className={styles.statItem}>
                  <Vote size={14} className={styles.statIcon} />
                  <div className={styles.statValue}>
                    {token.vote_count.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.approvalSection}>
              <div className={styles.approvalHeader}>
                <div className={styles.approvalLabel}>Community Approval</div>
                <div className={styles.approvalValue}>
                  {((token.up_count / token.vote_count) * 100).toFixed(1)}%
                </div>
              </div>
              <div className={styles.approvalBar}>
                <div
                  className={`${styles.approvalFill} ${getApprovalClass(
                    token.up_count,
                    token.vote_count
                  )}`}
                  style={{
                    width: `${(token.up_count / token.vote_count) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {metadata.tokens.length > INITIAL_DISPLAY_COUNT && (
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
              Show More ({metadata.tokens.length - INITIAL_DISPLAY_COUNT} more){" "}
              <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
};
