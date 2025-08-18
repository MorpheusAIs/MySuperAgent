import React from "react";
import { Flex, Text } from "@chakra-ui/react";
import { Users } from "lucide-react";
import { useRouter } from "next/router";
import styles from "./Button.module.css";

export const AgentsButton: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/agents");
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
      <Users size={20} className={styles.icon} />
      <Text fontSize="14px" color="white">
        Agents
      </Text>
    </Flex>
  );
};