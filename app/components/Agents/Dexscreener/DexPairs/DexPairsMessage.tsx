import React, { useState } from "react";
import {
  ExternalLink,
  DollarSign,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Droplet,
} from "lucide-react";
import {
  FaTwitter,
  FaTelegram,
  FaGlobe,
  FaLink,
  FaChevronDown,
  FaChevronUp,
  FaCircle,
} from "react-icons/fa";
import { SiCoinmarketcap, SiMedium, SiDiscord, SiGithub } from "react-icons/si";
import styles from "./DexPairsMessage.module.css";
import { DexPairsMessageProps } from "./DexPairsMessage.types";
import { Text } from "@chakra-ui/react";

const INITIAL_DISPLAY_COUNT = 4;

export const DexPairsMessage: React.FC<DexPairsMessageProps> = ({
  metadata,
}) => {
  const [showAll, setShowAll] = useState(false);

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "N/A";

    if (price < 0.00001) {
      return price.toExponential(4);
    }

    return price.toFixed(Math.min(6, getDecimalPlaces(price) + 2));
  };

  const getDecimalPlaces = (num: number) => {
    if (num === 0) return 0;
    const match = num.toString().match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) return 0;
    return Math.max(
      0,
      (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0)
    );
  };

  const formatNumber = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return "N/A";

    const num = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(num)) return "N/A";

    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    }
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const getSocialIcon = (type = "") => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("twitter")) return <FaTwitter />;
    if (lowerType.includes("telegram")) return <FaTelegram />;
    if (lowerType.includes("website")) return <FaGlobe />;
    if (lowerType.includes("medium")) return <SiMedium />;
    if (lowerType.includes("discord")) return <SiDiscord />;
    if (lowerType.includes("github")) return <SiGithub />;
    if (lowerType.includes("coinmarketcap") || lowerType.includes("cmc"))
      return <SiCoinmarketcap />;
    return <FaLink />;
  };

  const { pairs = [] } = metadata || {};
  const displayPairs = showAll ? pairs : pairs.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>DexScreener Trading Pairs</Text>
        <Text className={styles.subtitle}>
          Found {pairs.length} popular DEX trading pairs
        </Text>
      </div>

      <div className={styles.pairList}>
        {displayPairs.map((pair, index) => (
          <div key={pair.pairAddress} className={styles.pairCard}>
            <div className={styles.pairHeader}>
              <div className={styles.pairInfo}>
                <div className={styles.pairTokens}>
                  <span className={styles.baseToken}>
                    {pair.baseToken?.symbol || "Unknown"}
                  </span>
                  <span className={styles.separator}>/</span>
                  <span className={styles.quoteToken}>
                    {pair.quoteToken?.symbol || "Unknown"}
                  </span>
                </div>
                <div className={styles.pairDetails}>
                  <span className={styles.dex}>
                    {pair.dexId.charAt(0).toUpperCase() + pair.dexId.slice(1)}
                  </span>
                  <span className={styles.chainBadge}>
                    {pair.chainId.toUpperCase()}
                  </span>
                </div>
              </div>
              <a
                href={pair.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pairLink}
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div className={styles.priceSection}>
              <div className={styles.priceContainer}>
                <DollarSign className={styles.priceIcon} size={14} />
                <span className={styles.price}>
                  {formatPrice(pair.priceUsd)}
                </span>
                {pair.priceChange?.h24 !== undefined && (
                  <span
                    className={`${styles.priceChange} ${
                      Number(pair.priceChange.h24) >= 0
                        ? styles.positive
                        : styles.negative
                    }`}
                  >
                    {Number(pair.priceChange.h24) >= 0 ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownRight size={16} />
                    )}
                    {Math.abs(Number(pair.priceChange.h24)).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <BarChart2 size={14} className={styles.statIcon} />
                <span className={styles.statLabel}>24h Volume:</span>
                <span className={styles.statValue}>
                  {formatNumber(pair.volume?.h24)}
                </span>
              </div>
              <div className={styles.statItem}>
                <Droplet size={14} className={styles.statIcon} />
                <span className={styles.statLabel}>Liquidity:</span>
                <span className={styles.statValue}>
                  {formatNumber(pair.liquidity?.usd)}
                </span>
              </div>
              {pair.txns?.h24 && (
                <div className={styles.txStats}>
                  <div className={styles.txCount}>
                    <span className={styles.txLabel}>24h Txns:</span>
                    <span className={styles.txValue}>
                      {(pair.txns.h24.buys || 0) + (pair.txns.h24.sells || 0)}
                    </span>
                  </div>
                  <div className={styles.buysSells}>
                    <div className={styles.txBuys}>
                      <FaCircle className={styles.buyIcon} />
                      <span>{pair.txns.h24.buys || 0}</span>
                    </div>
                    <div className={styles.txSells}>
                      <FaCircle className={styles.sellIcon} />
                      <span>{pair.txns.h24.sells || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {pair.baseToken?.links && pair.baseToken.links.length > 0 && (
              <div className={styles.linksSection}>
                <div className={styles.linksList}>
                  <a
                    href={pair.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkItem}
                  >
                    <span className={styles.linkLabel}>DexScreener</span>
                  </a>
                  {pair.baseToken.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkItem}
                    >
                      {getSocialIcon(link.type || link.label)}
                      <span className={styles.linkLabel}>
                        {link.type || link.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {pairs.length === 0 && (
          <div className={styles.noPairs}>
            No DEX pairs found matching your search.
          </div>
        )}
      </div>

      {pairs.length > INITIAL_DISPLAY_COUNT && (
        <button
          onClick={() => setShowAll(!showAll)}
          className={styles.showMoreButton}
        >
          {showAll ? (
            <>
              Show Less <FaChevronUp />
            </>
          ) : (
            <>
              Show More ({pairs.length - INITIAL_DISPLAY_COUNT} more){" "}
              <FaChevronDown />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default DexPairsMessage;
