import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useWalletAddress } from '@/services/wallet/utils';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Switch,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Settings,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface MCPConfigurationProps {
  onSave?: () => void;
}

interface MCPServer {
  name: string;
  displayName: string;
  description: string;
  requiredCredentials: string[];
  isPopular: boolean;
}

interface MCPServerStatus {
  serverName: string;
  isEnabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'unknown';
  availableTools: number;
}

interface UserCredentials {
  [serviceName: string]: string[];
}

export const MCPConfiguration: React.FC<MCPConfigurationProps> = ({
  onSave,
}) => {
  const [availableServers, setAvailableServers] = useState<MCPServer[]>([]);
  const [enabledServers, setEnabledServers] = useState<MCPServerStatus[]>([]);
  const [userCredentials, setUserCredentials] = useState<UserCredentials>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);

  const { address } = useAccount();
  const { isAuthenticated, loginWithGoogle, loginWithX, loginWithWallet } =
    usePrivyAuth();
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  // Load data on mount
  useEffect(() => {
    const userAddress = getAddress();
    if (isAuthenticated && userAddress) {
      loadMCPData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadAvailableServers = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableServers(data.servers || []);
      }
    } catch (error) {
      console.error('Failed to load available MCP servers:', error);
    }
  }, []);

  const loadEnabledServers = useCallback(async () => {
    const userAddress = getAddress();
    if (!userAddress) return;

    try {
      const response = await fetch(
        `/api/mcp/servers/status?walletAddress=${userAddress}`
      );
      if (response.ok) {
        const data = await response.json();
        setEnabledServers(data.servers || []);
      }
    } catch (error) {
      console.error('Failed to load enabled MCP servers:', error);
    }
  }, [getAddress]);

  const loadUserCredentials = useCallback(async () => {
    const userAddress = getAddress();
    if (!userAddress) return;

    try {
      const response = await fetch('/api/credentials/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: userAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserCredentials(data.services || {});
      }
    } catch (error) {
      console.error('Failed to load user credentials:', error);
    }
  }, [getAddress]);

  const loadMCPData = useCallback(async () => {
    setGlobalLoading(true);
    try {
      await Promise.all([
        loadAvailableServers(),
        loadEnabledServers(),
        loadUserCredentials(),
      ]);
    } catch (error) {
      console.error('Failed to load MCP data:', error);
    } finally {
      setGlobalLoading(false);
    }
  }, [loadAvailableServers, loadEnabledServers, loadUserCredentials]);

  const handleToggleServer = async (serverName: string, enable: boolean) => {
    const userAddress = getAddress();
    if (!userAddress) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to manage MCP servers',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const server = availableServers.find((s) => s.name === serverName);
    if (!server) return;

    // Check if user has required credentials
    const missingCredentials = server.requiredCredentials.filter(
      (cred) => !userCredentials[cred] || userCredentials[cred].length === 0
    );

    if (enable && missingCredentials.length > 0) {
      toast({
        title: 'Missing Credentials',
        description: `Please configure credentials in the Credentials tab for: ${missingCredentials.join(
          ', '
        )}`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading((prev) => ({ ...prev, [serverName]: true }));

    try {
      const endpoint = enable
        ? '/api/mcp/servers/enable'
        : '/api/mcp/servers/disable';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: userAddress,
          serverName,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${enable ? 'enable' : 'disable'} MCP server`
        );
      }

      toast({
        title: enable ? 'Server Enabled' : 'Server Disabled',
        description: `${server.displayName} has been ${
          enable ? 'enabled' : 'disabled'
        }`,
        status: enable ? 'success' : 'info',
        duration: 3000,
        isClosable: true,
      });

      await loadEnabledServers();
    } catch (error) {
      console.error(`Failed to toggle MCP server:`, error);
      toast({
        title: 'Operation Failed',
        description: `Could not ${enable ? 'enable' : 'disable'} ${
          server.displayName
        }`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading((prev) => ({ ...prev, [serverName]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={14} color="#48BB78" />;
      case 'error':
        return <XCircle size={14} color="#F56565" />;
      case 'disconnected':
        return <AlertCircle size={14} color="#ED8936" />;
      default:
        return <AlertCircle size={14} color="#A0AEC0" />;
    }
  };

  const isServerEnabled = (serverName: string) => {
    return enabledServers.some(
      (s) => s.serverName === serverName && s.isEnabled
    );
  };

  const getServerStatus = (serverName: string) => {
    return enabledServers.find((s) => s.serverName === serverName);
  };

  const hasRequiredCredentials = (server: MCPServer) => {
    return server.requiredCredentials.every(
      (cred) => userCredentials[cred] && userCredentials[cred].length > 0
    );
  };

  if (!isAuthenticated) {
    return (
      <VStack spacing={6} align="center" py={8}>
        <Text
          color="rgba(255, 255, 255, 0.6)"
          fontSize="16px"
          textAlign="center"
        >
          Sign in to manage MCP servers
        </Text>
        <Text
          color="rgba(255, 255, 255, 0.4)"
          fontSize="14px"
          textAlign="center"
          maxW="400px"
        >
          MCP (Model Context Protocol) allows you to connect external tools and
          services to your AI agents
        </Text>
        <VStack spacing={3} pt={4}>
          <Button
            onClick={loginWithGoogle}
            bg="#59F886"
            color="#000"
            _hover={{ bg: '#4AE066' }}
            size="lg"
            width="200px"
          >
            Sign in with Google
          </Button>
          <Button
            onClick={loginWithX}
            bg="rgba(89, 248, 134, 0.2)"
            color="#59F886"
            border="1px solid #59F886"
            _hover={{ bg: 'rgba(89, 248, 134, 0.3)' }}
            size="lg"
            width="200px"
          >
            Sign in with X
          </Button>
          <Button
            onClick={loginWithWallet}
            bg="rgba(89, 248, 134, 0.2)"
            color="#59F886"
            border="1px solid #59F886"
            _hover={{ bg: 'rgba(89, 248, 134, 0.3)' }}
            size="lg"
            width="200px"
          >
            Sign in with Wallet
          </Button>
        </VStack>
      </VStack>
    );
  }

  if (globalLoading && availableServers.length === 0) {
    return (
      <VStack spacing={4} align="center" py={8}>
        <Spinner size="lg" color="blue.400" />
        <Text color="rgba(255, 255, 255, 0.6)" fontSize="16px">
          Loading MCP servers...
        </Text>
      </VStack>
    );
  }

  const totalEnabledServers = enabledServers.filter((s) => s.isEnabled).length;
  const totalAvailableTools = enabledServers.reduce(
    (sum, s) => sum + (s.availableTools || 0),
    0
  );

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <Text color="white" fontSize="18px" fontWeight="600" mb={2}>
          MCP Server Configuration
        </Text>
        <Text fontSize="14px" color="rgba(255, 255, 255, 0.7)">
          Connect external tools and services using the Model Context Protocol
          (MCP).
        </Text>
      </Box>

      {/* Quick Stats */}
      {totalEnabledServers > 0 && (
        <HStack
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          borderRadius="12px"
          p={4}
          justify="space-around"
        >
          <VStack spacing={1}>
            <Text color="white" fontSize="24px" fontWeight="bold">
              {totalEnabledServers}
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="12px">
              Enabled Servers
            </Text>
          </VStack>
          <VStack spacing={1}>
            <Text color="#4299E1" fontSize="24px" fontWeight="bold">
              {totalAvailableTools}
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="12px">
              Available Tools
            </Text>
          </VStack>
        </HStack>
      )}

      {/* Credentials Warning */}
      {Object.keys(userCredentials).length === 0 && (
        <Alert
          status="warning"
          bg="rgba(237, 137, 54, 0.1)"
          border="1px solid rgba(237, 137, 54, 0.3)"
          borderRadius="8px"
        >
          <AlertIcon color="orange.400" />
          <Box>
            <AlertTitle fontSize="14px" color="orange.400">
              No API credentials found
            </AlertTitle>
            <AlertDescription fontSize="13px" color="rgba(255, 255, 255, 0.8)">
              Configure your API credentials in the Credentials tab to enable
              MCP servers.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Server List */}
      <VStack spacing={3} align="stretch">
        {availableServers.map((server) => {
          const enabled = isServerEnabled(server.name);
          const status = getServerStatus(server.name);
          const hasCredentials = hasRequiredCredentials(server);
          const isLoading = loading[server.name];

          return (
            <Box
              key={server.name}
              bg="rgba(255, 255, 255, 0.02)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="12px"
              p={4}
              _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
              transition="all 0.2s ease"
            >
              <Flex align="center" justify="space-between">
                <HStack spacing={3} flex={1}>
                  <Box
                    width="32px"
                    height="32px"
                    borderRadius="8px"
                    bg="rgba(66, 153, 225, 0.2)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Settings size={16} color="#4299E1" />
                  </Box>

                  <VStack align="start" spacing={1} flex={1}>
                    <HStack spacing={2}>
                      <Text color="white" fontSize="16px" fontWeight="500">
                        {server.displayName}
                      </Text>
                      {server.isPopular && (
                        <Badge colorScheme="blue" size="sm">
                          Popular
                        </Badge>
                      )}
                    </HStack>

                    <Text fontSize="14px" color="rgba(255, 255, 255, 0.7)">
                      {server.description}
                    </Text>

                    {/* Server Status */}
                    {enabled && status && (
                      <HStack spacing={3} mt={1}>
                        <HStack spacing={1}>
                          {getStatusIcon(status.connectionStatus)}
                          <Text
                            fontSize="12px"
                            color="rgba(255, 255, 255, 0.6)"
                            textTransform="capitalize"
                          >
                            {status.connectionStatus}
                          </Text>
                        </HStack>
                        {status.availableTools > 0 && (
                          <Text
                            fontSize="12px"
                            color="rgba(255, 255, 255, 0.6)"
                          >
                            {status.availableTools} tools available
                          </Text>
                        )}
                      </HStack>
                    )}

                    {/* Missing Credentials Warning */}
                    {!hasCredentials && (
                      <Text fontSize="12px" color="orange.400">
                        Missing credentials:{' '}
                        {server.requiredCredentials.join(', ')}
                      </Text>
                    )}
                  </VStack>
                </HStack>

                <HStack spacing={3}>
                  {isLoading && <Spinner size="sm" color="blue.400" />}

                  <Switch
                    size="md"
                    isChecked={enabled}
                    isDisabled={isLoading || (!enabled && !hasCredentials)}
                    onChange={(e) =>
                      handleToggleServer(server.name, e.target.checked)
                    }
                    colorScheme="blue"
                  />
                </HStack>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      {availableServers.length === 0 && !globalLoading && (
        <VStack spacing={4} align="center" py={8}>
          <Text color="rgba(255, 255, 255, 0.6)" fontSize="16px">
            No MCP servers available
          </Text>
          <Button
            leftIcon={<RefreshCw size={16} />}
            onClick={loadMCPData}
            size="sm"
            variant="outline"
            colorScheme="blue"
          >
            Refresh
          </Button>
        </VStack>
      )}
    </VStack>
  );
};
