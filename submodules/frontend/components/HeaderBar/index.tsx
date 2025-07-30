import React, { FC, useState } from "react";
import Image from "next/image";
import { 
  Box, 
  HStack, 
  Spacer, 
  IconButton, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  useDisclosure 
} from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";
import styles from "./index.module.css";
import { CustomConnectButton } from "./CustomConnectButton";
import { UserPreferencesComponent } from "@/components/UserPreferences";

export const HeaderBar: FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Box className={styles.headerBar}>
        <HStack spacing={0} width="100%" px={4}>
          <Box className={styles.logo} flexShrink={0}>
            <Image src="/assets/logo.svg" alt="logo" width={60} height={30} />
          </Box>
          <Spacer />
          <HStack spacing={3}>
            <IconButton
              aria-label="User Settings"
              icon={<SettingsIcon />}
              variant="ghost"
              color="gray.400"
              size="sm"
              _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.1)" }}
              onClick={onOpen}
            />
            <Box className={styles.connectButtonWrapper}>
              <CustomConnectButton />
            </Box>
          </HStack>
        </HStack>
      </Box>

      {/* User Preferences Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none" maxWidth="500px">
          <ModalCloseButton color="white" zIndex={10} />
          <UserPreferencesComponent onClose={onClose} />
        </ModalContent>
      </Modal>
    </>
  );
};
