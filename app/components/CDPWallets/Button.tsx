import React, { useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { Wallet } from "lucide-react";
import { CDPWalletsModal } from "./Modal";
import styles from "./CDPWallets.module.css";

export const CDPWalletsButton: React.FC = () => {
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

      <CDPWalletsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
