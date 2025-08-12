import React, { useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";
import { SyncModal } from "@/components/Sync/Modal";
import styles from "@/components/Sync/index.module.css";

export const SyncButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Flex
        as="button"
        cursor="pointer"
        align="center"
        gap={3}
        width="100%"
        onClick={() => setIsOpen(true)}
        className={styles.menuButton}
      >
        <RefreshCw className={styles.icon} size={20} />
        <Text fontSize="14px" color="white">
          Sync Across Devices
        </Text>
      </Flex>

      <SyncModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
