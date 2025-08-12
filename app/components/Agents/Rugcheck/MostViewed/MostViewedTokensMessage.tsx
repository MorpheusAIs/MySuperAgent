import React, { useState } from "react";
import { Eye, Users, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Text } from "@chakra-ui/react";
import styles from "./MostViewedTokensMessage.module.css";
import { ViewedTokensMessageProps } from "./MostViewedTokensMessage.types";

const INITIAL_DISPLAY_COUNT = 5;

export const ViewedTokensMessage: React.FC<ViewedTokensMessageProps> = ({
  metadata,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!metadata?.tokens || metadata.tokens.length === 0) {
    return (
      <div className={styles.container}>
        <Text className={styles.title}>No token view data available</Text>
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

  const displayTokens = showAll
    ? metadata.tokens
    : metadata.tokens.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Most Viewed Tokens (24h)</Text>
        <Text className={styles.subtitle}>
          Top {metadata.tokens.length} tokens by view count
        </Text>
      </div>

      <div className={styles.tokenList}>
        {displayTokens.map((token, index) => (
          <div key={token.mint} className={styles.tokenCard}>
            <div className={styles.tokenHeader}>
              <div className={styles.rankBadge}>#{index + 1}</div>
              <div className={styles.tokenInfo}>
                <div className={styles.tokenName}>
                  {token.metadata.name || "Unknown Token"}
                </div>
                <div className={styles.tokenSymbol}>
                  {token.metadata.symbol || "???"}
                </div>
              </div>
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

            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <Eye size={16} className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>
                    {token.visits.toLocaleString()}
                  </div>
                  <div className={styles.statLabel}>Total Views</div>
                </div>
              </div>

              <div className={styles.statItem}>
                <Users size={16} className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>
                    {token.user_visits.toLocaleString()}
                  </div>
                  <div className={styles.statLabel}>Unique Visitors</div>
                </div>
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
