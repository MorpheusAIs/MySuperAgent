import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Box,
  useToast,
  HStack,
  IconButton,
  Flex,
} from "@chakra-ui/react";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import { RefreshCw } from "lucide-react";
import styles from "@/components/Sync/index.module.css";
import {
  encryptAndUploadChats,
  downloadAndDecryptChats,
} from "@/services/SessionSync/sync";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const [lastSnapshot, setLastSnapshot] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Mock API call to get last snapshot
    const storedSnapshot = localStorage.getItem("last_sync_snapshot");
    if (storedSnapshot) {
      setLastSnapshot(storedSnapshot);
    }
  }, []);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const irysUrl = await encryptAndUploadChats();
      localStorage.setItem("last_sync_snapshot", irysUrl);
      setLastSnapshot(irysUrl);

      toast({
        title: "Sync successful",
        description: "Your conversations have been encrypted and stored",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Sync failed:", error);
      toast({
        title: "Sync failed",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!lastSnapshot) return;

    setIsLoading(true);
    try {
      await downloadAndDecryptChats(lastSnapshot);
      toast({
        title: "Restore successful",
        description: "Your conversations have been restored",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error("Restore failed:", error);
      toast({
        title: "Restore failed",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const truncateUrl = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    const id = parts[parts.length - 1];
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} motionPreset="none">
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
      >
        <ModalHeader
          borderBottom="1px solid rgba(255, 255, 255, 0.1)"
          padding="16px"
          color="white"
          fontSize="16px"
          fontWeight="500"
        >
          <Flex justify="center">Sync Across Devices</Flex>
        </ModalHeader>

        <ModalCloseButton
          color="white"
          _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
        />

        <ModalBody padding="16px">
          <VStack spacing={6} align="stretch">
            <Box>
              <Text color="white" fontSize="14px" fontWeight="500" mb={2}>
                Sync Your Conversations
              </Text>
              <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
                Your conversations will be encrypted using Lit Protocol and
                stored on Irys, allowing you to securely access them across
                different devices. Only you and your connected wallet will be
                able to decrypt these conversations.
              </Text>
            </Box>

            <Button
              onClick={handleSync}
              className={styles.button}
              isLoading={isLoading}
              leftIcon={<RefreshCw size={16} />}
            >
              Create New Sync Snapshot
            </Button>

            {lastSnapshot && (
              <Box>
                <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)" mb={2}>
                  Last sync snapshot:
                </Text>
                <HStack
                  spacing={2}
                  p={2}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderRadius="md"
                >
                  <Text
                    color="white"
                    fontSize="12px"
                    fontFamily="mono"
                    flex="1"
                  >
                    {truncateUrl(lastSnapshot)}
                  </Text>
                  <IconButton
                    aria-label="Copy snapshot URL"
                    icon={<CopyIcon />}
                    size="xs"
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    onClick={() => copyToClipboard(lastSnapshot)}
                  />
                  <IconButton
                    aria-label="Restore from snapshot"
                    icon={<DownloadIcon />}
                    size="xs"
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    onClick={handleRestore}
                    isLoading={isLoading}
                  />
                </HStack>
              </Box>
            )}

            <VStack spacing={2} align="center" pt={4}>
              <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
                Powered by Lit Protocol
              </Text>
              <Box width="48px" height="24px">
                <img
                  src="/images/lit-logo.png"
                  alt="Lit Protocol logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
