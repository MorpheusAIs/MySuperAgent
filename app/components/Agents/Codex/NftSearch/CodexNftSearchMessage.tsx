import React, { useState } from "react";
import {
  Image,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import styles from "./CodexNftSearchMessage.module.css";
import {
  CodexNftSearchMessageProps,
  NftItem,
} from "./CodexNftSearchMessage.types";
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

const ChangeDisplay: React.FC<{ value: number }> = ({ value }) => {
  const isPositive = value > 0;
  return (
    <span className={isPositive ? styles.positive : styles.negative}>
      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {value.toFixed(2)}%
    </span>
  );
};

export const CodexNftSearchMessage: React.FC<CodexNftSearchMessageProps> = ({
  metadata,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!metadata.success) {
    return <Text>Failed to load NFT data.</Text>;
  }

  if (!metadata.items || metadata.items.length === 0) {
    return <Text>No NFT collections found matching your search.</Text>;
  }

  const displayItems = showAll
    ? metadata.items
    : metadata.items.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>NFT Collection Search Results</span>
        <span className={styles.total}>
          Found: {metadata.items.length}{" "}
          {metadata.hasMore > 0 && `(${metadata.hasMore} more available)`}
        </span>
      </div>

      {displayItems.map((item: NftItem) => (
        <div key={item.id} className={styles.nftCard}>
          <div className={styles.cardHeader}>
            <div className={styles.collectionInfo}>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name || "NFT Collection"}
                  className={styles.collectionImage}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <Image size={20} />
                </div>
              )}
              <div className={styles.collectionDetails}>
                <div className={styles.collectionName}>
                  {item.name || "Unnamed Collection"}
                </div>
                {item.symbol && (
                  <div className={styles.collectionSymbol}>{item.symbol}</div>
                )}
              </div>
            </div>
            <div className={styles.networkInfo}>
              ID: {item.networkId} • {item.window}
            </div>
          </div>

          <div className={styles.priceGrid}>
            <div className={styles.priceItem}>
              <div className={styles.priceLabel}>Floor</div>
              <div className={styles.priceValue}>
                <DollarSign size={14} />
                {item.floor}
              </div>
            </div>
            <div className={styles.priceItem}>
              <div className={styles.priceLabel}>Ceiling</div>
              <div className={styles.priceValue}>
                <DollarSign size={14} />
                {item.ceiling}
              </div>
            </div>
            <div className={styles.priceItem}>
              <div className={styles.priceLabel}>Average</div>
              <div className={styles.priceValue}>
                <DollarSign size={14} />
                {item.average}
              </div>
            </div>
          </div>

          <div className={styles.activityContainer}>
            <div className={styles.activityItem}>
              <div className={styles.activityLabel}>Volume</div>
              <div className={styles.activityValue}>
                {formatNumber(item.volume)}
                <div className={styles.changeValue}>
                  <ChangeDisplay value={item.volumeChange} />
                </div>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityLabel}>Trades</div>
              <div className={styles.activityValue}>
                {formatNumber(item.tradeCount)}
                <div className={styles.changeValue}>
                  <ChangeDisplay value={item.tradeCountChange} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.address}>
              {item.address.slice(0, 8)}...{item.address.slice(-8)}
            </div>
            <a
              href={`https://etherscan.io/address/${item.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.explorerLink}
            >
              View <ExternalLink size={12} />
            </a>
          </div>
        </div>
      ))}

      {metadata.items.length > INITIAL_DISPLAY_COUNT && (
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

export default CodexNftSearchMessage;
