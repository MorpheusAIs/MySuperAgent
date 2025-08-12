import React from "react";
import { HStack, VStack, Text, Button } from "@chakra-ui/react";
import { CopyIcon, StarIcon, DownloadIcon, DeleteIcon } from "@chakra-ui/icons";
import styles from "./index.module.css";

interface WalletItemProps {
  wallet: {
    wallet_id: string;
    network_id: string;
    address: string;
  };
  isActive: boolean;
  onCopy: (address: string) => void;
  onSetActive: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

export const WalletItem: React.FC<WalletItemProps> = ({
  wallet,
  isActive,
  onCopy,
  onSetActive,
  onDownload,
  onDelete,
}) => (
  <div className={styles.walletItem}>
    <VStack align="start" spacing={1} className={styles.walletInfo}>
      <Text className={styles.walletName}>{wallet.wallet_id}</Text>
      <Text className={styles.networkId}>Network: {wallet.network_id}</Text>
      <Text className={styles.address}>{wallet.address}</Text>
    </VStack>
    <HStack spacing={2} className={styles.actionButtons}>
      <Button
        className={`${styles.actionButton} ${styles.copyButton}`}
        onClick={(e) => {
          e.stopPropagation();
          onCopy(wallet.address);
        }}
      >
        <CopyIcon />
      </Button>
      <Button
        className={`${styles.actionButton} ${styles.starButton} ${
          isActive ? styles.active : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSetActive(wallet.wallet_id);
        }}
      >
        <StarIcon />
      </Button>
      <Button
        className={`${styles.actionButton} ${styles.downloadButton}`}
        onClick={(e) => {
          e.stopPropagation();
          onDownload(wallet.wallet_id);
        }}
      >
        <DownloadIcon />
      </Button>
      <Button
        className={`${styles.actionButton} ${styles.deleteButton}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(wallet.wallet_id);
        }}
      >
        <DeleteIcon />
      </Button>
    </HStack>
  </div>
);
