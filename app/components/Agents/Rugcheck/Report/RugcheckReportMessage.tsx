import React from "react";
import { Copy } from "lucide-react";
import { Text } from "@chakra-ui/react";
import styles from "./RugcheckReportMessage.module.css";
import { RugcheckReportMessageProps } from "./RugcheckReportMessage.types";

export const RugcheckReportMessage: React.FC<RugcheckReportMessageProps> = ({
  metadata,
}) => {
  if (!metadata?.report) {
    return (
      <div className={styles.container}>
        <Text className={styles.title}>
          No security analysis report available
        </Text>
      </div>
    );
  }

  const { report, mint_address } = metadata;

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

  const getRiskClass = (level: string) => {
    switch (level) {
      case "danger":
        return styles.dangerRisk;
      case "warn":
        return styles.warnRisk;
      default:
        return styles.infoRisk;
    }
  };

  const getScoreClass = (score: number) => {
    if (score > 10000) return styles.highScore;
    if (score > 5000) return styles.mediumScore;
    return styles.lowScore;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Security Analysis Report</Text>
        <div className={styles.scoreWrapper}>
          <span
            className={`${styles.score} ${getScoreClass(report?.score || 0)}`}
          >
            Score: {report?.score?.toLocaleString() || "0"}
          </span>
        </div>
      </div>

      <div className={styles.addressBar}>
        <span className={styles.address}>{truncateAddress(mint_address)}</span>
        <button
          onClick={() => handleCopy(mint_address)}
          className={styles.copyButton}
        >
          <Copy size={14} />
        </button>
      </div>

      <div className={styles.riskList}>
        {report?.risks?.map((risk, index) => (
          <div
            key={index}
            className={`${styles.riskCard} ${getRiskClass(risk.level)}`}
          >
            <div className={styles.riskHeader}>
              <span className={styles.riskName}>{risk.name}</span>
              {risk.value && (
                <span className={styles.riskValue}>{risk.value}</span>
              )}
            </div>

            <Text className={styles.riskDescription}>{risk.description}</Text>

            <div className={styles.riskScore}>
              Risk Score: {risk.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
