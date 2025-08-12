import React, { useState } from "react";
import Image from "next/image";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Grid,
  Box,
  Text,
  VStack,
  Button,
  Flex,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { TwitterConfig } from "./Integrations/TwitterConfig";
import { CoinbaseConfig } from "./Integrations/CoinbaseConfig";
import { OneInchConfig } from "./Integrations/OneInchConfig";
import { ElfaConfig } from "./Integrations/ElfaConfig";
import { CodexConfig } from "./Integrations/CodexConfig";
import { SantimentConfig } from "./Integrations/SantimentConfig";
import styles from "./Integrations/ApiCredentials.module.css";
import { useAccount } from "wagmi";
import { StyledTooltip } from "@/components/Common/StyledTooltip";

interface ApiOption {
  id: string;
  name: string;
  logo: string;
  component: React.FC<{ onSave: () => void }>;
  proEnabled?: boolean;
}

const API_OPTIONS: ApiOption[] = [
  {
    id: "twitter",
    name: "X API",
    logo: "/images/x-logo.jpg",
    component: TwitterConfig,
  },
  {
    id: "coinbase",
    name: "Coinbase API",
    logo: "/images/coinbase-logo.png",
    component: CoinbaseConfig,
  },
  {
    id: "oneinch",
    name: "1inch API",
    logo: "/images/one-inch-logo.png",
    component: OneInchConfig,
    proEnabled: true,
  },
  {
    id: "elfa",
    name: "Elfa API",
    logo: "/images/elfa-logo.jpg",
    component: ElfaConfig,
    proEnabled: true,
  },
  {
    id: "codex",
    name: "Codex API",
    logo: "/images/codex-logo.png",
    component: CodexConfig,
    proEnabled: true,
  },
  {
    id: "santiment",
    name: "Santiment API",
    logo: "/images/santiment-logo.jpeg",
    component: SantimentConfig,
    proEnabled: true,
  },
];

interface ApiCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiCredentialsModal: React.FC<ApiCredentialsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const { address } = useAccount();

  const SelectedApiComponent = API_OPTIONS.find(
    (api) => api.id === selectedApi
  )?.component;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedApi(null);
        onClose();
      }}
      motionPreset="none"
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent
        position="fixed"
        left="16px"
        top="70px"
        margin={0}
        width="388px"
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
          position="relative"
        >
          {selectedApi && (
            <Button
              leftIcon={<ArrowLeft size={16} />}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedApi(null)}
              position="absolute"
              left={4}
              top="50%"
              transform="translateY(-50%)"
              color="white"
              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              fontSize="14px"
            >
              Back
            </Button>
          )}
          <Flex justify="center">
            {selectedApi
              ? API_OPTIONS.find((api) => api.id === selectedApi)?.name
              : "API Credentials"}
          </Flex>
        </ModalHeader>

        <ModalCloseButton
          color="white"
          _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
        />

        <ModalBody padding="16px">
          {!selectedApi ? (
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="14px" color="white" fontWeight="500" mb={2}>
                  Configure Your API Integrations
                </Text>
                <Text fontSize="14px" color="rgba(255, 255, 255, 0.6)">
                  Set up your API credentials for various services to enable
                  advanced features and integrations. These secrets are
                  encrypted with Lit Protocol, a key management network for
                  decentralized signing and encryption. No one but you will be
                  able to decrypt the secrets, and we never send your secrets
                  anywhere.
                </Text>
              </Box>

              <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                {API_OPTIONS.map((api) => {
                  const isDisabled = api.proEnabled && address;

                  const apiBox = (
                    <Box
                      p={4}
                      bg="rgba(255, 255, 255, 0.02)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="8px"
                      cursor={isDisabled ? "default" : "pointer"}
                      onClick={() => !isDisabled && setSelectedApi(api.id)}
                      _hover={{
                        bg: isDisabled ? "none" : "rgba(255, 255, 255, 0.05)",
                      }}
                      transition="background-color 0.2s"
                      className={styles.apiOption}
                      opacity={isDisabled ? 0.5 : 1}
                    >
                      <VStack spacing={3}>
                        <Box
                          width="40px"
                          height="40px"
                          borderRadius="8px"
                          overflow="hidden"
                          bg="rgba(255, 255, 255, 0.1)"
                          position="relative"
                        >
                          <Image
                            src={api.logo}
                            alt={`${api.name} logo`}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </Box>
                        <Text color="white" fontSize="14px" fontWeight="500">
                          {api.name}
                        </Text>
                      </VStack>
                    </Box>
                  );

                  return isDisabled ? (
                    <StyledTooltip
                      key={api.id}
                      label="Congratulations! As a pro user, you have access to these advanced agents."
                      placement="bottom"
                    >
                      {apiBox}
                    </StyledTooltip>
                  ) : (
                    <Box key={api.id}>{apiBox}</Box>
                  );
                })}
              </Grid>

              <VStack spacing={2} align="center" pt={4}>
                <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
                  Powered by Lit Protocol
                </Text>
                <Box width="48px" height="24px" position="relative">
                  <Image
                    src="/images/lit-logo.png"
                    alt="Lit Protocol logo"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </Box>
              </VStack>
            </VStack>
          ) : (
            SelectedApiComponent && (
              <SelectedApiComponent
                onSave={() => {
                  setSelectedApi(null);
                  onClose();
                }}
              />
            )
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
