import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import styles from "./CodexTopTokensMessage.module.css";
import {
  CodexTopTokensMessageProps,
  Token,
} from "@/components/Agents/Codex/TopTokens/CodexTopTokensMessage.types";
import { Text } from "@chakra-ui/react";

const INITIAL_DISPLAY_COUNT = 3;

const formatNumber = (num: string | number): string => {
  const value = typeof num === "string" ? parseFloat(num) : num;
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

const formatPrice = (price: number): string => {
  if (price < 0.00001) {
    return price.toExponential(4);
  }
  return price.toFixed(6);
};

const PriceChange: React.FC<{ change?: number; label: string }> = ({
  change,
  label,
}) => {
  if (change === undefined) return null;

  const displayChange = change * 100; // Convert from decimal to percentage
  const isPositive = displayChange > 0;

  return (
    <div className={styles.priceChangeItem}>
      <span className={styles.timeLabel}>{label}</span>
      <span className={isPositive ? styles.positive : styles.negative}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {displayChange.toFixed(2)}%
      </span>
    </div>
  );
};

export const CodexTopTokensMessage: React.FC<CodexTopTokensMessageProps> = ({
  metadata,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!metadata.success || !metadata.data) {
    return <Text>Failed to load token data.</Text>;
  }

  const displayTokens = showAll
    ? metadata.data
    : metadata.data.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Top Trending Tokens</span>
        <span className={styles.total}>Total: {metadata.data.length}</span>
      </div>

      {displayTokens.map((token: Token) => (
        <div key={token.address} className={styles.tokenCard}>
          <div className={styles.mainInfo}>
            <div className={styles.tokenInfo}>
              {token.imageThumbUrl && (
                <img
                  src={token.imageThumbUrl}
                  alt={token.symbol}
                  className={styles.tokenImage}
                />
              )}
              <div className={styles.tokenDetails}>
                <div className={styles.tokenSymbol}>${token.symbol}</div>
                <div className={styles.tokenName}>{token.name}</div>
              </div>
            </div>

            <div className={styles.priceSection}>
              <div className={styles.currentPrice}>
                <DollarSign size={12} />
                {formatPrice(token.price)}
              </div>
              <div className={styles.contractInfo}>
                {token.networkId} • {token.address.slice(0, 6)}...
                {token.address.slice(-4)}
              </div>
            </div>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricsColumn}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Market Cap:</span>
                <span>
                  {token.marketCap ? formatNumber(token.marketCap) : "N/A"}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Liquidity:</span>
                <span>{formatNumber(token.liquidity)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Volume:</span>
                <span>{formatNumber(token.volume)}</span>
              </div>
            </div>

            <div className={styles.metricsColumn}>
              {token.txnCount24 && (
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>24h Txns:</span>
                  <span>{formatNumber(token.txnCount24)}</span>
                </div>
              )}
              {token.uniqueBuys24 && (
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Buyers:</span>
                  <span>{formatNumber(token.uniqueBuys24)}</span>
                </div>
              )}
              {token.uniqueSells24 && (
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Sellers:</span>
                  <span>{formatNumber(token.uniqueSells24)}</span>
                </div>
              )}
            </div>

            <div className={styles.priceChanges}>
              <PriceChange change={token.priceChange1} label="1h" />
              <PriceChange change={token.priceChange4} label="4h" />
              <PriceChange change={token.priceChange12} label="12h" />
              <PriceChange change={token.priceChange24} label="24h" />
            </div>
          </div>
        </div>
      ))}

      {metadata.data.length > INITIAL_DISPLAY_COUNT && (
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

export default CodexTopTokensMessage;
