import { Box, HStack, Spacer, Select, Text } from "@chakra-ui/react";
import Image from "next/image";
import { FC, useState } from "react";
import { CustomConnectButton } from "./CustomConnectButton";
import styles from "./index.module.css";

interface HeaderBarProps {
  onBackToJobs?: () => void;
}

export const HeaderBar: FC<HeaderBarProps> = ({ onBackToJobs }) => {
  const [selectedModel, setSelectedModel] = useState("llama3.3:70b");
  const modelOptions = [{ value: "llama3.3:70b", label: "Llama 3.3 (70B)" }];
  
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
        <HStack spacing={4}>
          <HStack spacing={2}>
            <Text fontSize="sm" color="white" fontWeight="600">
              Model:
            </Text>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              size="sm"
              bg="rgba(255, 255, 255, 0.05)"
              color="white"
              borderColor="rgba(255, 255, 255, 0.2)"
              _hover={{ borderColor: "rgba(255, 255, 255, 0.3)" }}
              _focus={{ borderColor: "#00ff41", boxShadow: "0 0 0 1px #00ff41" }}
              width="180px"
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value} style={{ background: "#1A202C" }}>
                  {option.label}
                </option>
              ))}
            </Select>
          </HStack>
          <Box className={styles.connectButtonWrapper}>
            <CustomConnectButton />
          </Box>
        </HStack>
      </HStack>
    </Box>
  );
};
