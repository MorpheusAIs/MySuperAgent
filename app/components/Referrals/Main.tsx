import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  useToast,
  Badge,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Textarea,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Copy, 
  Gift, 
  Plus, 
  Eye, 
  EyeOff,
} from 'lucide-react';
import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useWalletAddress } from '@/services/wallet/utils';
import axios from 'axios';
import styles from './Main.module.css';

interface ReferralCode {
  id: number;
  code: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  description: string | null;
}

interface ReferralDashboard {
  total_referrals: number;
  active_referrals: number;
  jobs_earned_as_referrer: number;
  jobs_earned_as_referred: number;
  current_bonus_jobs: number;
  referred_by_wallet: string | null;
  active_referral_codes: number;
}

interface ReferralsMainProps {
  isSidebarOpen?: boolean;
}

export const ReferralsMain: React.FC<ReferralsMainProps> = ({
  isSidebarOpen = true,
}) => {
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCodeDescription, setNewCodeDescription] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<number | undefined>();
  
  const toast = useToast();
  const { isAuthenticated } = usePrivyAuth();
  const { getAddress } = useWalletAddress();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const walletAddress = getAddress();
      if (!walletAddress) return;

      // Load dashboard data
      const dashboardResponse = await axios.get('/api/v1/referrals', {
        headers: { 'x-wallet-address': walletAddress }
      });
      setDashboard(dashboardResponse.data);

      // Load user's referral codes
      const codesResponse = await axios.get('/api/v1/referrals/codes', {
        headers: { 'x-wallet-address': walletAddress }
      });
      setCodes(codesResponse.data.codes || []);

    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getAddress, toast]);

  useEffect(() => {
    if (isAuthenticated && getAddress()) {
      loadData();
    }
  }, [isAuthenticated, getAddress, loadData]);

  const handleUseReferralCode = async () => {
    if (!inputCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a referral code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmittingCode(true);
      const walletAddress = getAddress();
      if (!walletAddress) return;

      await axios.post('/api/v1/referrals', {
        action: 'use',
        referralCode: inputCode.trim().toUpperCase()
      }, {
        headers: { 'x-wallet-address': walletAddress }
      });

      toast({
        title: 'Success!',
        description: 'Referral code applied successfully. You and your referrer have been granted bonus jobs!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setInputCode('');
      loadData(); // Reload data to show updated stats

    } catch (error: any) {
      console.error('Error using referral code:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to use referral code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setGeneratingCode(true);
      const walletAddress = getAddress();
      if (!walletAddress) return;

      await axios.post('/api/v1/referrals', {
        action: 'generate',
        description: newCodeDescription || undefined,
        maxUses: newCodeMaxUses || undefined
      }, {
        headers: { 'x-wallet-address': walletAddress }
      });

      toast({
        title: 'Success!',
        description: 'New referral code generated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNewCodeDescription('');
      setNewCodeMaxUses(undefined);
      onClose();
      loadData(); // Reload to show new code

    } catch (error: any) {
      console.error('Error generating code:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to generate referral code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Referral code copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const toggleCodeActive = async (codeId: number, isActive: boolean) => {
    try {
      const walletAddress = getAddress();
      if (!walletAddress) return;

      await axios.put('/api/v1/referrals/codes', {
        codeId,
        isActive: !isActive
      }, {
        headers: { 'x-wallet-address': walletAddress }
      });

      toast({
        title: 'Success!',
        description: `Referral code ${!isActive ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      loadData();

    } catch (error: any) {
      console.error('Error toggling code:', error);
      toast({
        title: 'Error',
        description: 'Failed to update referral code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!isAuthenticated || !getAddress()) {
    return (
      <Container maxW="full" minH="100vh" bg="#0A0A0A" color="white" p={0}>
        <Box className={styles.mainContainer}>
          <VStack spacing={6} align="stretch" minH="full">
            {/* Header */}
            <Box className={styles.header}>
              <Heading size="lg" fontWeight="600" color="white">
                Referrals
              </Heading>
              <Text fontSize="md" color="rgba(255, 255, 255, 0.7)" mt={2}>
                Earn bonus jobs by referring friends and growing the community
              </Text>
            </Box>

            <Alert 
              status="warning" 
              bg="rgba(237, 137, 54, 0.1)" 
              border="1px solid rgba(237, 137, 54, 0.2)"
              borderRadius="8px"
            >
              <AlertIcon />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please connect your wallet to access the referrals system.
              </AlertDescription>
            </Alert>
          </VStack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="full" minH="100vh" bg="#0A0A0A" color="white" p={0}>
      <Box className={styles.mainContainer}>
        <VStack spacing={6} align="stretch" minH="full">
          {/* Header */}
          <Box className={styles.header}>
            <HStack spacing={3}>
              <Gift size={28} color="#667eea" />
              <Heading size="lg" fontWeight="600" color="white">
                Referrals
              </Heading>
            </HStack>
            <Text fontSize="md" color="rgba(255, 255, 255, 0.7)" mt={2}>
              Earn bonus jobs by referring friends and growing the community
            </Text>
          </Box>

          {loading ? (
            <Box className={styles.content} textAlign="center" py={12}>
              <Spinner size="xl" color="#667eea" />
              <Text mt={4} color="rgba(255, 255, 255, 0.6)">Loading your referral data...</Text>
            </Box>
          ) : (
            <Box className={styles.content}>
              <VStack spacing={8} align="stretch">
                {/* Stats Grid */}
                <Box>
                  <Text fontSize="lg" fontWeight="600" mb={4} color="white">
                    Your Referral Stats
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <Box className={styles.statCard}>
                      <Stat>
                        <StatLabel color="rgba(255, 255, 255, 0.6)">Total Referrals</StatLabel>
                        <StatNumber color="white" fontSize="2xl">{dashboard?.total_referrals || 0}</StatNumber>
                        <StatHelpText color="rgba(255, 255, 255, 0.5)">People you&apos;ve referred</StatHelpText>
                      </Stat>
                    </Box>
                    
                    <Box className={styles.statCard}>
                      <Stat>
                        <StatLabel color="rgba(255, 255, 255, 0.6)">Bonus Jobs Earned</StatLabel>
                        <StatNumber color="#48bb78" fontSize="2xl">{dashboard?.jobs_earned_as_referrer || 0}</StatNumber>
                        <StatHelpText color="rgba(255, 255, 255, 0.5)">From referring others</StatHelpText>
                      </Stat>
                    </Box>
                    
                    <Box className={styles.statCard}>
                      <Stat>
                        <StatLabel color="rgba(255, 255, 255, 0.6)">Available Bonus Jobs</StatLabel>
                        <StatNumber color="#667eea" fontSize="2xl">{dashboard?.current_bonus_jobs || 0}</StatNumber>
                        <StatHelpText color="rgba(255, 255, 255, 0.5)">Ready to use</StatHelpText>
                      </Stat>
                    </Box>
                    
                    <Box className={styles.statCard}>
                      <Stat>
                        <StatLabel color="rgba(255, 255, 255, 0.6)">Active Codes</StatLabel>
                        <StatNumber color="#805ad5" fontSize="2xl">{dashboard?.active_referral_codes || 0}</StatNumber>
                        <StatHelpText color="rgba(255, 255, 255, 0.5)">Your referral codes</StatHelpText>
                      </Stat>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* How it Works */}
                <Box className={styles.sectionCard}>
                  <Text fontSize="lg" fontWeight="600" mb={4} color="white">How Referrals Work</Text>
                  <VStack spacing={3} align="stretch">
                    <HStack>
                      <Box w={6} h={6} bg="#667eea" rounded="full" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="sm" fontWeight="bold" color="white">1</Text>
                      </Box>
                      <Text color="rgba(255, 255, 255, 0.8)">Generate a unique referral code below</Text>
                    </HStack>
                    <HStack>
                      <Box w={6} h={6} bg="#48bb78" rounded="full" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="sm" fontWeight="bold" color="white">2</Text>
                      </Box>
                      <Text color="rgba(255, 255, 255, 0.8)">Share your code with friends</Text>
                    </HStack>
                    <HStack>
                      <Box w={6} h={6} bg="#805ad5" rounded="full" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="sm" fontWeight="bold" color="white">3</Text>
                      </Box>
                      <Text color="rgba(255, 255, 255, 0.8)">When they use your code, you both get bonus jobs! (You: 10 jobs, Friend: 5 jobs)</Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Use Referral Code */}
                {!dashboard?.referred_by_wallet && (
                  <Box className={styles.sectionCard}>
                    <Text fontSize="lg" fontWeight="600" mb={4} color="white">Use a Referral Code</Text>
                    <Text color="rgba(255, 255, 255, 0.7)" mb={4}>
                      Have a referral code? Enter it below to get bonus jobs!
                    </Text>
                    <HStack spacing={3}>
                      <Input
                        placeholder="Enter referral code (e.g., ABC123XY)"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        maxLength={20}
                        className={styles.input}
                      />
                      <Button
                        onClick={handleUseReferralCode}
                        isLoading={submittingCode}
                        loadingText="Applying..."
                        className={styles.primaryButton}
                        leftIcon={<Gift size={16} />}
                      >
                        Apply Code
                      </Button>
                    </HStack>
                  </Box>
                )}

                {/* Referred Status */}
                {dashboard?.referred_by_wallet && (
                  <Alert 
                    status="info" 
                    bg="rgba(66, 153, 225, 0.1)" 
                    border="1px solid rgba(66, 153, 225, 0.2)"
                    borderRadius="8px"
                  >
                    <AlertIcon />
                    <AlertTitle>You were referred!</AlertTitle>
                    <AlertDescription>
                      You received {dashboard.jobs_earned_as_referred} bonus jobs for joining through a referral.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Your Referral Codes */}
                <Box>
                  <HStack justify="space-between" align="center" mb={4}>
                    <Text fontSize="lg" fontWeight="600" color="white">Your Referral Codes</Text>
                    <Button
                      onClick={onOpen}
                      leftIcon={<Plus size={16} />}
                      className={styles.primaryButton}
                      size="sm"
                    >
                      Generate Code
                    </Button>
                  </HStack>

                  {codes.length === 0 ? (
                    <Box className={styles.sectionCard} textAlign="center" py={8}>
                      <Text color="rgba(255, 255, 255, 0.6)" mb={4}>No referral codes yet</Text>
                      <Button
                        onClick={onOpen}
                        leftIcon={<Plus size={16} />}
                        className={styles.primaryButton}
                      >
                        Generate Your First Code
                      </Button>
                    </Box>
                  ) : (
                    <VStack spacing={3}>
                      {codes.map((code) => (
                        <Box key={code.id} className={styles.codeCard}>
                          <HStack justify="space-between" align="center">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Text fontSize="xl" fontWeight="bold" fontFamily="mono" color="white">
                                  {code.code}
                                </Text>
                                <Badge colorScheme={code.is_active ? 'green' : 'gray'}>
                                  {code.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </HStack>
                              {code.description && (
                                <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">{code.description}</Text>
                              )}
                              <HStack spacing={4} fontSize="sm" color="rgba(255, 255, 255, 0.5)">
                                <Text>Used: {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''}</Text>
                                <Text>Created: {new Date(code.created_at).toLocaleDateString()}</Text>
                                {code.expires_at && (
                                  <Text>Expires: {new Date(code.expires_at).toLocaleDateString()}</Text>
                                )}
                              </HStack>
                            </VStack>
                            
                            <HStack spacing={2}>
                              <Tooltip label="Copy code">
                                <IconButton
                                  aria-label="Copy code"
                                  icon={<Copy size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  color="rgba(255, 255, 255, 0.7)"
                                  _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
                                  onClick={() => copyToClipboard(code.code)}
                                />
                              </Tooltip>
                              
                              <Tooltip label={code.is_active ? "Deactivate" : "Activate"}>
                                <IconButton
                                  aria-label="Toggle active"
                                  icon={code.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  color="rgba(255, 255, 255, 0.7)"
                                  _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
                                  onClick={() => toggleCodeActive(code.id, code.is_active)}
                                />
                              </Tooltip>
                            </HStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </VStack>
            </Box>
          )}
        </VStack>

        {/* Generate Code Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent bg="#1A1A1A" borderColor="rgba(255, 255, 255, 0.1)" border="1px solid">
            <ModalHeader color="white">Generate New Referral Code</ModalHeader>
            <ModalCloseButton color="rgba(255, 255, 255, 0.7)" />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="rgba(255, 255, 255, 0.8)">Description (Optional)</FormLabel>
                  <Textarea
                    placeholder="Add a note about this code..."
                    value={newCodeDescription}
                    onChange={(e) => setNewCodeDescription(e.target.value)}
                    className={styles.input}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel color="rgba(255, 255, 255, 0.8)">Max Uses (Optional)</FormLabel>
                  <NumberInput
                    min={1}
                    max={1000}
                    value={newCodeMaxUses || ''}
                    onChange={(_, value) => setNewCodeMaxUses(isNaN(value) ? undefined : value)}
                  >
                    <NumberInputField
                      placeholder="Leave empty for unlimited uses"
                      className={styles.input}
                    />
                  </NumberInput>
                </FormControl>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose} color="rgba(255, 255, 255, 0.7)">
                Cancel
              </Button>
              <Button 
                className={styles.primaryButton}
                onClick={handleGenerateCode}
                isLoading={generatingCode}
                loadingText="Generating..."
              >
                Generate Code
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Container>
  );
};