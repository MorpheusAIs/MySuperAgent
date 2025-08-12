import { Box, HStack, Spacer } from "@chakra-ui/react";
import Image from "next/image";
import { FC } from "react";
import { CustomConnectButton } from "./CustomConnectButton";
import styles from "./index.module.css";

interface HeaderBarProps {
  onBackToJobs?: () => void;
}

export const HeaderBar: FC<HeaderBarProps> = ({ onBackToJobs }) => {
  const handleLogoClick = () => {
    if (onBackToJobs) {
      onBackToJobs();
    }
  };

  return (
    <Box className={styles.headerBar}>
      <HStack spacing={0} width="100%" px={4}>
        <Box className={styles.logo} flexShrink={0}>
          {onBackToJobs ? (
            <Box onClick={handleLogoClick} cursor="pointer">
              <Image src="/assets/logo.svg" alt="logo" width={60} height={30} />
            </Box>
          ) : (
            <Image src="/assets/logo.svg" alt="logo" width={60} height={30} />
          )}
        </Box>
        <Spacer />
        <Box className={styles.connectButtonWrapper}>
          <CustomConnectButton />
        </Box>
      </HStack>
    </Box>
  );
};
