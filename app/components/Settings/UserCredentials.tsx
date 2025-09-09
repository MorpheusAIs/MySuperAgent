import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Grid,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  IconButton,
  Collapse,
  Divider,
  Badge,
  Flex,
} from '@chakra-ui/react';
import { ChevronDown, ChevronRight, Eye, EyeOff, RefreshCw, Trash2, Plus } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useWalletAddress } from '@/services/wallet/utils';
import Image from 'next/image';

interface UserCredentialsProps {
  onSave?: () => void;
}

interface ServiceConfig {
  name: string;
  displayName: string;
  logo: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'password';
    required: boolean;
    placeholder?: string;
  }[];
  description: string;
}

const SUPPORTED_SERVICES: ServiceConfig[] = [
  {
    name: 'github',
    displayName: 'GitHub',
    logo: '/assets/logo.svg', // Using placeholder for now
    description: 'Access GitHub repositories, issues, and pull requests',
    fields: [
      { name: 'token', label: 'Personal Access Token', type: 'password', required: true, placeholder: 'ghp_xxxxxxxxxxxx' }
    ]
  },
  {
    name: 'slack',
    displayName: 'Slack',
    logo: '/assets/logo.svg', // Using placeholder for now
    description: 'Send messages and interact with Slack workspaces',
    fields: [
      { name: 'bot_token', label: 'Bot User OAuth Token', type: 'password', required: true, placeholder: 'xoxb-xxxxxxxxxxxx' },
      { name: 'app_token', label: 'App-Level Token', type: 'password', required: false, placeholder: 'xapp-xxxxxxxxxxxx' }
    ]
  },
  {
    name: 'notion',
    displayName: 'Notion',
    logo: '/assets/logo.svg', // Using placeholder for now
    description: 'Create and manage Notion pages and databases',
    fields: [
      { name: 'token', label: 'Integration Token', type: 'password', required: true, placeholder: 'secret_xxxxxxxxxxxx' }
    ]
  },
  {
    name: 'google_maps',
    displayName: 'Google Maps',
    logo: '/assets/logo.svg', // Using placeholder for now
    description: 'Location services, directions, and place information',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'AIzaxxxxxxxxxxxxxxxxxx' }
    ]
  },
  {
    name: 'brave_search',
    displayName: 'Brave Search',
    logo: '/assets/logo.svg', // Using placeholder for now
    description: 'Web search and information retrieval',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'BSAxxxxxxxxxxxxxxxxxx' }
    ]
  },
  {
    name: 'everart',
    displayName: 'EverArt',
    logo: '/assets/logo.svg', // Using placeholder for now
    description: 'AI image generation and artistic creation',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'eva_xxxxxxxxxxxx' }
    ]
  }
];

