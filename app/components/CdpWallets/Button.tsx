import React, { useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { Wallet } from "lucide-react";
import { CdpWalletsModal } from "./Modal";
import styles from "./CdpWallets.module.css";

export const CdpWalletsButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Flex
        disabled
        as="button"
        align="center"
        gap={3}
        width="100%"
        onClick={() => setIsOpen(true)}
        className={styles.menuButton}
        opacity={0.5}
        pointerEvents="none"
      >
        <Wallet className={styles.icon} size={20} />
        <Text fontSize="14px" color="white">
          Coinbase Developer Wallets
        </Text>
      </Flex>

      <CdpWalletsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
