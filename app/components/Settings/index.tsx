import { Flex, Text } from "@chakra-ui/react";
import { Settings } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";
import styles from "./index.module.css";

export const SettingsButton: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/settings");
  };

  return (
    <Flex
      as="button"
      align="center"
      gap={3}
      width="100%"
      onClick={handleClick}
      pl={1}
    >
      <Settings className={styles.icon} size={20} />
      <Text fontSize="14px" color="white">
        SuperAgent Configurations
      </Text>
    </Flex>
  );
};

// Export the main Settings component
export { SettingsMain } from "./Main";
