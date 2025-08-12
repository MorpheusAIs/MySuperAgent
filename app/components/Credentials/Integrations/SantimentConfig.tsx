import React, { useState, useEffect } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  HStack,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import { encryptSecret, uploadToIrys } from "@/services/LitProtocol/encryption";
import {
  decryptData,
  downloadFromIrys,
} from "@/services/LitProtocol/decryption";
import styles from "./ApiCredentials.module.css";

interface SantimentConfigProps {
  onSave: () => void;
}

export const SantimentConfig: React.FC<SantimentConfigProps> = ({ onSave }) => {
  const [newApiKey, setNewApiKey] = useState("");
  const [irysUrl, setIrysUrl] = useState<string>("");
  const [decryptedSecret, setDecryptedSecret] = useState<string>("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const storedUrl = localStorage.getItem("santiment_irys_url");
    if (storedUrl) {
      setIrysUrl(storedUrl);
    }
  }, []);

  const handleSave = async () => {
    try {
      const { ciphertext, dataToEncryptHash } = await encryptSecret(newApiKey);
      const uploadedUrl = await uploadToIrys(ciphertext, dataToEncryptHash);

      localStorage.setItem("santiment_irys_url", uploadedUrl);
      setIrysUrl(uploadedUrl);
      setNewApiKey("");
      onSave();
    } catch (error) {
      console.error("Failed to encrypt and save Santiment API key:", error);
      toast({
        title: "Failed to save API key",
        description: "Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDecrypt = async () => {
    if (!irysUrl) return;

    setIsDecrypting(true);
    try {
      const irysId = irysUrl.split("/").pop() || "";
      console.log("Fetching from Irys with ID:", irysId);

      const [ciphertext, dataToEncryptHash, accessControlConditions] =
        await downloadFromIrys(irysId);

      console.log("Downloaded data:", {
        ciphertext,
        dataToEncryptHash,
        accessControlConditions,
      });

      if (!ciphertext || !dataToEncryptHash || !accessControlConditions) {
        throw new Error("Missing required data from Irys");
      }

      const decrypted = await decryptData(
        ciphertext,
        dataToEncryptHash,
        accessControlConditions
      );

      setDecryptedSecret(decrypted);

      setTimeout(() => {
        setDecryptedSecret("");
      }, 5000);
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      toast({
        title: "Failed to decrypt API key",
        description: "Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("santiment_irys_url");
    setIrysUrl("");
    setDecryptedSecret("");
  };

  const truncateUrl = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    const id = parts[parts.length - 1];
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
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

  return (
    <VStack spacing={6} align="stretch" className="santiment-config-container">
      <Box>
        <Text color="white" fontSize="14px" fontWeight="500" mb={2}>
          Santiment API Configuration
        </Text>
        <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
          Enter your Santiment API key. The key will be encrypted using Lit
          Protocol and stored on Irys. The decrypted secret will only be used
          for API requests and never be stored anywhere else.
        </Text>
      </Box>

      {!irysUrl ? (
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel
              color="white"
              fontSize="14px"
              fontWeight="500"
              display="flex"
              alignItems="center"
            >
              API Key
            </FormLabel>
            <Input
              type="password"
              placeholder="Enter your API key"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className={styles.input}
            />
          </FormControl>

          <Button
            onClick={handleSave}
            className={styles.button}
            isDisabled={!newApiKey}
          >
            Save and Encrypt API Key
          </Button>
        </VStack>
      ) : (
        <VStack spacing={4} align="stretch">
          <HStack spacing={2} align="center">
            <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
              Encrypted secret stored at:
            </Text>
            <Text
              fontSize="12px"
              color="rgba(255, 255, 255, 0.8)"
              fontFamily="mono"
              backgroundColor="rgba(255, 255, 255, 0.1)"
              px={2}
              py={1}
              borderRadius="md"
            >
              {truncateUrl(irysUrl)}
            </Text>
            <IconButton
              aria-label="Copy URL"
              icon={<CopyIcon />}
              size="xs"
              variant="ghost"
              colorScheme="whiteAlpha"
              onClick={() => copyToClipboard(irysUrl)}
            />
          </HStack>

          <VStack spacing={2} align="left">
            <Popover>
              <PopoverTrigger>
                <Button
                  onClick={handleDecrypt}
                  className={styles.button}
                  isLoading={isDecrypting}
                >
                  View Decrypted API Key
                </Button>
              </PopoverTrigger>
              {decryptedSecret && (
                <PopoverContent
                  bg="black"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
                  width="100%"
                  maxWidth="none"
                >
                  <Box p={3}>
                    <Text color="rgba(255, 255, 255, 0.9)" fontSize="13px">
                      Decrypted API Key:
                    </Text>
                    <HStack
                      mt={1}
                      p={2}
                      bg="rgba(255, 255, 255, 0.05)"
                      borderRadius="md"
                      spacing={2}
                      align="center"
                    >
                      <Text
                        color="rgba(255, 255, 255, 0.95)"
                        fontSize="13px"
                        fontFamily="mono"
                        flex="1"
                      >
                        {decryptedSecret}
                      </Text>
                      <IconButton
                        aria-label="Copy decrypted key"
                        icon={<CopyIcon />}
                        size="xs"
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        onClick={() => copyToClipboard(decryptedSecret)}
                      />
                    </HStack>
                    <Text
                      fontSize="11px"
                      color="rgba(255, 255, 255, 0.5)"
                      mt={2}
                    >
                      This will be hidden automatically in 5 seconds
                    </Text>
                  </Box>
                </PopoverContent>
              )}
            </Popover>
            <Button
              onClick={handleReset}
              variant="ghost"
              colorScheme="red"
              size="sm"
            >
              Reset API Key
            </Button>
          </VStack>
        </VStack>
      )}
    </VStack>
  );
};
