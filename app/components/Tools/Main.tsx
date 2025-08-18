import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Switch,
  useToast,
  Flex,
  Spinner,
  Divider,
  SimpleGrid,
  Badge,
  Tooltip,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  Settings,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import styles from './Main.module.css';

interface MCPServer {
  name: string;
  displayName: string;
  description: string;
  category: string;
  requiredCredentials: Array<{
    name: string;
    displayName: string;
    type: string;
    description: string;
    required: boolean;
    placeholder?: string;
  }>;
  isPopular: boolean;
  capabilities: string[];
  serverUrl?: string;
  documentationUrl?: string;
}

interface MCPServerStatus {
  serverName: string;
  isEnabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'unknown';
  lastHealthCheck: string | null;
  availableTools: number;
  endpoint?: string;
}

interface UserCredentials {
  [serviceName: string]: string[];
}

export const ToolsMain: React.FC<{ isSidebarOpen?: boolean }> = ({
  isSidebarOpen = false,
}) => {
  const [availableServers, setAvailableServers] = useState<MCPServer[]>([]);
  const [enabledServers, setEnabledServers] = useState<MCPServerStatus[]>([]);
  const [userCredentials, setUserCredentials] = useState<UserCredentials>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const toast = useToast();

  const loadMCPData = useCallback(async () => {
    try {
      await Promise.all([
        loadAvailableServers(),
        loadEnabledServers(),
        loadUserCredentials()
      ]);
    } catch (error) {
      console.error('Failed to load MCP data:', error);
      toast({
        title: 'Failed to Load Data',
        description: 'Could not load MCP server information',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGlobalLoading(false);
    }
  }, [address, toast]);

  const loadAvailableServers = async () => {
    try {
      const response = await fetch('/api/mcp/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableServers(data.servers || []);
      }
    } catch (error) {
      console.error('Failed to load available MCP servers:', error);
    }
  };

  const loadEnabledServers = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/mcp/servers/status?walletAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setEnabledServers(data.servers || []);
      }
    } catch (error) {
      console.error('Failed to load enabled MCP servers:', error);
    }
  };

  const loadUserCredentials = async () => {
    if (!address) return;

    try {
      const response = await fetch('/api/credentials/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });

      if (response.ok) {
        const data = await response.json();
        setUserCredentials(data.services || {});
      }
    } catch (error) {
      console.error('Failed to load user credentials:', error);
    }
  };

  useEffect(() => {
    if (address) {
      loadMCPData();
    } else {
      setGlobalLoading(false);
    }
  }, [address, loadMCPData]);

  const handleToggleServer = async (serverName: string, enable: boolean) => {
    if (!address) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to manage MCP servers',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const server = availableServers.find(s => s.name === serverName);
    if (!server) return;

    // Check if user has required credentials
    const missingCredentials = server.requiredCredentials.filter(
      cred => !userCredentials[cred.name] || userCredentials[cred.name].length === 0
    );

    if (enable && missingCredentials.length > 0) {
      toast({
        title: 'Missing Credentials',
        description: `Please configure credentials for: ${missingCredentials.map(cred => cred.displayName).join(', ')}`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(prev => ({ ...prev, [serverName]: true }));

    try {
      if (enable) {
        // Sign message for credential access
        const message = `Enable MCP server ${serverName} - ${Date.now()}`;
        const signature = await signMessageAsync({ message });

        const response = await fetch('/api/mcp/servers/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            serverName,
            masterKey: signature
          })
        });

        if (!response.ok) {
          throw new Error('Failed to enable MCP server');
        }

        toast({
          title: 'Server Enabled',
          description: `${server.displayName} has been enabled and is connecting...`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await fetch('/api/mcp/servers/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            serverName
          })
        });

        if (!response.ok) {
          throw new Error('Failed to disable MCP server');
        }

        toast({
          title: 'Server Disabled',
          description: `${server.displayName} has been disabled`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

      await loadEnabledServers();
    } catch (error) {
      console.error('Failed to toggle MCP server:', error);
      toast({
        title: 'Operation Failed',
        description: `Could not ${enable ? 'enable' : 'disable'} ${server.displayName}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(prev => ({ ...prev, [serverName]: false }));
    }
  };

  const handleRunHealthCheck = async () => {
    if (!address) return;

    setGlobalLoading(true);
    try {
      const response = await fetch('/api/mcp/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });

      if (response.ok) {
        await loadEnabledServers();
        toast({
          title: 'Health Check Complete',
          description: 'All enabled servers have been checked',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Failed to run health check:', error);
      toast({
        title: 'Health Check Failed',
        description: 'Could not check server health',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGlobalLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={16} color="#48BB78" />;
      case 'error':
        return <XCircle size={16} color="#F56565" />;
      case 'disconnected':
        return <AlertCircle size={16} color="#ED8936" />;
      default:
        return <AlertCircle size={16} color="#A0AEC0" />;
    }
  };

  const isServerEnabled = (serverName: string) => {
    return enabledServers.some(s => s.serverName === serverName && s.isEnabled);
  };

  const getServerStatus = (serverName: string) => {
    return enabledServers.find(s => s.serverName === serverName);
  };

  const hasRequiredCredentials = (server: MCPServer) => {
    return server.requiredCredentials.every(cred => 
      userCredentials[cred.name] && userCredentials[cred.name].length > 0
    );
  };

  // Filter and search logic
  const categories = ['all', ...new Set(availableServers.map(s => s.category))];
  
  const filteredServers = availableServers.filter(server => {
    const matchesSearch = server.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || server.category === selectedCategory;
    
    const matchesEnabledFilter = !showOnlyEnabled || isServerEnabled(server.name);
    
    return matchesSearch && matchesCategory && matchesEnabledFilter;
  });

  // Statistics
  const totalEnabledServers = enabledServers.filter(s => s.isEnabled).length;
  const connectedServers = enabledServers.filter(s => s.connectionStatus === 'connected').length;
  const totalAvailableTools = enabledServers.reduce((sum, s) => sum + (s.availableTools || 0), 0);

  if (globalLoading) {
    return (
      <Box className={styles.container}>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color="white" />
        </Flex>
      </Box>
    );
  }

  if (!address) {
    return (
      <Box className={styles.container}>
        <Box className={styles.emptyState}>
          <VStack spacing={6}>
            <Settings size={64} color="rgba(255, 255, 255, 0.3)" />
            <VStack spacing={3}>
              <Text className={styles.emptyTitle}>Connect Your Wallet</Text>
              <Text className={styles.emptySubtitle}>
                Please connect your wallet to access and manage your MCP server tools
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      {/* Header */}
      <Box className={styles.header}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text className={styles.title}>Tools</Text>
              <Text className={styles.subtitle}>
                Manage your Model Context Protocol (MCP) servers and external tool integrations
              </Text>
            </VStack>
            <Button
              leftIcon={globalLoading ? <Spinner size="sm" /> : <RefreshCw size={16} />}
              onClick={handleRunHealthCheck}
              isDisabled={globalLoading || totalEnabledServers === 0}
              className={styles.actionButton}
              size="lg"
            >
              Health Check
            </Button>
          </HStack>
          <Divider borderColor="rgba(255, 255, 255, 0.1)" />
        </VStack>
      </Box>

      {/* Statistics */}
      <Box className={styles.statsContainer}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box className={styles.statCard}>
            <Text className={styles.statLabel}>Enabled Servers</Text>
            <Text className={styles.statNumber}>{totalEnabledServers}</Text>
            <Text className={styles.statHelper}>of {availableServers.length} available</Text>
          </Box>
          
          <Box className={styles.statCard}>
            <Text className={styles.statLabel}>Connected</Text>
            <Text className={styles.statNumber} color="#48BB78">{connectedServers}</Text>
            <Text className={styles.statHelper}>healthy connections</Text>
          </Box>
          
          <Box className={styles.statCard}>
            <Text className={styles.statLabel}>Available Tools</Text>
            <Text className={styles.statNumber} color="#4299E1">{totalAvailableTools}</Text>
            <Text className={styles.statHelper}>ready to use</Text>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Filters */}
      <Box className={styles.filtersContainer}>
        <HStack spacing={4} flex={1}>
          <InputGroup maxW="300px">
            <InputLeftElement>
              <Search size={16} color="rgba(255, 255, 255, 0.6)" />
            </InputLeftElement>
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </InputGroup>

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            maxW="200px"
            className={styles.categorySelect}
          >
            {categories.map(category => (
              <option key={category} value={category} style={{ background: '#1A202C' }}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </Select>

          <HStack>
            <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">Enabled only</Text>
            <Switch
              isChecked={showOnlyEnabled}
              onChange={(e) => setShowOnlyEnabled(e.target.checked)}
              colorScheme="blue"
            />
          </HStack>
        </HStack>
      </Box>

      {/* Missing Credentials Alert */}
      {Object.keys(userCredentials).length === 0 && (
        <Alert status="warning" className={styles.credentialsAlert}>
          <AlertIcon color="orange.400" />
          <Box>
            <AlertTitle fontSize="md" color="orange.400">No credentials configured!</AlertTitle>
            <AlertDescription fontSize="sm" color="rgba(255, 255, 255, 0.7)">
              Configure your API credentials in Settings → Credentials to enable MCP servers.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Tools Grid */}
      <Box className={styles.content}>
        {filteredServers.length === 0 ? (
          <Box className={styles.emptyState}>
            <VStack spacing={6}>
              <Search size={48} color="rgba(255, 255, 255, 0.3)" />
              <VStack spacing={3}>
                <Text className={styles.emptyTitle}>No tools found</Text>
                <Text className={styles.emptySubtitle}>
                  No tools match your current search criteria
                </Text>
              </VStack>
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredServers.map((server) => {
              const enabled = isServerEnabled(server.name);
              const status = getServerStatus(server.name);
              const hasCredentials = hasRequiredCredentials(server);
              const isLoading = loading[server.name];

              return (
                <Box key={server.name} className={styles.toolCard}>
                  <VStack spacing={4} align="stretch">
                    {/* Header */}
                    <Flex justify="space-between" align="start">
                      <HStack spacing={3}>
                        <Box className={styles.toolIcon}>
                          <Settings size={20} color="rgba(255, 255, 255, 0.6)" />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <HStack spacing={2}>
                            <Text className={styles.toolName}>
                              {server.displayName}
                            </Text>
                            {server.isPopular && (
                              <Badge colorScheme="blue" size="sm">
                                <Zap size={8} style={{ marginRight: '2px' }} />
                                Popular
                              </Badge>
                            )}
                          </HStack>
                          <Badge colorScheme="gray" size="xs">
                            {server.category}
                          </Badge>
                        </VStack>
                      </HStack>

                      <Switch
                        size="md"
                        isChecked={enabled}
                        isDisabled={isLoading || (!enabled && !hasCredentials)}
                        onChange={(e) => handleToggleServer(server.name, e.target.checked)}
                        colorScheme="green"
                      />
                    </Flex>

                    {/* Description */}
                    <Text className={styles.toolDescription}>
                      {server.description}
                    </Text>

                    {/* Status */}
                    {enabled && status && (
                      <HStack spacing={4}>
                        <HStack spacing={1}>
                          {getStatusIcon(status.connectionStatus)}
                          <Text fontSize="xs" className={styles.statusText} data-status={status.connectionStatus}>
                            {status.connectionStatus}
                          </Text>
                        </HStack>
                        {status.availableTools > 0 && (
                          <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)">
                            {status.availableTools} tools
                          </Text>
                        )}
                      </HStack>
                    )}

                    {/* Capabilities */}
                    <Box>
                      <Text className={styles.capabilitiesLabel}>
                        Capabilities:
                      </Text>
                      <Flex flexWrap="wrap" gap={1}>
                        {server.capabilities.slice(0, 3).map((capability, index) => (
                          <Badge key={index} size="xs" colorScheme="purple">
                            {capability}
                          </Badge>
                        ))}
                        {server.capabilities.length > 3 && (
                          <Badge size="xs" colorScheme="gray">
                            +{server.capabilities.length - 3} more
                          </Badge>
                        )}
                      </Flex>
                    </Box>

                    {/* Required Credentials */}
                    {server.requiredCredentials.length > 0 && (
                      <Box>
                        <Text className={styles.credentialsLabel}>
                          Required credentials:
                        </Text>
                        <Flex flexWrap="wrap" gap={1}>
                          {server.requiredCredentials.map((cred, index) => (
                            <Badge
                              key={index}
                              size="xs"
                              colorScheme={
                                userCredentials[cred.name] && userCredentials[cred.name].length > 0
                                  ? "green"
                                  : "red"
                              }
                            >
                              {cred.displayName}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {/* Actions */}
                    {server.documentationUrl && (
                      <Button
                        as="a"
                        href={server.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        leftIcon={<ExternalLink size={14} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        fontSize="xs"
                        className={styles.docButton}
                      >
                        Documentation
                      </Button>
                    )}

                    {isLoading && (
                      <Box textAlign="center">
                        <Spinner size="sm" color="white" />
                      </Box>
                    )}
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
};