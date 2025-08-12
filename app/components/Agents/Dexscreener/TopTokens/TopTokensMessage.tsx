// TopTokensMessage.tsx
import React, { useState } from "react";
import { Copy } from "lucide-react";
import {
  FaTwitter,
  FaTelegram,
  FaGlobe,
  FaLink,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { SiCoinmarketcap } from "react-icons/si";
import styles from "./TopTokensMessage.module.css";
import { TopTokensMessageProps } from "./TopTokensMessage.types";
import { Text } from "@chakra-ui/react";
import { Image } from "@chakra-ui/react";

const INITIAL_DISPLAY_COUNT = 5;

export const TopTokensMessage: React.FC<TopTokensMessageProps> = ({
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

  return (
    <div className={styles.container}>
      <Text>Here are the top tokens from Dexscreener!</Text>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th></th>
            <th></th>
            <th>Address</th>
            <th>Description</th>
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
              </td>
              <td>
                <div className={styles.description}>
                  {token.description || "-"}
                </div>
              </td>
              <td className={styles.linksCell}>
                <div className={styles.links}>
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
              Show More <FaChevronDown />
            </>
          )}
        </button>
      )}
    </div>
  );
};
