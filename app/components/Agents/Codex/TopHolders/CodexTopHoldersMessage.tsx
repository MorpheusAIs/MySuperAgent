import React from "react";
import { AlertTriangle, Check, PieChart, ExternalLink } from "lucide-react";
import styles from "./CodexTopHoldersMessage.module.css";
import { CodexTopHoldersMessageProps } from "./CodexTopHoldersMessage.types";
import { Text } from "@chakra-ui/react";

export const CodexTopHoldersMessage: React.FC<CodexTopHoldersMessageProps> = ({
  metadata,
}) => {
  if (!metadata.success) {
    return <Text>Failed to load token holder data.</Text>;
  }

  const percentage = metadata.data;
  const tokenInfo = metadata.token_info;

  // Format dollar values
  const formatUSD = (value?: string) => {
    if (!value) return "N/A";
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";

    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Determine concentration level and styling
  const getConcentrationLevel = (percentage: number) => {
    if (percentage > 80) {
      return {
        icon: <AlertTriangle size={16} />,
        label: "High Concentration",
        description: "Token ownership is highly concentrated",
        barClass: styles.highConcentration,
        iconClass: styles.warningIcon,
      };
    } else if (percentage > 50) {
      return {
        icon: <AlertTriangle size={16} />,
        label: "Moderate Concentration",
        description: "Notable concentration among top holders",
        barClass: styles.moderateConcentration,
        iconClass: styles.warningIcon,
      };
    } else {
      return {
        icon: <Check size={16} />,
        label: "Well Distributed",
        description: "Relatively well distributed ownership",
        barClass: styles.lowConcentration,
        iconClass: styles.successIcon,
      };
    }
  };

  const concentrationInfo = getConcentrationLevel(percentage);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <PieChart size={16} className={styles.titleIcon} />
          <span className={styles.title}>Token Holder Concentration</span>
        </div>
        {tokenInfo?.token && (
          <div className={styles.tokenInfo}>
            <span className={styles.tokenSymbol}>{tokenInfo.token.symbol}</span>
            {tokenInfo.token.name && (
              <span className={styles.tokenName}>{tokenInfo.token.name}</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.mainContent}>
          <div className={styles.percentageDisplay}>
            <div className={styles.percentageValue}>
              {percentage.toFixed(2)}%
            </div>
            <div className={styles.percentageLabel}>Top 10 holders</div>
          </div>

          <div className={styles.tokenMetrics}>
            {tokenInfo?.priceUSD && (
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Price</div>
                <div className={styles.metricValue}>
                  {formatUSD(tokenInfo.priceUSD)}
                </div>
              </div>
            )}
            {tokenInfo?.marketCap && (
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Market Cap</div>
                <div className={styles.metricValue}>
                  {formatUSD(tokenInfo.marketCap)}
                </div>
              </div>
            )}
            {tokenInfo?.liquidity && (
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Liquidity</div>
                <div className={styles.metricValue}>
                  {formatUSD(tokenInfo.liquidity)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${concentrationInfo.barClass}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          <div className={styles.progressLabels}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className={styles.analysisContainer}>
          <div
            className={`${styles.analysisIcon} ${concentrationInfo.iconClass}`}
          >
            {concentrationInfo.icon}
          </div>
          <div className={styles.analysisContent}>
            <div className={styles.analysisTitle}>
              {concentrationInfo.label}
            </div>
            <div className={styles.analysisDescription}>
              {concentrationInfo.description}
            </div>
          </div>

          {tokenInfo?.pair && (
            <div className={styles.pairInfo}>
              <div className={styles.pairLabel}>Paired with</div>
              <div className={styles.pairValue}>
                {tokenInfo.pair.token1}
                <ExternalLink size={12} className={styles.linkIcon} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodexTopHoldersMessage;
