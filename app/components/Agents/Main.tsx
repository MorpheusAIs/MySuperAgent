import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useWalletAddress } from '@/services/wallet/utils';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  Cpu,
  ExternalLink,
  RefreshCw,
  Search,
  Settings,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import styles from './Main.module.css';

interface Agent {
  name: string;
  displayName: string;
  description: string;
  category: string;
  capabilities: string[];
  isPopular: boolean;
  version: string;
  isBuiltIn: boolean;
  documentationUrl?: string;
}

interface AgentStatus {
  agentName: string;
  isEnabled: boolean;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  lastUsed: string | null;
  tasksCompleted: number;
  configuration?: any;
}

interface UserAgentConfig {
  [agentName: string]: any;
}

export const AgentsMain: React.FC<{ isSidebarOpen?: boolean }> = ({
  isSidebarOpen = false,
}) => {
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [enabledAgents, setEnabledAgents] = useState<AgentStatus[]>([]);
  const [userConfig, setUserConfig] = useState<UserAgentConfig>({});
  const [defaultsInitialized, setDefaultsInitialized] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { isAuthenticated, loginWithGoogle, loginWithX, loginWithWallet } =
    usePrivyAuth();
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  const loadUserAgentData = useCallback(async () => {
    const userAddress = getAddress();
    if (!userAddress) return;

    try {
      await Promise.all([loadEnabledAgents(), loadUserConfig()]);
    } catch (error) {
      console.error('Failed to load user agent data:', error);
      toast({
        title: 'Failed to Load User Data',
        description: 'Could not load your agent status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [getAddress, toast]);

  const loadAvailableAgents = async () => {
    try {
      const response = await fetch('/api/agents/available');
      if (response.ok) {
        const data = await response.json();
        const agents = data.agents || [];
        setAvailableAgents(agents);

        // Initialize default enabled agents (popular ones) if not already initialized
        if (!defaultsInitialized && agents.length > 0) {
          const defaultEnabled = agents
            .filter((agent: Agent) => agent.isPopular)
            .map((agent: Agent) => ({
              agentName: agent.name,
              isEnabled: true,
              status: 'active' as const,
              lastUsed: null,
              tasksCompleted: 0,
            }));
          setEnabledAgents((prev) => {
            // Merge with any existing enabled agents
            const existingNames = prev.map((a) => a.agentName);
            const newAgents = defaultEnabled.filter(
              (a: AgentStatus) => !existingNames.includes(a.agentName)
            );
            return [...prev, ...newAgents];
          });
          setDefaultsInitialized(true);
        }
      }
    } catch (error) {
      console.error('Failed to load available agents:', error);
    }
  };

  const loadEnabledAgents = async () => {
    const userAddress = getAddress();
    if (!userAddress) return;

    try {
      const response = await fetch(
        `/api/agents/status?walletAddress=${userAddress}`
      );
      if (response.ok) {
        const data = await response.json();
        setEnabledAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load enabled agents:', error);
    }
  };

  const loadUserConfig = async () => {
    const userAddress = getAddress();
    if (!userAddress) return;

    try {
      const response = await fetch('/api/agents/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: userAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserConfig(data.config || {});
      }
    } catch (error) {
      console.error('Failed to load user agent config:', error);
    }
  };

  // Load available agents immediately (no auth needed)
  useEffect(() => {
    loadAvailableAgents().finally(() => {
      setGlobalLoading(false);
    });
  }, []);

  // Load user-specific data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserAgentData();
    } else {
      // Clear user data when not authenticated
      setEnabledAgents([]);
      setUserConfig({});
    }
  }, [isAuthenticated, loadUserAgentData]);

  const handleToggleAgent = async (agentName: string, enable: boolean) => {
    const userAddress = getAddress();
    if (!userAddress) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to manage agents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const agent = availableAgents.find((a) => a.name === agentName);
    if (!agent) return;

    setLoading((prev) => ({ ...prev, [agentName]: true }));

    try {
      if (enable) {
        // Sign message for agent enablement
        const message = `Enable agent ${agentName} - ${Date.now()}`;
        const signature = await signMessageAsync({ message });

        const response = await fetch('/api/agents/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: userAddress,
            agentName,
            signature,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to enable agent');
        }

        toast({
          title: 'Agent Enabled',
          description: `${agent.displayName} has been enabled and is ready to use`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await fetch('/api/agents/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: userAddress,
            agentName,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to disable agent');
        }

        toast({
          title: 'Agent Disabled',
          description: `${agent.displayName} has been disabled`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

      await loadEnabledAgents();
    } catch (error) {
      console.error('Failed to toggle agent:', error);
      toast({
        title: 'Operation Failed',
        description: `Could not ${enable ? 'enable' : 'disable'} ${
          agent.displayName
        }`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading((prev) => ({ ...prev, [agentName]: false }));
    }
  };

  const handleRefreshAgents = async () => {
    const userAddress = getAddress();
    if (!userAddress) return;

    setGlobalLoading(true);
    try {
      await loadEnabledAgents();
      toast({
        title: 'Agents Refreshed',
        description: 'Agent status has been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to refresh agents:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh agent status',
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
      case 'active':
        return <CheckCircle size={16} color="#48BB78" />;
      case 'error':
        return <XCircle size={16} color="#F56565" />;
      case 'inactive':
        return <AlertCircle size={16} color="#ED8936" />;
      case 'configuring':
        return <Settings size={16} color="#4299E1" />;
      default:
        return <AlertCircle size={16} color="#A0AEC0" />;
    }
  };

  const isAgentEnabled = (agentName: string) => {
    return enabledAgents.some((a) => a.agentName === agentName && a.isEnabled);
  };

  const getAgentStatus = (agentName: string) => {
    return enabledAgents.find((a) => a.agentName === agentName);
  };

  // Filter and search logic
  const categories = [
    'all',
    ...Array.from(new Set(availableAgents.map((a) => a.category))),
  ];

  const filteredAgents = availableAgents.filter((agent) => {
    const matchesSearch =
      agent.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.capabilities.some((cap) =>
        cap.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'all' || agent.category === selectedCategory;

    const matchesEnabledFilter = !showOnlyEnabled || isAgentEnabled(agent.name);

    return matchesSearch && matchesCategory && matchesEnabledFilter;
  });

  // Statistics
  const totalEnabledAgents = enabledAgents.filter((a) => a.isEnabled).length;
  const activeAgents = enabledAgents.filter(
    (a) => a.status === 'active'
  ).length;
  const totalTasksCompleted = enabledAgents.reduce(
    (sum, a) => sum + (a.tasksCompleted || 0),
    0
  );

  // Show loading only if we don't have basic agent data yet
  if (globalLoading && availableAgents.length === 0) {
    return (
      <Box className={styles.container}>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color="white" />
        </Flex>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box className={styles.container}>
        <Box className={styles.emptyState}>
          <VStack spacing={6}>
            <Bot size={64} color="rgba(255, 255, 255, 0.3)" />
            <VStack spacing={3}>
              <Text className={styles.emptyTitle}>Sign In Required</Text>
              <Text className={styles.emptySubtitle}>
                Please sign in to access and manage your AI agents
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
              <Text className={styles.title}>Agents</Text>
              <Text className={styles.subtitle}>
                Manage your AI agents and configure their capabilities for
                automated tasks
              </Text>
            </VStack>
            <Button
              leftIcon={
                globalLoading ? <Spinner size="sm" /> : <RefreshCw size={16} />
              }
              onClick={handleRefreshAgents}
              isDisabled={globalLoading}
              className={styles.actionButton}
              size="lg"
              _hover={{ transform: 'translateY(-1px)' }}
            >
              Refresh Status
            </Button>
          </HStack>
          <Divider borderColor="rgba(255, 255, 255, 0.1)" />
        </VStack>
      </Box>

      {/* Statistics */}
      <Box className={styles.statsContainer}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box className={styles.statCard}>
            <Text className={styles.statLabel}>Enabled Agents</Text>
            <Text className={styles.statNumber}>{totalEnabledAgents}</Text>
            <Text className={styles.statHelper}>
              of {availableAgents.length} available
            </Text>
          </Box>

          <Box className={styles.statCard}>
            <Text className={styles.statLabel}>Active Now</Text>
            <Text className={styles.statNumber} color="#00ff41">
              {activeAgents}
            </Text>
            <Text className={styles.statHelper}>ready for tasks</Text>
          </Box>

          <Box className={styles.statCard}>
            <Text className={styles.statLabel}>Tasks Completed</Text>
            <Text className={styles.statNumber} color="#00d435">
              {totalTasksCompleted}
            </Text>
            <Text className={styles.statHelper}>total executions</Text>
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
              placeholder="Search agents..."
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
            {categories.map((category) => (
              <option
                key={category}
                value={category}
                style={{ background: '#1A202C' }}
              >
                {category === 'all'
                  ? 'All Categories'
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </Select>

          <HStack>
            <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
              Enabled only
            </Text>
            <Switch
              isChecked={showOnlyEnabled}
              onChange={(e) => setShowOnlyEnabled(e.target.checked)}
              colorScheme="green"
            />
          </HStack>
        </HStack>
      </Box>

      {/* Agents Grid */}
      <Box className={styles.content}>
        {filteredAgents.length === 0 ? (
          <Box className={styles.emptyState}>
            <VStack spacing={6}>
              <Search size={48} color="rgba(255, 255, 255, 0.3)" />
              <VStack spacing={3}>
                <Text className={styles.emptyTitle}>No agents found</Text>
                <Text className={styles.emptySubtitle}>
                  No agents match your current search criteria
                </Text>
              </VStack>
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredAgents.map((agent) => {
              const enabled = isAgentEnabled(agent.name);
              const status = getAgentStatus(agent.name);
              const isLoading = loading[agent.name];

              return (
                <Box key={agent.name} className={styles.agentCard}>
                  <VStack spacing={3} align="stretch">
                    {/* Simplified header with smaller icon */}
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Box className={styles.agentIcon}>
                          <Bot size={16} color="rgba(255, 255, 255, 0.6)" />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <HStack spacing={2}>
                            <Text className={styles.agentName}>
                              {agent.displayName}
                            </Text>
                            {agent.isPopular && (
                              <Badge
                                size="xs"
                                bg="rgba(0, 255, 65, 0.1)"
                                color="#00ff41"
                                borderColor="#00ff41"
                                borderWidth="1px"
                              >
                                Popular
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)">
                            {agent.category}
                          </Text>
                        </VStack>
                      </HStack>
                      <Switch
                        size="sm"
                        isChecked={enabled}
                        isDisabled={isLoading}
                        onChange={(e) =>
                          handleToggleAgent(agent.name, e.target.checked)
                        }
                        colorScheme="green"
                      />
                    </Flex>

                    {/* Truncated description */}
                    <Text className={styles.agentDescription} noOfLines={2}>
                      {agent.description}
                    </Text>

                    {/* Capabilities - shown in tooltip */}
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <Tooltip
                        label={
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="bold">
                              Capabilities:
                            </Text>
                            {agent.capabilities.map((capability, index) => (
                              <Text key={index} fontSize="xs">
                                • {capability}
                              </Text>
                            ))}
                          </VStack>
                        }
                        placement="top"
                        hasArrow
                        bg="gray.800"
                        color="white"
                      >
                        <HStack spacing={1}>
                          <Cpu size={12} color="#00ff41" />
                          <Text fontSize="xs" color="#00ff41">
                            {agent.capabilities.length} capabilities
                          </Text>
                        </HStack>
                      </Tooltip>
                    )}

                    {/* Version & Status */}
                    <HStack justify="space-between" align="center">
                      <HStack spacing={3}>
                        {enabled && status && (
                          <HStack spacing={1}>
                            {getStatusIcon(status.status)}
                            <Text
                              fontSize="xs"
                              className={styles.statusText}
                              data-status={status.status}
                            >
                              {status.status}
                            </Text>
                          </HStack>
                        )}
                        {!enabled && (
                          <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)">
                            Ready to enable
                          </Text>
                        )}
                        <Badge size="xs" colorScheme="gray">
                          v{agent.version}
                        </Badge>
                      </HStack>

                      {agent.documentationUrl && (
                        <Button
                          as="a"
                          href={agent.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="xs"
                          variant="ghost"
                          className={styles.docButton}
                          p={1}
                          _hover={{
                            bg: 'rgba(0, 255, 65, 0.1)',
                            borderColor: '#00ff41',
                          }}
                        >
                          <ExternalLink size={12} />
                        </Button>
                      )}
                    </HStack>

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
