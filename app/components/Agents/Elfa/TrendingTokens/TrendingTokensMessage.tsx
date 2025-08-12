// ElfaTrendingTokensMessage.tsx
import React from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import styles from "./TrendingTokensMessage.module.css";
import {
  ElfaTrendingTokensMessageProps,
  TokenData,
} from "./TrendingTokensMessage.types";
import { Text } from "@chakra-ui/react";
import { formatNumber } from "@/utils/tokenUtils";
import { useTokenDisplay } from "@/hooks/useTokenDisplay";

const INITIAL_DISPLAY_COUNT = 10;

const getChangeIndicator = (changePercent: number) => {
  if (changePercent > 0) {
    return {
      icon: <ArrowUpRight size={16} />,
      className: styles.changePositive,
      prefix: "+",
    };
  }
  if (changePercent < 0) {
    return {
      icon: <ArrowDownRight size={16} />,
      className: styles.changeNegative,
      prefix: "",
    };
  }
  return {
    icon: <Minus size={16} />,
    className: styles.changeNeutral,
    prefix: "",
  };
};

export const ElfaTrendingTokensMessage: React.FC<
  ElfaTrendingTokensMessageProps
> = ({ metadata }) => {
  const { showAll, toggleShowAll, getDisplayItems, hasMoreItems, getHiddenCount } = useTokenDisplay(INITIAL_DISPLAY_COUNT);

  if (!metadata.success || !metadata.data) {
    return <Text>Failed to load trending tokens data.</Text>;
  }

  const { data: tokens, total } = metadata.data;
  const displayTokens = getDisplayItems(tokens);

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th>Token / Ticker</th>
            <th>Change in # of Mentions</th>
            <th>% Change</th>
          </tr>
        </thead>
        <tbody>
          {displayTokens.map((token: TokenData) => {
            const change = getChangeIndicator(token.change_percent);

            return (
              <tr key={token.token} className={styles.row}>
                <td className={styles.tokenCell}>${token.token}</td>
                <td className={styles.mentionsCell}>
                  {formatNumber(token.previous_count)}
                  <ArrowRight size={14} className={styles.arrow} />
                  {formatNumber(token.current_count)}
                </td>
                <td>
                  <div className={`${styles.changeCell} ${change.className}`}>
                    {change.icon}
                    <span>
                      {change.prefix}
                      {token.change_percent.toFixed(2)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {hasMoreItems(tokens) && (
        <button
          onClick={toggleShowAll}
          className={styles.showMoreButton}
        >
          {showAll ? (
            <>
              Show Less <ChevronUp size={16} />
            </>
          ) : (
            <>
              Show More ({getHiddenCount(tokens)} more) <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
};
