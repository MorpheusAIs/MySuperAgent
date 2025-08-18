import React from "react";
import { Flex, Text } from "@chakra-ui/react";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/router";
import styles from "./Button.module.css";

export const DashboardButton: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/");
  };

  return (
    <Flex
      className={styles.button}
      align="center"
      p={3}
      borderRadius="md"
      cursor="pointer"
      onClick={handleClick}
      _hover={{
        bg: "whiteAlpha.200",
      }}
    >
      <LayoutDashboard size={20} style={{ marginRight: "12px" }} />
      <Text fontSize="sm" fontWeight="medium">
        Dashboard
      </Text>
    </Flex>
  );
};