import React, { useState } from "react";
import { Copy, Award, TrendingUp } from "lucide-react";
import {
  FaTwitter,
  FaTelegram,
  FaGlobe,
  FaLink,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { SiCoinmarketcap } from "react-icons/si";
import styles from "./BoostedTokensMessage.module.css";
import { BoostedTokensMessageProps } from "./BoostedTokensMessage.types";
import { Text } from "@chakra-ui/react";
import { Image } from "@chakra-ui/react";

const INITIAL_DISPLAY_COUNT = 5;

export const BoostedTokensMessage: React.FC<BoostedTokensMessageProps> = ({
  metadata,
}) => {
  const [showAll, setShowAll] = useState(false);

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatBoostAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(2);
  };

  const getLinkIcon = (labelOrType = "") => {
    const val = labelOrType.toLowerCase();
    if (val.includes("twitter")) return <FaTwitter size={16} />;
    if (val.includes("telegram")) return <FaTelegram size={16} />;
    if (val.includes("website")) return <FaGlobe size={16} />;
    if (val.includes("coinmarketcap") || val.includes("cmc"))
      return <SiCoinmarketcap size={16} />;
    return <FaLink size={16} />;
  };

  const { tokens = [] } = metadata || {};
  const displayTokens = showAll
    ? tokens
    : tokens.slice(0, INITIAL_DISPLAY_COUNT);

  // Calculate chain display name
  const chainName = metadata?.chain_id
    ? metadata.chain_id.charAt(0).toUpperCase() + metadata.chain_id.slice(1)
    : "All Chains";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Award className={styles.titleIcon} />
          <Text className={styles.title}>Boosted Tokens</Text>
          <Text className={styles.chainBadge}>{chainName}</Text>
        </div>
        <Text className={styles.subtitle}>
          Tokens with active promotional boosts on DexScreener
        </Text>
      </div>

      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th></th>
            <th></th>
            <th>Address</th>
            <th>Description</th>
            <th>Boost Amount</th>
            <th>Links</th>
          </tr>
        </thead>
        <tbody>
          {displayTokens.map((token: any, index: number) => (
            <tr key={token.tokenAddress} className={styles.row}>
              <td className={styles.rankCell}>#{index + 1}</td>
              <td className={styles.tokenCell}>
                {token.icon && (
                  <a href={token.url} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={token.icon}
                      alt=""
                      className={styles.tokenImg}
                    />
                  </a>
                )}
              </td>
              <td className={styles.addressCell}>
                <div className={styles.addressWrapper}>
                  <span className={styles.address}>
                    {truncateAddress(token.tokenAddress)}
                  </span>
                  <button
                    onClick={() => handleCopy(token.tokenAddress)}
                    className={styles.copyButton}
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className={styles.chainId}>{token.chainId}</div>
              </td>
              <td>
                <div className={styles.description}>
                  {token.description || "-"}
                </div>
              </td>
              <td className={styles.boostCell}>
                <div className={styles.boostAmount}>
                  <TrendingUp size={14} className={styles.boostIcon} />
                  <span>{formatBoostAmount(token.amount)}</span>
                </div>
                <div className={styles.totalBoost}>
                  Total: {formatBoostAmount(token.totalAmount)}
                </div>
              </td>
              <td className={styles.linksCell}>
                <div className={styles.links}>
                  <a
                    href={token.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    <FaGlobe size={16} />
                  </a>
                  {token.links?.map((link: any, idx: number) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      {getLinkIcon(link.label || link.type)}
                    </a>
                  ))}
                </div>
              </td>
            </tr>
          ))}

          {tokens.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.noDataCell}>
                No boosted tokens found
                {metadata?.chain_id ? ` for ${metadata.chain_id}` : ""}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {tokens.length > INITIAL_DISPLAY_COUNT && (
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
              Show More ({tokens.length - INITIAL_DISPLAY_COUNT} more){" "}
              <FaChevronDown />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default BoostedTokensMessage;
