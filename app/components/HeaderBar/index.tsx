import {
  Box,
  HStack,
  Spacer,
} from '@chakra-ui/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { PrivyLoginButton } from '@/components/PrivyLoginButton';
import { HeaderRateLimitStatus } from './HeaderRateLimitStatus';
import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useWalletAddress } from '@/services/wallet/utils';
import styles from './index.module.css';

interface HeaderBarProps {
  onBackToJobs?: () => void;
}

export const HeaderBar: FC<HeaderBarProps> = ({ onBackToJobs }) => {
  const router = useRouter();
  const { isAuthenticated } = usePrivyAuth();
  const { getAddress } = useWalletAddress();

  const handleLogoClick = () => {
    if (onBackToJobs) {
      // If we have a local callback (e.g., switching views within same page), use it
      onBackToJobs();
    } else {
      // Otherwise, navigate to dashboard home page
      router.push('/');
    }
  };

  // Show rate limit status if user is authenticated or has wallet connected
  const showRateLimit = isAuthenticated || !!getAddress();

  return (
    <Box className={styles.headerBar}>
      <HStack spacing={0} width="100%" px={4}>
        <Box className={styles.logo} flexShrink={0}>
          <Box onClick={handleLogoClick} cursor="pointer">
            <Image 
              src="/assets/logo.svg" 
              alt="logo" 
              width={60} 
              height={30}
              style={{ width: 'auto', height: 'auto' }}
            />
          </Box>
        </Box>
        <Spacer />
        <HStack spacing={4} align="center">
          {showRateLimit && (
            <Box className={styles.rateLimitWrapper}>
              <HeaderRateLimitStatus />
            </Box>
          )}
          <Box className={styles.connectButtonWrapper}>
            <PrivyLoginButton />
          </Box>
        </HStack>
      </HStack>
    </Box>
  );
};
