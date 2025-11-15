import {
  AuthMethodType,
  usePrivyAuth,
} from '@/contexts/auth/PrivyAuthProvider';
import { useWalletAddress } from '@/services/wallet/utils';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  HStack,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  Copy,
  Crown,
  LogOut,
  Mail,
  Phone,
  Shield,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { useAccount, useDisconnect } from 'wagmi';

interface AccountSettingsProps {
  onSave: () => void;
}

interface UsageData {
  messagesUsedToday: number;
  messagesLimit: number;
  isUnlimited: boolean;
}

const getAuthMethodMeta = (
  method: AuthMethodType | null,
  userEmail?: string | null
) => {
  switch (method) {
    case 'google':
      return {
        label: 'Google',
        description: userEmail ? `Google (${userEmail})` : 'Google Account',
        icon: <Mail size={16} color="#59F886" />,
      };
    case 'email':
      return {
        label: 'Email',
        description: userEmail ? `Email (${userEmail})` : 'Email Link',
        icon: <Mail size={16} color="#59F886" />,
      };
    case 'x':
      return {
        label: 'X (Twitter)',
        description: 'X (Twitter) Account',
        icon: <FaXTwitter size={16} color="#59F886" />,
      };
    case 'sms':
      return {
        label: 'SMS',
        description: 'SMS Passcode',
        icon: <Phone size={16} color="#59F886" />,
      };
    case 'wallet':
      return {
        label: 'Crypto Wallet',
        description: 'Wallet-based authentication',
        icon: <Wallet size={16} color="#59F886" />,
      };
    default:
      return {
        label: 'Unknown Method',
        description: 'Authentication method unavailable',
        icon: <User size={16} color="rgba(255, 255, 255, 0.7)" />,
      };
  }
};

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onSave }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const {
    isAuthenticated,
    logout,
    userEmail,
    userWallet,
    loginWithGoogle,
    loginWithX,
    loginWithWallet,
    authMethod: authMethodType,
  } = usePrivyAuth();
  const { getAddress } = useWalletAddress();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  // Check both Privy authentication and wallet connection
  const walletAddress = getAddress();
  const hasSession = isAuthenticated || !!walletAddress;

  // Determine user plan based on authentication - Users with sessions are all "Pro" now
  const isProUser = hasSession;
  const authMeta = getAuthMethodMeta(authMethodType, userEmail);
  const messageLimit = 'Unlimited'; // All authenticated users get unlimited
  const messagesUsed = usageData?.messagesUsedToday || 0;

  // Fetch usage data for authenticated users (optional, since they have unlimited)
  useEffect(() => {
    const fetchUsageData = async () => {
      if (hasSession) {
        try {
          const response = await fetch('/api/auth/usage', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            setUsageData(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch usage data:', error);
        }
      }
    };

    fetchUsageData();
  }, [hasSession]);

  const handleCopyAddress = () => {
    const addressToCopy = userWallet || walletAddress || address;
    if (addressToCopy) {
      navigator.clipboard
        .writeText(addressToCopy)
        .then(() => {
          toast({
            title: 'Address copied',
            description: 'Wallet address copied to clipboard',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        })
        .catch(() => {
          toast({
            title: 'Failed to copy',
            description: 'Could not copy address to clipboard',
            status: 'error',
            duration: 2000,
            isClosable: true,
          });
        });
    }
  };

  const handleSignOut = () => {
    if (isConnected) {
      disconnect(); // Disconnect wallet if connected
    }
    logout(); // Logout from Privy
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Account deleted',
          description: 'Your account has been successfully deleted.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        logout();
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* Account Overview */}
      <Box>
        <Heading size="md" color="white" mb={4}>
          Account Overview
        </Heading>
        <Card
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box
                    p={2}
                    borderRadius="md"
                    bg={isProUser ? 'green.500' : 'gray.500'}
                    color="white"
                  >
                    {isProUser ? <Crown size={20} /> : <User size={20} />}
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="600">
                      {hasSession ? 'Pro Plan' : 'Free Plan'}
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                      {hasSession
                        ? 'Full access to all features'
                        : 'Sign in to access all features'}
                    </Text>
                  </VStack>
                </HStack>
                <Badge
                  colorScheme={hasSession ? 'green' : 'gray'}
                  variant="solid"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {hasSession ? 'Pro' : 'Free'}
                </Badge>
              </Flex>

              {/* Message Usage */}
              <Divider borderColor="rgba(255, 255, 255, 0.1)" />
              <Flex justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Text color="white" fontWeight="500">
                    Message Usage
                  </Text>
                  <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                    {hasSession
                      ? 'Unlimited messages'
                      : 'Sign in for unlimited access'}
                  </Text>
                </VStack>
                {hasSession && (
                  <Text color="#59F886" fontSize="sm" fontWeight="500">
                    ∞ Unlimited
                  </Text>
                )}
              </Flex>

              {/* Account Type */}
              <Divider borderColor="rgba(255, 255, 255, 0.1)" />
              <Flex justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Text color="white" fontWeight="500">
                    Authentication Method
                  </Text>
                  <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                    {!hasSession
                      ? 'No Authentication'
                      : authMeta.description}
                  </Text>
                </VStack>
                <HStack spacing={2}>
                  {!hasSession ? (
                    <>
                      <User size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                        Not Signed In
                      </Text>
                    </>
                  ) : (
                    <>
                      {authMeta.icon}
                      <Text color="#59F886" fontSize="sm" fontWeight="500">
                        {authMeta.label}
                      </Text>
                    </>
                  )}
                </HStack>
              </Flex>
            </VStack>
          </CardBody>
        </Card>
      </Box>

      {/* Account Management Section (only show for authenticated users) */}
      {hasSession && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Account Management
          </Heading>
          <Card
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack spacing={3}>
                  <Box p={2} borderRadius="md" bg="#59F886" color="#000">
                    {userWallet ? (
                      <Wallet size={20} />
                    ) : userEmail ? (
                      <Mail size={20} />
                    ) : (
                      <FaXTwitter size={20} />
                    )}
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="600">
                      Connected Account
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                      Manage your authentication and account settings
                    </Text>
                  </VStack>
                </HStack>

                <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                {/* Account Details */}
                <Flex justify="space-between" align="center">
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="500">
                      Account Details
                    </Text>
                    <Text
                      color="rgba(255, 255, 255, 0.7)"
                      fontSize="sm"
                      fontFamily={(userWallet || walletAddress) ? 'mono' : 'inherit'}
                    >
                      {userWallet
                        ? `${userWallet.slice(0, 6)}...${userWallet.slice(-4)}`
                        : walletAddress
                        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                        : userEmail || 'X Account'}
                    </Text>
                    {hasSession && authMeta.description && (
                      <Text color="rgba(255, 255, 255, 0.6)" fontSize="xs">
                        Signed in with {authMeta.description}
                      </Text>
                    )}
                  </VStack>
                  {(userWallet || walletAddress) && (
                    <Button
                      onClick={handleCopyAddress}
                      size="sm"
                      leftIcon={<Copy size={16} />}
                      variant="outline"
                      colorScheme="green"
                    >
                      Copy
                    </Button>
                  )}
                </Flex>

                <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                {/* Sign Out */}
                <Flex justify="space-between" align="center">
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="500">
                      Sign Out
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                      Sign out of your account
                    </Text>
                  </VStack>
                  <Button
                    onClick={handleSignOut}
                    size="sm"
                    leftIcon={<LogOut size={16} />}
                    variant="outline"
                    colorScheme="orange"
                  >
                    Sign Out
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      )}

      {/* Sign In Section (only show for unauthenticated users) */}
      {!hasSession && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Sign In to Get Started
          </Heading>
          <Card
            bg="linear-gradient(135deg, rgba(89, 248, 134, 0.1) 0%, rgba(89, 248, 134, 0.05) 100%)"
            border="1px solid rgba(89, 248, 134, 0.3)"
          >
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack spacing={3}>
                  <Box p={2} borderRadius="md" bg="green.500" color="white">
                    <Crown size={24} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="sm" color="white">
                      Unlock Full Access
                    </Heading>
                    <Text color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                      Sign in with Google, X, or your crypto wallet
                    </Text>
                  </VStack>
                </HStack>

                <VStack spacing={3} align="start">
                  <HStack spacing={2}>
                    <Shield size={16} color="#59F886" />
                    <Text color="white" fontSize="sm">
                      Unlimited messages and features
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Shield size={16} color="#59F886" />
                    <Text color="white" fontSize="sm">
                      Personalized settings and preferences
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Shield size={16} color="#59F886" />
                    <Text color="white" fontSize="sm">
                      Advanced integrations and automations
                    </Text>
                  </HStack>
                </VStack>

                <VStack spacing={2} pt={2}>
                  <Button
                    onClick={loginWithGoogle}
                    bg="#59F886"
                    color="#000"
                    _hover={{
                      bg: '#4AE066',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(89, 248, 134, 0.3)',
                    }}
                    size="lg"
                    width="full"
                    fontWeight="600"
                    borderRadius="12px"
                    leftIcon={<Mail size={20} />}
                  >
                    Sign In with Google
                  </Button>
                  <Button
                    onClick={loginWithX}
                    bg="rgba(89, 248, 134, 0.2)"
                    color="#59F886"
                    border="1px solid #59F886"
                    _hover={{
                      bg: 'rgba(89, 248, 134, 0.3)',
                      transform: 'translateY(-1px)',
                    }}
                    size="lg"
                    width="full"
                    fontWeight="600"
                    borderRadius="12px"
                    leftIcon={<FaXTwitter size={20} />}
                  >
                    Sign In with X
                  </Button>
                  <Button
                    onClick={loginWithWallet}
                    bg="rgba(89, 248, 134, 0.2)"
                    color="#59F886"
                    border="1px solid #59F886"
                    _hover={{
                      bg: 'rgba(89, 248, 134, 0.3)',
                      transform: 'translateY(-1px)',
                    }}
                    size="lg"
                    width="full"
                    fontWeight="600"
                    borderRadius="12px"
                    leftIcon={<Wallet size={20} />}
                  >
                    Sign In with Wallet
                  </Button>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      )}

      {/* Danger Zone */}
      <Box>
        <Heading size="md" color="red.400" mb={4}>
          Danger Zone
        </Heading>
        <Card
          bg="rgba(255, 0, 0, 0.05)"
          border="1px solid rgba(255, 0, 0, 0.2)"
        >
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack spacing={3}>
                <Box p={2} borderRadius="md" bg="red.500" color="white">
                  <Trash2 size={20} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text color="white" fontWeight="600">
                    Delete Account
                  </Text>
                  <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                    Permanently delete your account and all associated data
                  </Text>
                </VStack>
              </HStack>

              <Text color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                This action cannot be undone. All your messages, jobs, and
                settings will be permanently removed.
              </Text>

              <Button
                onClick={onOpen}
                colorScheme="red"
                variant="outline"
                size="sm"
                alignSelf="flex-start"
                leftIcon={<Trash2 size={16} />}
              >
                Delete Account
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            bg="#1A1A1A"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text color="rgba(255, 255, 255, 0.8)">
                Are you sure you want to delete your account? This action cannot
                be undone. All your data, including messages, jobs, and settings
                will be permanently removed.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAccount}
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete Account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};
