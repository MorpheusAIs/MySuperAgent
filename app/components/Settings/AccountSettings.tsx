import { useAuth } from '@/contexts/auth/AuthProvider';
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
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Copy,
  Crown,
  LogOut,
  Shield,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

interface AccountSettingsProps {
  onSave: () => void;
}

interface UsageData {
  messagesUsedToday: number;
  messagesLimit: number;
  isUnlimited: boolean;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onSave }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isAuthenticated, logout } = useAuth();
  const { data: session } = useSession();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  // Determine user plan based on wallet connection
  // If wallet is connected, user is on Pro plan regardless of authentication status
  const isProUser = isConnected && address;
  const hasGoogleAuth = !!session?.user;
  const planType = isProUser ? 'Pro' : 'Free';
  const messageLimit = isProUser ? 'Unlimited' : '10 per day';
  const messagesUsed = usageData?.messagesUsedToday || 0;

  // Fetch usage data for free users
  useEffect(() => {
    const fetchUsageData = async () => {
      if (!isProUser && isAuthenticated) {
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
  }, [isProUser, isAuthenticated]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard
        .writeText(address)
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

  const handleDisconnectWallet = () => {
    disconnect();
    logout(); // Also logout from the auth system
    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected',
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
                      {planType} Plan
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                      {isProUser
                        ? 'Full access to all features'
                        : 'Limited access with email authentication'}
                    </Text>
                  </VStack>
                </HStack>
                <Badge
                  colorScheme={isProUser ? 'green' : 'gray'}
                  variant="solid"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {planType}
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
                    {isProUser
                      ? messageLimit
                      : `${messagesUsed}/10 messages used today`}
                  </Text>
                </VStack>
                {!isProUser && (
                  <Text color="orange.400" fontSize="sm" fontWeight="500">
                    {10 - messagesUsed} remaining
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
                    {isProUser
                      ? 'Crypto Wallet Connected'
                      : hasGoogleAuth
                      ? `Google Account (${session?.user?.email})`
                      : 'No Authentication'}
                  </Text>
                </VStack>
                <HStack spacing={2}>
                  {isProUser ? (
                    <>
                      <Wallet size={16} color="#59F886" />
                      <Text color="#59F886" fontSize="sm" fontWeight="500">
                        Pro Plan
                      </Text>
                    </>
                  ) : hasGoogleAuth ? (
                    <>
                      <User size={16} color="#FFA500" />
                      <Text color="#FFA500" fontSize="sm" fontWeight="500">
                        Free Plan
                      </Text>
                    </>
                  ) : (
                    <>
                      <User size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                        Not Signed In
                      </Text>
                    </>
                  )}
                </HStack>
              </Flex>
            </VStack>
          </CardBody>
        </Card>
      </Box>

      {/* Wallet Management Section (only show for pro users) */}
      {isProUser && address && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Wallet Management
          </Heading>
          <Card
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack spacing={3}>
                  <Box p={2} borderRadius="md" bg="#59F886" color="#000">
                    <Wallet size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="600">
                      Connected Wallet
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                      Manage your connected crypto wallet
                    </Text>
                  </VStack>
                </HStack>

                <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                {/* Wallet Address */}
                <Flex justify="space-between" align="center">
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="500">
                      Wallet Address
                    </Text>
                    <Text
                      color="rgba(255, 255, 255, 0.7)"
                      fontSize="sm"
                      fontFamily="mono"
                    >
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </Text>
                  </VStack>
                  <Button
                    onClick={handleCopyAddress}
                    size="sm"
                    leftIcon={<Copy size={16} />}
                    variant="outline"
                    colorScheme="green"
                  >
                    Copy
                  </Button>
                </Flex>

                <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                {/* Disconnect Wallet */}
                <Flex justify="space-between" align="center">
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="500">
                      Disconnect Wallet
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                      This will switch you back to Free plan
                    </Text>
                  </VStack>
                  <Button
                    onClick={handleDisconnectWallet}
                    size="sm"
                    leftIcon={<LogOut size={16} />}
                    variant="outline"
                    colorScheme="orange"
                  >
                    Disconnect
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      )}

      {/* Upgrade Section (only show for free users) */}
      {!isProUser && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Upgrade to Pro
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
                      Connect your crypto wallet to get unlimited messages and
                      premium features
                    </Text>
                  </VStack>
                </HStack>

                <VStack spacing={3} align="start">
                  <HStack spacing={2}>
                    <Shield size={16} color="#59F886" />
                    <Text color="white" fontSize="sm">
                      Unlimited messages per day
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Shield size={16} color="#59F886" />
                    <Text color="white" fontSize="sm">
                      Priority support
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Shield size={16} color="#59F886" />
                    <Text color="white" fontSize="sm">
                      Advanced features and integrations
                    </Text>
                  </HStack>
                </VStack>

                <Box pt={2}>
                  <ConnectButton.Custom>
                    {({ openConnectModal, connectModalOpen }) => (
                      <Button
                        onClick={openConnectModal}
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
                        isLoading={connectModalOpen}
                        leftIcon={<Wallet size={20} />}
                      >
                        Connect Wallet to Upgrade
                      </Button>
                    )}
                  </ConnectButton.Custom>
                </Box>
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
