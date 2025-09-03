import { Box, Button, Divider, HStack, Text, VStack } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Crown, Mail, Wallet } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import styles from './CombinedAuth.module.css';

interface CombinedAuthProps {
  onGoogleAuth?: (user: any) => void;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'compact';
}

export const CombinedAuth: React.FC<CombinedAuthProps> = ({
  onGoogleAuth,
  showLabels = true,
  size = 'md',
  variant = 'full',
}) => {
  const { data: session } = useSession();
  const { isConnected, address } = useAccount();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', { redirect: false });
      if (result?.ok && onGoogleAuth) {
        onGoogleAuth(session?.user);
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error('Google sign-out failed:', error);
    }
  };

  if (variant === 'compact') {
    // If wallet is connected (Pro plan), only show wallet info
    if (isConnected) {
      return (
        <ConnectButton.Custom>
          {({ account, mounted }) => {
            if (!mounted || !account) return null;

            return (
              <Button
                onClick={() => router.push('/settings?tab=0')}
                leftIcon={<Crown size={14} />}
                size="sm"
                variant="solid"
                bg="#59F886"
                color="#000"
                fontSize="12px"
                fontWeight="600"
                px={3}
                py={1}
                h="28px"
                _hover={{
                  bg: '#4AE066',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(89, 248, 134, 0.3)',
                }}
              >
                Pro plan
              </Button>
            );
          }}
        </ConnectButton.Custom>
      );
    }

    // If no wallet, show Google (if signed in) + Wallet Connect
    return (
      <HStack spacing={2}>
        {/* Google Auth Button - only if signed in */}
        {session && (
          <Button
            onClick={handleGoogleSignOut}
            leftIcon={<Mail size={14} />}
            size="sm"
            fontSize="12px"
            fontWeight="600"
            px={3}
            py={1}
            h="28px"
            className={styles.googleButton}
          >
            {session.user?.email?.split('@')[0]}
          </Button>
        )}

        {/* Always show wallet connect if not connected */}
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => {
            if (!mounted) return null;

            return (
              <Button
                onClick={openConnectModal}
                leftIcon={<Wallet size={14} />}
                size="sm"
                bg="#59F886"
                color="#000"
                fontSize="12px"
                fontWeight="600"
                px={3}
                py={1}
                h="28px"
                _hover={{
                  bg: '#4AE066',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(89, 248, 134, 0.3)',
                }}
              >
                Connect Wallet
              </Button>
            );
          }}
        </ConnectButton.Custom>

        {/* Google Sign In - only if not signed in with Google */}
        {!session && (
          <Button
            onClick={handleGoogleSignIn}
            leftIcon={<Mail size={14} />}
            size="sm"
            fontSize="12px"
            fontWeight="600"
            px={3}
            py={1}
            h="28px"
            className={styles.googleButton}
          >
            Google
          </Button>
        )}
      </HStack>
    );
  }

  // If wallet is connected (Pro plan), only show wallet section
  if (isConnected) {
    return (
      <Box width="100%">
        {showLabels && (
          <HStack spacing={2} mb={2}>
            <Crown size={16} color="#59F886" />
            <Text fontSize="sm" color="#59F886" fontWeight="600">
              Pro Plan - Unlimited Access
            </Text>
          </HStack>
        )}
        <ConnectButton.Custom>
          {({ account, mounted }) => {
            if (!mounted || !account) return null;

            return (
              <VStack spacing={2} width="100%">
                <HStack justify="space-between" width="100%">
                  <HStack spacing={2}>
                    <Wallet size={16} color="#59F886" />
                    <Text color="white" fontSize="sm">
                      {account.displayName}
                    </Text>
                  </HStack>
                  <Button
                    onClick={() => router.push('/settings?tab=0')}
                    size="xs"
                    variant="ghost"
                    colorScheme="green"
                  >
                    Manage
                  </Button>
                </HStack>
                <Text fontSize="xs" color="#59F886" textAlign="center">
                  Unlimited messages & premium features
                </Text>
              </VStack>
            );
          }}
        </ConnectButton.Custom>
      </Box>
    );
  }

  return (
    <VStack spacing={4} width="100%">
      {/* Google Authentication - only show if not wallet connected */}
      {session && (
        <>
          <Box width="100%">
            {showLabels && (
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" mb={2}>
                Free Plan - Limited Access
              </Text>
            )}
            <VStack spacing={2} width="100%">
              <HStack justify="space-between" width="100%">
                <HStack spacing={2}>
                  <Mail size={16} color="#FFA500" />
                  <Text color="white" fontSize="sm">
                    {session.user?.email}
                  </Text>
                </HStack>
                <Button
                  onClick={handleGoogleSignOut}
                  size="xs"
                  className={styles.googleSignOutButton}
                >
                  Sign Out
                </Button>
              </HStack>
              <Text
                fontSize="xs"
                color="rgba(255, 255, 255, 0.5)"
                textAlign="center"
              >
                10 messages per day limit
              </Text>
            </VStack>
          </Box>

          {/* Divider */}
          <HStack width="100%" spacing={4}>
            <Divider borderColor="rgba(255, 255, 255, 0.2)" />
            <Text
              fontSize="xs"
              color="rgba(255, 255, 255, 0.5)"
              whiteSpace="nowrap"
            >
              OR
            </Text>
            <Divider borderColor="rgba(255, 255, 255, 0.2)" />
          </HStack>
        </>
      )}

      {/* Wallet Authentication - always show if not connected */}
      <Box width="100%">
        {showLabels && (
          <HStack spacing={2} mb={2}>
            <Crown size={16} color="#59F886" />
            <Text fontSize="sm" color="#59F886" fontWeight="600">
              Pro Plan - Unlimited Access
            </Text>
          </HStack>
        )}
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => {
            if (!mounted) return null;

            return (
              <Button
                onClick={openConnectModal}
                leftIcon={<Wallet size={20} />}
                size={size}
                width="100%"
                bg="#59F886"
                color="#000"
                _hover={{
                  bg: '#4AE066',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(89, 248, 134, 0.3)',
                }}
                fontWeight="600"
              >
                Connect Crypto Wallet
              </Button>
            );
          }}
        </ConnectButton.Custom>
      </Box>

      {/* Google Sign In - only if not signed in with Google */}
      {!session && (
        <>
          <HStack width="100%" spacing={4}>
            <Divider borderColor="rgba(255, 255, 255, 0.2)" />
            <Text
              fontSize="xs"
              color="rgba(255, 255, 255, 0.5)"
              whiteSpace="nowrap"
            >
              OR
            </Text>
            <Divider borderColor="rgba(255, 255, 255, 0.2)" />
          </HStack>

          <Box width="100%">
            {showLabels && (
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" mb={2}>
                Free Plan - Limited Access
              </Text>
            )}
            <Button
              onClick={handleGoogleSignIn}
              leftIcon={<Mail size={20} />}
              size={size}
              width="100%"
              className={styles.googleButton}
            >
              Continue with Google
            </Button>
          </Box>
        </>
      )}
    </VStack>
  );
};
