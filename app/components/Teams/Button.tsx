import React from "react";
import { Flex, Text } from "@chakra-ui/react";
import { Network } from "lucide-react";
import { useRouter } from "next/router";
import styles from "./Button.module.css";

export const TeamsButton: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/teams");
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
      <Network size={20} className={styles.icon} />
      <Text fontSize="14px" color="white">
        Teams
      </Text>
    </Flex>
  );
};