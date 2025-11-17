import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useWalletAddress } from '@/services/wallet/utils';
import {
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface A2AManagementProps {
  onSave?: () => void;
}

interface A2AAgentCard {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoint: string;
  version: string;
  owner: string;
  metadata?: Record<string, any>;
}

interface A2AAgentStatus {
  agentId: string;
  agentName: string;
  isEnabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'unknown';
  lastPing: Date | null;
  capabilities: string[];
  endpoint: string;
}

interface DiscoveryResult {
  agents: A2AAgentCard[];
  total: number;
}

export const A2AManagement: React.FC<A2AManagementProps> = ({ onSave }) => {
  const [connectedAgents, setConnectedAgents] = useState<A2AAgentStatus[]>([]);
  const [discoveredAgents, setDiscoveredAgents] = useState<A2AAgentCard[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    connected: true,
    discovery: false,
  });
  const [selectedAgent, setSelectedAgent] = useState<A2AAgentStatus | null>(
    null
  );

  const { address } = useAccount();
  const { isAuthenticated, loginWithGoogle, loginWithX, loginWithWallet } =
    usePrivyAuth();
  const { getAddress } = useWalletAddress();
  const toast = useToast();
  const {
    isOpen: isMessageModalOpen,
    onOpen: onMessageModalOpen,
    onClose: onMessageModalClose,
  } = useDisclosure();
  const {
    isOpen: isDiscoveryModalOpen,
    onOpen: onDiscoveryModalOpen,
    onClose: onDiscoveryModalClose,
  } = useDisclosure();

  // Message sending state
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'json'>('text');
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadConnectedAgents = useCallback(async () => {
    const userAddress = getAddress();
    if (!userAddress) return;

    setGlobalLoading(true);
    try {
      const response = await fetch(`/api/a2a/agents/${userAddress}`);
      if (response.ok) {
        const data = await response.json();
        setConnectedAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load connected A2A agents:', error);
      toast({
        title: 'Failed to Load Agents',
        description: 'Could not load connected A2A agents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGlobalLoading(false);
    }
  }, [getAddress, toast]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConnectedAgents();
    }
  }, [isAuthenticated, loadConnectedAgents]);

  const handleDiscoverAgents = async () => {
    const userAddress = getAddress();
    if (!userAddress || !discoveryUrl.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid server URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading((prev) => ({ ...prev, discovery: true }));
    try {
      const response = await fetch(
        `/api/a2a/discover?walletAddress=${userAddress}&serverUrl=${encodeURIComponent(
          discoveryUrl
        )}`
      );

      if (response.ok) {
        const data = await response.json();
        setDiscoveredAgents(data.agents || []);
        setExpandedSections((prev) => ({ ...prev, discovery: true }));

        toast({
          title: 'Discovery Complete',
          description: `Found ${data.total || 0} agents on the network`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Discovery failed');
      }
    } catch (error) {
      console.error('Failed to discover A2A agents:', error);
      toast({
        title: 'Discovery Failed',
        description: 'Could not discover agents at the specified URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading((prev) => ({ ...prev, discovery: false }));
    }
  };

  const handleConnectAgent = async (agentCard: A2AAgentCard) => {
    const userAddress = getAddress();
    if (!userAddress) return;

    setLoading((prev) => ({ ...prev, [agentCard.id]: true }));
    try {
      const response = await fetch('/api/a2a/agents/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: userAddress,
          agentCard,
          endpoint: agentCard.endpoint,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Agent Connected',
          description: `Successfully connected to ${agentCard.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        await loadConnectedAgents();
        // Remove from discovered agents
        setDiscoveredAgents((prev) =>
          prev.filter((a) => a.id !== agentCard.id)
        );
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Failed to connect A2A agent:', error);
      toast({
        title: 'Connection Failed',
        description: `Could not connect to ${agentCard.name}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading((prev) => ({ ...prev, [agentCard.id]: false }));
    }
  };

  const handleDisconnectAgent = async (agentId: string) => {
    const userAddress = getAddress();
    if (!userAddress) return;

    if (!confirm('Are you sure you want to disconnect from this agent?')) {
      return;
    }

    setLoading((prev) => ({ ...prev, [agentId]: true }));
    try {
      const response = await fetch('/api/a2a/agents/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: userAddress,
          agentId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Agent Disconnected',
          description: 'Successfully disconnected from agent',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        await loadConnectedAgents();
      } else {
        throw new Error('Disconnection failed');
      }
    } catch (error) {
      console.error('Failed to disconnect A2A agent:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Could not disconnect from agent',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const handleToggleAgent = async (agentId: string, enabled: boolean) => {
    const userAddress = getAddress();
    if (!userAddress) return;

    setLoading((prev) => ({ ...prev, [`toggle_${agentId}`]: true }));
    try {
      const response = await fetch('/api/a2a/agents/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: userAddress,
          agentId,
          enabled,
        }),
      });

      if (response.ok) {
        toast({
          title: `Agent ${enabled ? 'Enabled' : 'Disabled'}`,
          description: `Agent has been ${enabled ? 'enabled' : 'disabled'}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        await loadConnectedAgents();
      } else {
        throw new Error('Toggle failed');
      }
    } catch (error) {
      console.error('Failed to toggle A2A agent:', error);
      toast({
        title: 'Toggle Failed',
        description: 'Could not change agent status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading((prev) => ({ ...prev, [`toggle_${agentId}`]: false }));
    }
  };

  const handleSendMessage = async () => {
    const userAddress = getAddress();
    if (!userAddress || !selectedAgent || !messageContent.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/a2a/communication/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: userAddress,
          targetAgentId: selectedAgent.agentId,
          message: {
            content: messageContent,
            type: messageType,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Message Sent',
          description: `Message sent to ${selectedAgent.agentName}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        setMessageContent('');
        onMessageModalClose();
      } else {
        throw new Error('Message sending failed');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Message Failed',
        description: 'Could not send message to agent',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRunHealthCheck = async () => {
    const userAddress = getAddress();
    if (!userAddress) return;

    setGlobalLoading(true);
    try {
      const response = await fetch('/api/a2a/health/check-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: userAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadConnectedAgents();

        toast({
          title: 'Health Check Complete',
          description: `Checked ${data.summary?.total || 0} agents`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Failed to run health check:', error);
      toast({
        title: 'Health Check Failed',
        description: 'Could not check agent health',
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
      case 'connected':
        return 'green';
      case 'error':
        return 'red';
      case 'disconnected':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (!isAuthenticated) {
    return (
      <VStack spacing={6} align="center" py={8}>
        <Text
          color="rgba(255, 255, 255, 0.6)"
          fontSize="16px"
          textAlign="center"
        >
          Sign in to manage A2A agents
        </Text>
        <Text
          color="rgba(255, 255, 255, 0.4)"
          fontSize="14px"
          textAlign="center"
          maxW="400px"
        >
          A2A (Agent-to-Agent) allows you to connect and collaborate with
          external AI agents
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

  const connectedCount = connectedAgents.filter(
    (a) => a.connectionStatus === 'connected'
  ).length;
  const enabledCount = connectedAgents.filter((a) => a.isEnabled).length;

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text color="white" fontSize="14px" fontWeight="500" mb={2}>
          A2A Agent Management
        </Text>
        <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
          Connect to external agents using the Agent-to-Agent (A2A) protocol for
          distributed task execution and communication.
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
            Agent Status Overview
          </Text>
          <Button
            leftIcon={
              globalLoading ? <Spinner size="xs" /> : <RefreshCw size={14} />
            }
            onClick={handleRunHealthCheck}
            size="xs"
            variant="ghost"
            colorScheme="whiteAlpha"
            fontSize="11px"
            isDisabled={globalLoading || connectedAgents.length === 0}
          >
            Health Check
          </Button>
        </HStack>

        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          <Box textAlign="center">
            <Text color="white" fontSize="18px" fontWeight="bold">
              {connectedAgents.length}
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="11px">
              Total Agents
            </Text>
          </Box>
          <Box textAlign="center">
            <Text color="#48BB78" fontSize="18px" fontWeight="bold">
              {connectedCount}
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="11px">
              Connected
            </Text>
          </Box>
          <Box textAlign="center">
            <Text color="#4299E1" fontSize="18px" fontWeight="bold">
              {enabledCount}
            </Text>
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="11px">
              Enabled
            </Text>
          </Box>
        </Grid>
      </Box>

      {/* Agent Discovery */}
      <Box
        bg="rgba(255, 255, 255, 0.02)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="8px"
        overflow="hidden"
      >
        <Flex
          p={3}
          align="center"
          justify="space-between"
          cursor="pointer"
          onClick={() =>
            setExpandedSections((prev) => ({
              ...prev,
              discovery: !prev.discovery,
            }))
          }
          _hover={{ bg: 'rgba(255, 255, 255, 0.02)' }}
        >
          <HStack spacing={3}>
            {expandedSections.discovery ? (
              <ChevronDown size={16} color="rgba(255, 255, 255, 0.6)" />
            ) : (
              <ChevronRight size={16} color="rgba(255, 255, 255, 0.6)" />
            )}
            <Search size={16} color="rgba(255, 255, 255, 0.6)" />
            <Text color="white" fontSize="13px" fontWeight="500">
              Discover New Agents
            </Text>
          </HStack>
          <Badge colorScheme="blue" size="sm">
            {discoveredAgents.length} found
          </Badge>
        </Flex>

        <Collapse in={expandedSections.discovery}>
          <Box px={3} pb={3}>
            <Divider borderColor="rgba(255, 255, 255, 0.1)" mb={3} />

            <VStack spacing={3} align="stretch">
              <HStack spacing={2}>
                <Input
                  placeholder="Enter A2A server URL (e.g., https://agents.example.com)"
                  value={discoveryUrl}
                  onChange={(e) => setDiscoveryUrl(e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  fontSize="12px"
                  _focus={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: 'none',
                  }}
                />
                <Button
                  leftIcon={
                    loading.discovery ? (
                      <Spinner size="xs" />
                    ) : (
                      <Search size={14} />
                    )
                  }
                  onClick={handleDiscoverAgents}
                  isDisabled={loading.discovery || !discoveryUrl.trim()}
                  size="sm"
                  bg="rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.15)' }}
                  fontSize="12px"
                >
                  Discover
                </Button>
              </HStack>

              {discoveredAgents.length > 0 && (
                <VStack spacing={2} align="stretch">
                  <Text color="white" fontSize="12px" fontWeight="500">
                    Discovered Agents:
                  </Text>
                  {discoveredAgents.map((agent) => (
                    <Flex
                      key={agent.id}
                      p={3}
                      bg="rgba(255, 255, 255, 0.02)"
                      borderRadius="6px"
                      align="center"
                      justify="space-between"
                      border="1px solid rgba(255, 255, 255, 0.05)"
                    >
                      <VStack align="start" spacing={0} flex={1}>
                        <HStack spacing={2}>
                          <Text color="white" fontSize="12px" fontWeight="500">
                            {agent.name}
                          </Text>
                          <Badge colorScheme="purple" size="xs">
                            v{agent.version}
                          </Badge>
                        </HStack>
                        <Text fontSize="10px" color="rgba(255, 255, 255, 0.6)">
                          {agent.description}
                        </Text>
                        <Text fontSize="9px" color="rgba(255, 255, 255, 0.5)">
                          Capabilities: {agent.capabilities.join(', ')}
                        </Text>
                      </VStack>

                      <Button
                        leftIcon={
                          loading[agent.id] ? (
                            <Spinner size="xs" />
                          ) : (
                            <Plus size={14} />
                          )
                        }
                        onClick={() => handleConnectAgent(agent)}
                        isDisabled={loading[agent.id]}
                        size="sm"
                        bg="rgba(0, 255, 0, 0.1)"
                        color="green.400"
                        _hover={{ bg: 'rgba(0, 255, 0, 0.15)' }}
                        fontSize="11px"
                      >
                        Connect
                      </Button>
                    </Flex>
                  ))}
                </VStack>
              )}
            </VStack>
          </Box>
        </Collapse>
      </Box>

      {/* Connected Agents */}
      <Box
        bg="rgba(255, 255, 255, 0.02)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="8px"
        overflow="hidden"
      >
        <Flex
          p={3}
          align="center"
          justify="space-between"
          cursor="pointer"
          onClick={() =>
            setExpandedSections((prev) => ({
              ...prev,
              connected: !prev.connected,
            }))
          }
          _hover={{ bg: 'rgba(255, 255, 255, 0.02)' }}
        >
          <HStack spacing={3}>
            {expandedSections.connected ? (
              <ChevronDown size={16} color="rgba(255, 255, 255, 0.6)" />
            ) : (
              <ChevronRight size={16} color="rgba(255, 255, 255, 0.6)" />
            )}
            <Users size={16} color="rgba(255, 255, 255, 0.6)" />
            <Text color="white" fontSize="13px" fontWeight="500">
              Connected Agents
            </Text>
          </HStack>
          <Badge
            colorScheme={connectedAgents.length > 0 ? 'green' : 'gray'}
            size="sm"
          >
            {connectedAgents.length} agents
          </Badge>
        </Flex>

        <Collapse in={expandedSections.connected}>
          <Box px={3} pb={3}>
            <Divider borderColor="rgba(255, 255, 255, 0.1)" mb={3} />

            {connectedAgents.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Users
                  size={32}
                  color="rgba(255, 255, 255, 0.3)"
                  style={{ margin: '0 auto 8px' }}
                />
                <Text color="rgba(255, 255, 255, 0.6)" fontSize="12px">
                  No agents connected yet
                </Text>
                <Text color="rgba(255, 255, 255, 0.4)" fontSize="10px">
                  Use the discovery section above to find and connect to agents
                </Text>
              </Box>
            ) : (
              <VStack spacing={2} align="stretch">
                {connectedAgents.map((agent) => (
                  <Flex
                    key={agent.agentId}
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
                        <Users size={12} color="rgba(255, 255, 255, 0.6)" />
                      </Box>

                      <VStack align="start" spacing={0} flex={1}>
                        <HStack spacing={2}>
                          <Text color="white" fontSize="12px" fontWeight="500">
                            {agent.agentName}
                          </Text>
                          {!agent.isEnabled && (
                            <Badge colorScheme="gray" size="xs">
                              Disabled
                            </Badge>
                          )}
                        </HStack>

                        <HStack spacing={3}>
                          <HStack spacing={1}>
                            {getStatusIcon(agent.connectionStatus)}
                            <Text
                              fontSize="9px"
                              color={`${getStatusColor(
                                agent.connectionStatus
                              )}.400`}
                            >
                              {agent.connectionStatus}
                            </Text>
                          </HStack>
                          <Text fontSize="9px" color="rgba(255, 255, 255, 0.5)">
                            {agent.capabilities.length} capabilities
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    <HStack spacing={1}>
                      <Tooltip label="Send message" placement="top">
                        <IconButton
                          aria-label="Send message"
                          icon={<MessageSquare size={14} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="whiteAlpha"
                          onClick={() => {
                            setSelectedAgent(agent);
                            onMessageModalOpen();
                          }}
                          isDisabled={agent.connectionStatus !== 'connected'}
                        />
                      </Tooltip>

                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="More options"
                          icon={
                            loading[agent.agentId] ? (
                              <Spinner size="xs" />
                            ) : (
                              <MoreVertical size={14} />
                            )
                          }
                          size="sm"
                          variant="ghost"
                          colorScheme="whiteAlpha"
                          isDisabled={loading[agent.agentId]}
                        />
                        <MenuList
                          bg="#1A202C"
                          border="1px solid rgba(255, 255, 255, 0.1)"
                        >
                          <MenuItem
                            onClick={() =>
                              handleToggleAgent(agent.agentId, !agent.isEnabled)
                            }
                            bg="transparent"
                            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                            color="white"
                            fontSize="12px"
                          >
                            {agent.isEnabled ? 'Disable' : 'Enable'} Agent
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleDisconnectAgent(agent.agentId)}
                            bg="transparent"
                            _hover={{ bg: 'rgba(255, 0, 0, 0.1)' }}
                            color="red.400"
                            fontSize="12px"
                          >
                            <Trash2 size={12} style={{ marginRight: '8px' }} />
                            Disconnect
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Send Message Modal */}
      <Modal isOpen={isMessageModalOpen} onClose={onMessageModalClose}>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent
          bg="#1A202C"
          border="1px solid rgba(255, 255, 255, 0.1)"
          color="white"
        >
          <ModalHeader fontSize="16px">
            Send Message to {selectedAgent?.agentName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize="12px">Message Type</FormLabel>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant={messageType === 'text' ? 'solid' : 'outline'}
                    onClick={() => setMessageType('text')}
                    fontSize="11px"
                  >
                    Text
                  </Button>
                  <Button
                    size="sm"
                    variant={messageType === 'json' ? 'solid' : 'outline'}
                    onClick={() => setMessageType('json')}
                    fontSize="11px"
                  >
                    JSON
                  </Button>
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="12px">Message Content</FormLabel>
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={
                    messageType === 'json'
                      ? '{"action": "example", "data": {}}'
                      : 'Enter your message...'
                  }
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  fontSize="12px"
                  rows={6}
                  _focus={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: 'none',
                  }}
                />
              </FormControl>

              <Button
                leftIcon={
                  sendingMessage ? <Spinner size="xs" /> : <Send size={14} />
                }
                onClick={handleSendMessage}
                isDisabled={sendingMessage || !messageContent.trim()}
                bg="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.15)' }}
                size="sm"
              >
                Send Message
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
