import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Grid,
  Switch,
  useToast,
  Spinner,
  IconButton,
  Collapse,
  Divider,
  Badge,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronDown, ChevronRight, RefreshCw, Settings, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import Image from 'next/image';

interface MCPConfigurationProps {
  onSave?: () => void;
}

interface MCPServer {
  name: string;
  displayName: string;
  description: string;
  category: string;
  requiredCredentials: string[];
  isPopular: boolean;
  capabilities: string[];
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

export const MCPConfiguration: React.FC<MCPConfigurationProps> = ({ onSave }) => {
  const [availableServers, setAvailableServers] = useState<MCPServer[]>([]);
  const [enabledServers, setEnabledServers] = useState<MCPServerStatus[]>([]);
  const [userCredentials, setUserCredentials] = useState<UserCredentials>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const toast = useToast();

  // Load data on mount
  useEffect(() => {
    if (address) {
      loadMCPData();
    }
  }, [address]);

  const loadMCPData = async () => {
    setGlobalLoading(true);
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
  };

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
      cred => !userCredentials[cred] || userCredentials[cred].length === 0
    );

    if (enable && missingCredentials.length > 0) {
      toast({
        title: 'Missing Credentials',
        description: `Please configure credentials for: ${missingCredentials.join(', ')}`,
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
        const data = await response.json();
        setLastHealthCheck(new Date());
        await loadEnabledServers(); // Refresh status
        
        toast({
          title: 'Health Check Complete',
          description: `Checked ${Object.keys(data.healthResults || {}).length} servers`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green';
      case 'error': return 'red';
      case 'disconnected': return 'orange';
      default: return 'gray';
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
      userCredentials[cred] && userCredentials[cred].length > 0
    );
  };

  // Group servers by category
  const serversByCategory = availableServers.reduce((acc, server) => {
    if (!acc[server.category]) {
      acc[server.category] = [];
    }
    acc[server.category].push(server);
    return acc;
  }, {} as Record<string, MCPServer[]>);

  if (!address) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="rgba(255, 255, 255, 0.6)" fontSize="14px">
          Please connect your wallet to manage MCP servers
        </Text>
      </Box>
    );
  }

  if (globalLoading && availableServers.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" color="white" />
        <Text color="rgba(255, 255, 255, 0.6)" fontSize="14px" mt={4}>
          Loading MCP servers...
        </Text>
      </Box>
    );
  }

  const totalEnabledServers = enabledServers.filter(s => s.isEnabled).length;
  const connectedServers = enabledServers.filter(s => s.connectionStatus === 'connected').length;
  const totalAvailableTools = enabledServers.reduce((sum, s) => sum + (s.availableTools || 0), 0);

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text color="white" fontSize="14px" fontWeight="500" mb={2}>
          MCP Server Configuration
        </Text>
        <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
          Enable Model Context Protocol (MCP) servers to extend your agent capabilities with external tools and services.
        </Text>
      </Box>

      {/* Status Overview */}
      <Box
        bg="rgba(255, 255, 255, 0.02)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="8px"
        p={4}
      >
        <HStack justify="space-between" mb={3}>
          <Text color="white" fontSize="13px" fontWeight="500">
            Server Status Overview
          </Text>
          <Button
            leftIcon={globalLoading ? <Spinner size="xs" /> : <RefreshCw size={14} />}
            onClick={handleRunHealthCheck}
            size="xs"
            variant="ghost"
            colorScheme="whiteAlpha"
            fontSize="11px"
            isDisabled={globalLoading || totalEnabledServers === 0}
          >
            Health Check
          </Button>
        </HStack>

        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          <Box textAlign="center">
            <Text color="white" fontSize="18px" fontWeight="bold">
              {totalEnabledServers}
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="11px">
              Enabled
            </Text>
          </Box>
          <Box textAlign="center">
            <Text color="#48BB78" fontSize="18px" fontWeight="bold">
              {connectedServers}
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="11px">
              Connected
            </Text>
          </Box>
          <Box textAlign="center">
            <Text color="#4299E1" fontSize="18px" fontWeight="bold">
              {totalAvailableTools}
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="11px">
              Tools Available
            </Text>
          </Box>
        </Grid>

        {lastHealthCheck && (
          <Text color="rgba(255, 255, 255, 0.5)" fontSize="10px" textAlign="center" mt={2}>
            Last health check: {lastHealthCheck.toLocaleTimeString()}
          </Text>
        )}
      </Box>

