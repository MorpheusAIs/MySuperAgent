import { Box, HStack, Select, Spacer, Text } from '@chakra-ui/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { CustomConnectButton } from './CustomConnectButton';
import styles from './index.module.css';

interface HeaderBarProps {
  onBackToJobs?: () => void;
}

export const HeaderBar: FC<HeaderBarProps> = ({ onBackToJobs }) => {
  const [selectedModel, setSelectedModel] = useState('llama3.3:70b');
  const modelOptions = [{ value: 'llama3.3:70b', label: 'Llama 3.3 (70B)' }];
  const router = useRouter();

  const handleLogoClick = () => {
    if (onBackToJobs) {
      // If we have a local callback (e.g., switching views within same page), use it
      onBackToJobs();
    } else {
      // Otherwise, navigate to dashboard home page
      router.push('/');
    }
  };

  return (
    <Box className={styles.headerBar}>
      <HStack spacing={0} width="100%" px={4}>
        <Box className={styles.logo} flexShrink={0}>
          <Box onClick={handleLogoClick} cursor="pointer">
            <Image src="/assets/logo.svg" alt="logo" width={60} height={30} />
          </Box>
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
              bg="#27292c"
              color="white"
              borderColor="rgba(255, 255, 255, 0.1)"
              _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
              _focus={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                boxShadow: 'none',
              }}
              borderRadius="8px"
              fontSize="14px"
              height="32px"
              width="180px"
              fontWeight="400"
            >
              {modelOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  style={{ background: '#27292c', color: 'white' }}
                >
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