export const UserCredentials: React.FC<UserCredentialsProps> = ({ onSave }) => {
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [storedCredentials, setStoredCredentials] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [viewingCredentials, setViewingCredentials] = useState<Record<string, Record<string, string>>>({});
  
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { isAuthenticated, userWallet } = usePrivyAuth();
  const walletAddress = useWalletAddress();
  const toast = useToast();
  
  // Check if user has session (either Privy or direct wallet)
  const userAddress = userWallet || walletAddress || address;
  const hasSession = isAuthenticated || !!userAddress;

  // Load stored credentials on mount
  useEffect(() => {
    if (hasSession && userAddress) {
      loadStoredCredentials();
    }
  }, [hasSession, userAddress]);

  const loadStoredCredentials = async () => {
    if (!userAddress) return;

    try {
      const response = await fetch('/api/credentials/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: userAddress })
      });

      if (response.ok) {
        const data = await response.json();
        setStoredCredentials(data.services || {});
      }
    } catch (error) {
      console.error('Failed to load stored credentials:', error);
    }
  };

  const handleCredentialChange = (serviceName: string, fieldName: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        [fieldName]: value
      }
    }));
  };

  const handleSaveCredentials = async (serviceName: string) => {
    if (!userAddress) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to save credentials',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const serviceCredentials = credentials[serviceName];
    if (!serviceCredentials) return;

    const service = SUPPORTED_SERVICES.find(s => s.name === serviceName);
    if (!service) return;

    // Validate required fields
    const missingFields = service.fields
      .filter(field => field.required && !serviceCredentials[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(prev => ({ ...prev, [serviceName]: true }));

    try {
      // Sign a message to derive encryption key
      const message = `Encrypt credentials for ${serviceName} - ${Date.now()}`;
      const signature = await signMessageAsync({ message });

      // Store each credential
      for (const [credentialName, value] of Object.entries(serviceCredentials)) {
        if (value.trim()) {
          await fetch('/api/credentials/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: userAddress,
              serviceName,
              credentialName,
              credentialValue: value,
              masterKey: signature
            })
          });
        }
      }

      toast({
        title: 'Credentials Saved',
        description: `${service.displayName} credentials have been encrypted and stored securely`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear form and reload stored credentials
      setCredentials(prev => ({ ...prev, [serviceName]: {} }));
      setExpandedService(null);
      await loadStoredCredentials();
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to save credentials:', error);
      toast({
        title: 'Failed to Save',
        description: 'Could not save credentials. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(prev => ({ ...prev, [serviceName]: false }));
    }
  };

  const handleViewCredentials = async (serviceName: string) => {
    if (!userAddress) return;

    const isCurrentlyShowing = showCredentials[serviceName];
    
    if (isCurrentlyShowing) {
      // Hide credentials
      setShowCredentials(prev => ({ ...prev, [serviceName]: false }));
      setViewingCredentials(prev => ({ ...prev, [serviceName]: {} }));
      return;
    }

    setLoading(prev => ({ ...prev, [`view_${serviceName}`]: true }));

    try {
      // Sign a message to derive decryption key
      const message = `Decrypt credentials for ${serviceName} - ${Date.now()}`;
      const signature = await signMessageAsync({ message });

      const response = await fetch(`/api/credentials/${serviceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: userAddress,
          masterKey: signature
        })
      });

      if (response.ok) {
        const data = await response.json();
        setViewingCredentials(prev => ({ ...prev, [serviceName]: data.credentials }));
        setShowCredentials(prev => ({ ...prev, [serviceName]: true }));

        // Auto-hide after 10 seconds
        setTimeout(() => {
          setShowCredentials(prev => ({ ...prev, [serviceName]: false }));
          setViewingCredentials(prev => ({ ...prev, [serviceName]: {} }));
        }, 10000);
      } else {
        throw new Error('Failed to decrypt credentials');
      }
    } catch (error) {
      console.error('Failed to view credentials:', error);
      toast({
        title: 'Failed to Decrypt',
        description: 'Could not decrypt credentials. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(prev => ({ ...prev, [`view_${serviceName}`]: false }));
    }
  };

  const handleDeleteCredentials = async (serviceName: string) => {
    if (!userAddress) return;
    
    if (!confirm(`Are you sure you want to delete all ${serviceName} credentials? This action cannot be undone.`)) {
      return;
    }

    setLoading(prev => ({ ...prev, [`delete_${serviceName}`]: true }));

    try {
      const storedCreds = storedCredentials[serviceName] || [];
      
      for (const credentialName of storedCreds) {
        await fetch('/api/credentials/store', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: userAddress,
            serviceName,
            credentialName
          })
        });
      }

      toast({
        title: 'Credentials Deleted',
        description: `All ${serviceName} credentials have been removed`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      await loadStoredCredentials();
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      toast({
        title: 'Failed to Delete',
        description: 'Could not delete credentials. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(prev => ({ ...prev, [`delete_${serviceName}`]: false }));
    }
  };

  if (!hasSession) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="rgba(255, 255, 255, 0.6)" fontSize="14px">
          Please connect your wallet to manage credentials
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text color="white" fontSize="14px" fontWeight="500" mb={2}>
          User Credentials
        </Text>
        <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
          Securely store API keys and credentials for external services. 
          All credentials are encrypted using your wallet signature and stored locally.
        </Text>
      </Box>

      <Grid templateColumns="1fr" gap={3}>
        {SUPPORTED_SERVICES.map((service) => {
          const hasStoredCredentials = storedCredentials[service.name]?.length > 0;
          const isExpanded = expandedService === service.name;

          return (
            <Box
              key={service.name}
              bg="rgba(255, 255, 255, 0.02)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="8px"
              overflow="hidden"
            >
              {/* Service Header */}
              <Flex
                p={3}
                align="center"
                justify="space-between"
                cursor="pointer"
                onClick={() => setExpandedService(isExpanded ? null : service.name)}
                _hover={{ bg: "rgba(255, 255, 255, 0.02)" }}
              >
                <HStack spacing={3}>
                  <Box
                    width="32px"
                    height="32px"
                    borderRadius="6px"
                    overflow="hidden"
                    bg="rgba(255, 255, 255, 0.1)"
                    position="relative"
                  >
                    <Image
                      src={service.logo}
                      alt={`${service.displayName} logo`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <HStack spacing={2}>
                      <Text color="white" fontSize="14px" fontWeight="500">
                        {service.displayName}
                      </Text>
                      {hasStoredCredentials && (
                        <Badge colorScheme="green" size="sm">
                          Configured
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
                      {service.description}
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack spacing={2}>
                  {hasStoredCredentials && (
                    <>
                      <IconButton
                        aria-label="View credentials"
                        icon={loading[`view_${service.name}`] ? <Spinner size="xs" /> : 
                              showCredentials[service.name] ? <EyeOff size={16} /> : <Eye size={16} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCredentials(service.name);
                        }}
                        isDisabled={loading[`view_${service.name}`]}
                      />
                      <IconButton
                        aria-label="Delete credentials"
                        icon={loading[`delete_${service.name}`] ? <Spinner size="xs" /> : <Trash2 size={16} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCredentials(service.name);
                        }}
                        isDisabled={loading[`delete_${service.name}`]}
                      />
                    </>
                  )}
                  {isExpanded ? <ChevronDown size={16} color="rgba(255, 255, 255, 0.6)" /> : 
                               <ChevronRight size={16} color="rgba(255, 255, 255, 0.6)" />}
                </HStack>
              </Flex>

              {/* Expanded Content */}
              <Collapse in={isExpanded}>
                <Box px={3} pb={3}>
                  <Divider borderColor="rgba(255, 255, 255, 0.1)" mb={3} />
                  
                  {/* View Stored Credentials */}
                  {showCredentials[service.name] && viewingCredentials[service.name] && (
                    <Box mb={4} p={3} bg="rgba(0, 255, 0, 0.05)" borderRadius="6px" border="1px solid rgba(0, 255, 0, 0.2)">
                      <Text color="white" fontSize="12px" fontWeight="500" mb={2}>
                        Stored Credentials (will hide automatically):
                      </Text>
                      <VStack spacing={2} align="stretch">
                        {Object.entries(viewingCredentials[service.name]).map(([key, value]) => (
                          <Box key={key}>
                            <Text fontSize="11px" color="rgba(255, 255, 255, 0.7)" mb={1}>
                              {service.fields.find(f => f.name === key)?.label || key}:
                            </Text>
                            <Box
                              p={2}
                              bg="rgba(255, 255, 255, 0.05)"
                              borderRadius="4px"
                              fontFamily="mono"
                              fontSize="11px"
                              color="rgba(255, 255, 255, 0.9)"
                              wordBreak="break-all"
                            >
                              {value}
                            </Box>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {/* Add/Update Credentials Form */}
                  <VStack spacing={3} align="stretch">
                    {service.fields.map((field) => (
                      <FormControl key={field.name}>
                        <FormLabel color="white" fontSize="12px" fontWeight="500">
                          {field.label} {field.required && <Text as="span" color="red.400">*</Text>}
                        </FormLabel>
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={credentials[service.name]?.[field.name] || ''}
                          onChange={(e) => handleCredentialChange(service.name, field.name, e.target.value)}
                          bg="rgba(255, 255, 255, 0.05)"
                          border="1px solid rgba(255, 255, 255, 0.1)"
                          color="white"
                          fontSize="12px"
                          _focus={{
                            borderColor: "rgba(255, 255, 255, 0.3)",
                            boxShadow: "none"
                          }}
                        />
                      </FormControl>
                    ))}

                    <Button
                      leftIcon={loading[service.name] ? <Spinner size="xs" /> : <Plus size={16} />}
                      onClick={() => handleSaveCredentials(service.name)}
                      isDisabled={loading[service.name] || !credentials[service.name]}
                      bg="rgba(255, 255, 255, 0.1)"
                      color="white"
                      _hover={{ bg: "rgba(255, 255, 255, 0.15)" }}
                      size="sm"
                      fontSize="12px"
                    >
                      {hasStoredCredentials ? 'Update' : 'Save'} Credentials
                    </Button>
                  </VStack>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Grid>

      <Button
        leftIcon={<RefreshCw size={16} />}
        onClick={loadStoredCredentials}
        variant="ghost"
        colorScheme="whiteAlpha"
        size="sm"
        fontSize="12px"
      >
        Refresh
      </Button>
    </VStack>
  );
};