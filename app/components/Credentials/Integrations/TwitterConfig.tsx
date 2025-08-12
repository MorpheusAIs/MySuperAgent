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

interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

interface TwitterConfigProps {
  onSave: () => void;
}

const CREDENTIAL_LABELS: Record<keyof TwitterCredentials, string> = {
  apiKey: "API Key",
  apiSecret: "API Secret",
  accessToken: "Access Token",
  accessTokenSecret: "Access Token Secret",
};

export const TwitterConfig: React.FC<TwitterConfigProps> = ({ onSave }) => {
  const [credentials, setCredentials] = useState<TwitterCredentials>({
    apiKey: "",
    apiSecret: "",
    accessToken: "",
    accessTokenSecret: "",
  });
  const [irysUrl, setIrysUrl] = useState<string>("");
  const [decryptedSecrets, setDecryptedSecrets] =
    useState<TwitterCredentials | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const storedUrl = localStorage.getItem("twitter_irys_url");
    if (storedUrl) {
      setIrysUrl(storedUrl);
    }
  }, []);

  const handleSave = async () => {
    try {
      // Check if all required fields are filled
      const hasEmptyFields = Object.values(credentials).some((value) => !value);
      if (hasEmptyFields) {
        toast({
          title: "Missing credentials",
          description: "Please fill in all credential fields",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Encrypt all credentials as a single JSON string
      const { ciphertext, dataToEncryptHash } = await encryptSecret(
        JSON.stringify(credentials)
      );
      const uploadedUrl = await uploadToIrys(ciphertext, dataToEncryptHash);

      localStorage.setItem("twitter_irys_url", uploadedUrl);
      setIrysUrl(uploadedUrl);
      setCredentials({
        apiKey: "",
        apiSecret: "",
        accessToken: "",
        accessTokenSecret: "",
      });
      onSave();
    } catch (error) {
      console.error("Failed to encrypt and save Twitter credentials:", error);
      toast({
        title: "Failed to save credentials",
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

      if (!ciphertext || !dataToEncryptHash || !accessControlConditions) {
        throw new Error("Missing required data from Irys");
      }

      const decrypted = await decryptData(
        ciphertext,
        dataToEncryptHash,
        accessControlConditions
      );

      const parsedSecrets = JSON.parse(decrypted) as TwitterCredentials;
      setDecryptedSecrets(parsedSecrets);

      setTimeout(() => {
        setDecryptedSecrets(null);
      }, 5000);
    } catch (error) {
      console.error("Failed to decrypt credentials:", error);
      toast({
        title: "Failed to decrypt credentials",
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
    localStorage.removeItem("twitter_irys_url");
    setIrysUrl("");
    setDecryptedSecrets(null);
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
    <VStack spacing={6} align="stretch" className="twitter-config-container">
      <Box>
        <Text color="white" fontSize="14px" fontWeight="500" mb={2}>
          X API Configuration
        </Text>
        <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
          Enter your X API credentials. These will be encrypted using Lit
          Protocol and stored on Irys. The decrypted secrets will only be used
          for API requests and never sent to Morpheus.
        </Text>
      </Box>

      {!irysUrl ? (
        <VStack spacing={4} align="stretch">
          {Object.entries(CREDENTIAL_LABELS).map(([key, label]) => (
            <FormControl key={key}>
              <FormLabel
                color="white"
                fontSize="14px"
                fontWeight="500"
                display="flex"
                alignItems="center"
              >
                {label}
              </FormLabel>
              <Input
                type="password"
                placeholder={`Enter ${label}`}
                value={credentials[key as keyof TwitterCredentials]}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className={styles.input}
              />
            </FormControl>
          ))}

          <Button
            onClick={handleSave}
            className={styles.button}
            isDisabled={Object.values(credentials).some((val) => !val)}
          >
            Save and Encrypt Credentials
          </Button>
        </VStack>
      ) : (
        <VStack spacing={4} align="stretch">
          <HStack spacing={2} align="center">
            <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
              Encrypted secrets stored at:
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
                  View Decrypted Credentials
                </Button>
              </PopoverTrigger>
              {decryptedSecrets && (
                <PopoverContent
                  bg="black"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
                  width="100%"
                  maxWidth="none"
                >
                  <Box p={3}>
                    <Text color="rgba(255, 255, 255, 0.9)" fontSize="13px">
                      Decrypted Credentials:
                    </Text>
                    <VStack spacing={2} mt={2} align="stretch">
                      {Object.entries(decryptedSecrets).map(([key, value]) => (
                        <Box key={key}>
                          <Text
                            color="rgba(255, 255, 255, 0.7)"
                            fontSize="12px"
                          >
                            {CREDENTIAL_LABELS[key as keyof TwitterCredentials]}
                            :
                          </Text>
                          <HStack
                            mt={1}
                            p={2}
                            bg="rgba(255, 255, 255, 0.05)"
                            borderRadius="md"
                            spacing={2}
                          >
                            <Text
                              color="rgba(255, 255, 255, 0.95)"
                              fontSize="13px"
                              fontFamily="mono"
                              flex="1"
                            >
                              {value}
                            </Text>
                            <IconButton
                              aria-label="Copy value"
                              icon={<CopyIcon />}
                              size="xs"
                              variant="ghost"
                              colorScheme="whiteAlpha"
                              onClick={() => copyToClipboard(value)}
                            />
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
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
              Reset Credentials
            </Button>
          </VStack>
        </VStack>
      )}
    </VStack>
  );
};
