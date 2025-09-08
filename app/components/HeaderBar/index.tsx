import {
  Box,
  HStack,
  Spacer,
} from '@chakra-ui/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { PrivyLoginButton } from '@/components/PrivyLoginButton';
import styles from './index.module.css';

interface HeaderBarProps {
  onBackToJobs?: () => void;
}

export const HeaderBar: FC<HeaderBarProps> = ({ onBackToJobs }) => {
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
          <Box className={styles.connectButtonWrapper}>
            <PrivyLoginButton />
          </Box>
        </HStack>
      </HStack>
    </Box>
  );
};
