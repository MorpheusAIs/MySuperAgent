import React from "react";
import { Flex, Text } from "@chakra-ui/react";
import { Settings } from "lucide-react";
import { useRouter } from "next/router";
import styles from "./Button.module.css";

export const ToolsButton: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/tools");
  };

  return (
    <Flex
      as="button"
      align="center"
      gap={3}
      width="100%"
      onClick={handleClick}
      className={styles.menuButton}
    >
      <Settings size={20} className={styles.icon} />
      <Text fontSize="14px" color="white">
        Tools
      </Text>
    </Flex>
  );
};