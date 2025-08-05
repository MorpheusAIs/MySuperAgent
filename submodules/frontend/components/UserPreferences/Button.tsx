import React, { useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { Clock } from "lucide-react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
} from "@chakra-ui/react";
import { UserPreferencesComponent } from "./index";
import styles from "../Settings/index.module.css";

export const SchedulingPreferencesButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Flex
        as="button"
        align="center"
        gap={3}
        width="100%"
        onClick={() => setIsOpen(true)}
        pl={1}
      >
        <Clock className={styles.icon} size={20} />
        <Text fontSize="14px" color="white">
          Scheduling Preferences
        </Text>
      </Flex>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        motionPreset="none"
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent
          position="fixed"
          left="16px"
          top="70px"
          margin={0}
          width="344px"
          maxHeight="calc(100vh - 86px)"
          bg="#080808"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
          color="white"
        >
          <ModalCloseButton
            color="white"
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
          />
          <UserPreferencesComponent onClose={() => setIsOpen(false)} />
        </ModalContent>
      </Modal>
    </>
  );
};