      {/* Missing Credentials Alert */}
      {Object.keys(userCredentials).length === 0 && (
        <Alert status="warning" bg="rgba(237, 137, 54, 0.1)" border="1px solid rgba(237, 137, 54, 0.3)">
          <AlertIcon color="orange.400" />
          <Box>
            <AlertTitle fontSize="12px" color="orange.400">No credentials configured!</AlertTitle>
            <AlertDescription fontSize="11px" color="rgba(255, 255, 255, 0.7)">
              Configure your API credentials in the Credentials tab to enable MCP servers.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Server Categories */}
      <VStack spacing={3} align="stretch">
        {Object.entries(serversByCategory).map(([category, servers]) => {
          const isExpanded = expandedCategories[category] ?? true;
          const categoryEnabledCount = servers.filter(s => isServerEnabled(s.name)).length;

          return (
            <Box
              key={category}
              bg="rgba(255, 255, 255, 0.02)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="8px"
              overflow="hidden"
            >
              {/* Category Header */}
              <Flex
                p={3}
                align="center"
                justify="space-between"
                cursor="pointer"
                onClick={() => setExpandedCategories(prev => ({
                  ...prev,
                  [category]: !isExpanded
                }))}
                _hover={{ bg: "rgba(255, 255, 255, 0.02)" }}
              >
                <HStack spacing={3}>
                  <HStack spacing={2}>
                    {isExpanded ? <ChevronDown size={16} color="rgba(255, 255, 255, 0.6)" /> : 
                                 <ChevronRight size={16} color="rgba(255, 255, 255, 0.6)" />}
                    <Text color="white" fontSize="13px" fontWeight="500">
                      {category}
                    </Text>
                  </HStack>
                  <Badge colorScheme={categoryEnabledCount > 0 ? "green" : "gray"} size="sm">
                    {categoryEnabledCount}/{servers.length}
                  </Badge>
                </HStack>
              </Flex>

              {/* Category Servers */}
              <Collapse in={isExpanded}>
                <Box px={3} pb={3}>
                  <Divider borderColor="rgba(255, 255, 255, 0.1)" mb={3} />
                  
                  <VStack spacing={2} align="stretch">
                    {servers.map((server) => {
                      const enabled = isServerEnabled(server.name);
                      const status = getServerStatus(server.name);
                      const hasCredentials = hasRequiredCredentials(server);
                      const isLoading = loading[server.name];

                      return (
                        <Flex
                          key={server.name}
                          p={3}
                          bg="rgba(255, 255, 255, 0.02)"
                          borderRadius="6px"
                          align="center"
                          justify="space-between"
                          border="1px solid rgba(255, 255, 255, 0.05)"
                        >
                          <HStack spacing={3} flex={1}>
                            <Box
                              width="24px"
                              height="24px"
                              borderRadius="4px"
                              bg="rgba(255, 255, 255, 0.1)"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Settings size={12} color="rgba(255, 255, 255, 0.6)" />
                            </Box>
                            
                            <VStack align="start" spacing={0} flex={1}>
                              <HStack spacing={2}>
                                <Text color="white" fontSize="12px" fontWeight="500">
                                  {server.displayName}
                                </Text>
                                {server.isPopular && (
                                  <Badge colorScheme="blue" size="xs">
                                    <Zap size={8} style={{ marginRight: '2px' }} />
                                    Popular
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontSize="10px" color="rgba(255, 255, 255, 0.6)">
                                {server.description}
                              </Text>
                              
                              {/* Status and Tools Info */}
                              {enabled && status && (
                                <HStack spacing={3} mt={1}>
                                  <HStack spacing={1}>
                                    {getStatusIcon(status.connectionStatus)}
                                    <Text fontSize="9px" color={`${getStatusColor(status.connectionStatus)}.400`}>
                                      {status.connectionStatus}
                                    </Text>
                                  </HStack>
                                  {status.availableTools > 0 && (
                                    <Text fontSize="9px" color="rgba(255, 255, 255, 0.5)">
                                      {status.availableTools} tools
                                    </Text>
                                  )}
                                </HStack>
                              )}
                            </VStack>
                          </HStack>

                          <HStack spacing={2}>
                            {!hasCredentials && (
                              <Tooltip
                                label={`Missing credentials: ${server.requiredCredentials.join(', ')}`}
                                placement="top"
                              >
                                <Box>
                                  <AlertCircle size={14} color="#ED8936" />
                                </Box>
                              </Tooltip>
                            )}
                            
                            <Switch
                              size="sm"
                              isChecked={enabled}
                              isDisabled={isLoading || (!enabled && !hasCredentials)}
                              onChange={(e) => handleToggleServer(server.name, e.target.checked)}
                              colorScheme="green"
                            />
                            
                            {isLoading && <Spinner size="xs" color="white" />}
                          </HStack>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </VStack>

      {availableServers.length === 0 && !globalLoading && (
        <Box textAlign="center" py={8}>
          <Text color="rgba(255, 255, 255, 0.6)" fontSize="14px">
            No MCP servers available
          </Text>
        </Box>
      )}
    </VStack>
  );
};