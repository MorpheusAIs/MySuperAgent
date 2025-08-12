import React, { useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { Lock } from "lucide-react";
import { ApiCredentialsModal } from "./Modal";
import styles from "./Integrations/ApiCredentials.module.css";

export const ApiCredentialsButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Flex
        as="button"
        align="center"
        gap={3}
        width="100%"
        onClick={() => setIsOpen(true)}
        className={styles.menuButton}
        cursor="pointer"
      >
        <Lock className={styles.icon} size={20} />
        <Text fontSize="14px" color="white">
          API Integrations
        </Text>
      </Flex>

      <ApiCredentialsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
