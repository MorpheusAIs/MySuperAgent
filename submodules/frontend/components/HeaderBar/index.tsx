import React, { FC } from "react";
import Image from "next/image";
import { 
  Box, 
  HStack, 
  Spacer
} from "@chakra-ui/react";
import styles from "./index.module.css";
import { CustomConnectButton } from "./CustomConnectButton";

export const HeaderBar: FC = () => {

  return (
    <Box className={styles.headerBar}>
      <HStack spacing={0} width="100%" px={4}>
        <Box className={styles.logo} flexShrink={0}>
          <Image src="/assets/logo.svg" alt="logo" width={60} height={30} />
        </Box>
        <Spacer />
        <Box className={styles.connectButtonWrapper}>
          <CustomConnectButton />
        </Box>
      </HStack>
    </Box>
  );
};
