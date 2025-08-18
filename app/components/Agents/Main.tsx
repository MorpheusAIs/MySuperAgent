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
  Bot,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  ExternalLink,
  Play,
  Pause,
  Cpu,
} from 'lucide-react';
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
  documentation?: string;
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
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const toast = useToast();

  const loadAgentData = useCallback(async () => {
    try {
      await Promise.all([
        loadAvailableAgents(),
        loadEnabledAgents(),
        loadUserConfig()
      ]);
    } catch (error) {
      console.error('Failed to load agent data:', error);
      toast({
        title: 'Failed to Load Data',
        description: 'Could not load agent information',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGlobalLoading(false);
    }
  }, [address, toast]);

  const loadAvailableAgents = async () => {
    try {
      const response = await fetch('/api/agents/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load available agents:', error);
    }
  };

  const loadEnabledAgents = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/agents/status?walletAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setEnabledAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load enabled agents:', error);
    }
  };

  const loadUserConfig = async () => {
    if (!address) return;

    try {
      const response = await fetch('/api/agents/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });

      if (response.ok) {
        const data = await response.json();
        setUserConfig(data.config || {});
      }
    } catch (error) {
      console.error('Failed to load user agent config:', error);
    }
  };

  useEffect(() => {
    if (address) {
      loadAgentData();
    } else {
      setGlobalLoading(false);
    }
  }, [address, loadAgentData]);

  const handleToggleAgent = async (agentName: string, enable: boolean) => {
    if (!address) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to manage agents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const agent = availableAgents.find(a => a.name === agentName);
    if (!agent) return;

    setLoading(prev => ({ ...prev, [agentName]: true }));

    try {
      if (enable) {
        // Sign message for agent enablement
        const message = `Enable agent ${agentName} - ${Date.now()}`;
        const signature = await signMessageAsync({ message });

        const response = await fetch('/api/agents/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            agentName,
            signature
          })
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
            walletAddress: address,
            agentName
          })
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
        description: `Could not ${enable ? 'enable' : 'disable'} ${agent.displayName}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(prev => ({ ...prev, [agentName]: false }));
    }
  };

  const handleRefreshAgents = async () => {
    if (!address) return;

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
    return enabledAgents.some(a => a.agentName === agentName && a.isEnabled);
  };

  const getAgentStatus = (agentName: string) => {
    return enabledAgents.find(a => a.agentName === agentName);
  };

  // Filter and search logic
  const categories = ['all', ...new Set(availableAgents.map(a => a.category))];
  
  const filteredAgents = availableAgents.filter(agent => {
    const matchesSearch = agent.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    
    const matchesEnabledFilter = !showOnlyEnabled || isAgentEnabled(agent.name);
    
    return matchesSearch && matchesCategory && matchesEnabledFilter;
  });

  // Statistics
  const totalEnabledAgents = enabledAgents.filter(a => a.isEnabled).length;
  const activeAgents = enabledAgents.filter(a => a.status === 'active').length;
  const totalTasksCompleted = enabledAgents.reduce((sum, a) => sum + (a.tasksCompleted || 0), 0);

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
            <Bot size={64} color="rgba(255, 255, 255, 0.3)" />
            <VStack spacing={3}>
              <Text className={styles.emptyTitle}>Connect Your Wallet</Text>
              <Text className={styles.emptySubtitle}>
                Please connect your wallet to access and manage your AI agents
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
              <Text className={styles.title}>Agents</Text>
              <Text className={styles.subtitle}>
                Manage your AI agents and configure their capabilities for automated tasks
              </Text>
            </VStack>
            <Button
              leftIcon={globalLoading ? <Spinner size="sm" /> : <RefreshCw size={16} />}
              onClick={handleRefreshAgents}
              isDisabled={globalLoading}
              className={styles.actionButton}
              size="lg"
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
            <Text className={styles.statHelper}>of {availableAgents.length} available</Text>
          </Box>
          
          <Box className={styles.statCard}>
            <Text className={styles.statLabel}>Active Now</Text>
            <Text className={styles.statNumber} color="#48BB78">{activeAgents}</Text>
            <Text className={styles.statHelper}>ready for tasks</Text>
          </Box>
          
          <Box className={styles.statCard}>
            <Text className={styles.statLabel}>Tasks Completed</Text>
            <Text className={styles.statNumber} color="#4299E1">{totalTasksCompleted}</Text>
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
                  <VStack spacing={4} align="stretch">
                    {/* Header */}
                    <Flex justify="space-between" align="start">
                      <HStack spacing={3}>
                        <Box className={styles.agentIcon}>
                          <Bot size={20} color="rgba(255, 255, 255, 0.6)" />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <HStack spacing={2}>
                            <Text className={styles.agentName}>
                              {agent.displayName}
                            </Text>
                            {agent.isPopular && (
                              <Badge colorScheme="purple" size="sm">
                                <Cpu size={8} style={{ marginRight: '2px' }} />
                                Popular
                              </Badge>
                            )}
                            {agent.isBuiltIn && (
                              <Badge colorScheme="blue" size="sm">
                                Built-in
                              </Badge>
                            )}
                          </HStack>
                          <Badge colorScheme="gray" size="xs">
                            {agent.category}
                          </Badge>
                        </VStack>
                      </HStack>

                      <Switch
                        size="md"
                        isChecked={enabled}
                        isDisabled={isLoading}
                        onChange={(e) => handleToggleAgent(agent.name, e.target.checked)}
                        colorScheme="green"
                      />
                    </Flex>

                    {/* Description */}
                    <Text className={styles.agentDescription}>
                      {agent.description}
                    </Text>

                    {/* Status */}
                    {enabled && status && (
                      <HStack spacing={4}>
                        <HStack spacing={1}>
                          {getStatusIcon(status.status)}
                          <Text fontSize="xs" className={styles.statusText} data-status={status.status}>
                            {status.status}
                          </Text>
                        </HStack>
                        {status.tasksCompleted > 0 && (
                          <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)">
                            {status.tasksCompleted} tasks
                          </Text>
                        )}
                        {status.lastUsed && (
                          <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)">
                            Last used: {new Date(status.lastUsed).toLocaleDateString()}
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
                        {agent.capabilities.slice(0, 3).map((capability, index) => (
                          <Badge key={index} size="xs" colorScheme="teal">
                            {capability}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge size="xs" colorScheme="gray">
                            +{agent.capabilities.length - 3} more
                          </Badge>
                        )}
                      </Flex>
                    </Box>

                    {/* Version */}
                    <HStack spacing={2}>
                      <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)">
                        Version:
                      </Text>
                      <Badge size="xs" colorScheme="green">
                        {agent.version}
                      </Badge>
                    </HStack>

                    {/* Actions */}
                    {agent.documentation && (
                      <Button
                        as="a"
                        href={agent.documentation}
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