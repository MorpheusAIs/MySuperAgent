import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  Bot,
  ChevronUp,
  Edit2,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import styles from './Main.module.css';

interface Agent {
  name: string;
  description: string;
}

interface AgentTeam {
  id: string;
  name: string;
  description: string;
  agents: string[];
  created_at: string;
  updated_at: string;
}

export const AgentTeamsMain: React.FC<{
  isSidebarOpen?: boolean;
  onBackToMain?: () => void;
}> = ({ isSidebarOpen = false, onBackToMain }) => {
  const [teams, setTeams] = useState<AgentTeam[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AgentTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agents: [] as string[],
  });

  const { address } = useAccount();
  const toast = useToast();

  const fetchTeams = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `/api/agent-teams?wallet_address=${address}`
      );
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast({
        title: 'Error fetching teams',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [address, toast]);

  const fetchAvailableAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch available agents:', error);
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchTeams();
      fetchAvailableAgents();
    }
  }, [address, fetchTeams, fetchAvailableAgents]);

  const handleCreateTeam = async () => {
    if (!address || !formData.name || formData.agents.length === 0) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide a name and select at least one agent',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch('/api/agent-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          wallet_address: address,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Team created successfully',
          status: 'success',
          duration: 3000,
        });
        setShowCreateForm(false);
        resetForm();
        fetchTeams();
      } else {
        throw new Error('Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Failed to create team',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !formData.name || formData.agents.length === 0) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide a name and select at least one agent',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch(`/api/agent-teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Team updated successfully',
          status: 'success',
          duration: 3000,
        });
        setEditingTeam(null);
        resetForm();
        fetchTeams();
      } else {
        throw new Error('Failed to update team');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: 'Failed to update team',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`/api/agent-teams/${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Team deleted successfully',
          status: 'success',
          duration: 3000,
        });
        fetchTeams();
      } else {
        throw new Error('Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: 'Failed to delete team',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const startEditTeam = (team: AgentTeam) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description,
      agents: team.agents,
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      agents: [],
    });
    setEditingTeam(null);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    resetForm();
  };

  const handleAgentToggle = (agentName: string) => {
    setFormData((prev) => ({
      ...prev,
      agents: prev.agents.includes(agentName)
        ? prev.agents.filter((a) => a !== agentName)
        : [...prev.agents, agentName],
    }));
  };

  if (loading) {
    return (
      <Box className={styles.container}>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color="white" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      {/* Back to Main Header */}
      {onBackToMain && (
        <Box
          p={4}
          borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
        >
          <Button
            onClick={onBackToMain}
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={16} color="white" />}
            color="white"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            _active={{ bg: 'rgba(255, 255, 255, 0.1)' }}
          >
            Back to Main
          </Button>
        </Box>
      )}

      {/* Header */}
      <Box className={styles.header}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text className={styles.title}>Agent Teams</Text>
              <Text className={styles.subtitle}>
                Create and manage teams of AI agents for complex tasks
              </Text>
            </VStack>
            <Button
              leftIcon={
                showCreateForm ? <ChevronUp size={20} /> : <Plus size={20} />
              }
              onClick={() => {
                if (showCreateForm) {
                  cancelForm();
                } else {
                  resetForm();
                  setShowCreateForm(true);
                }
              }}
              className={styles.createButton}
              size="lg"
            >
              {showCreateForm ? 'Cancel' : 'Create Team'}
            </Button>
          </HStack>
          <Divider borderColor="rgba(255, 255, 255, 0.1)" />
        </VStack>
      </Box>

      {/* Create/Edit Form */}
      <Collapse in={showCreateForm} animateOpacity>
        <Box className={styles.formContainer}>
          <VStack spacing={6} align="stretch">
            <Text className={styles.formTitle}>
              {editingTeam ? 'Edit Agent Team' : 'Create New Agent Team'}
            </Text>

            <HStack spacing={4} align="start">
              <VStack spacing={4} flex={1}>
                <FormControl isRequired>
                  <FormLabel className={styles.formLabel}>Team Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Research & Analysis Team"
                    className={styles.input}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel className={styles.formLabel}>
                    Description
                  </FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this team is designed to do..."
                    className={styles.textarea}
                    rows={4}
                  />
                </FormControl>
              </VStack>

              <VStack spacing={4} flex={1}>
                <FormControl isRequired>
                  <FormLabel className={styles.formLabel}>
                    Select Agents ({formData.agents.length} selected)
                  </FormLabel>
                  <Box className={styles.agentsList}>
                    <SimpleGrid columns={1} spacing={2}>
                      {availableAgents.map((agent) => (
                        <Box
                          key={agent.name}
                          className={`${styles.agentOption} ${
                            formData.agents.includes(agent.name)
                              ? styles.agentSelected
                              : ''
                          }`}
                          onClick={() => handleAgentToggle(agent.name)}
                        >
                          <HStack spacing={3} align="start">
                            <Checkbox
                              isChecked={formData.agents.includes(agent.name)}
                              onChange={() => handleAgentToggle(agent.name)}
                              colorScheme="blue"
                              size="lg"
                            />
                            <VStack align="start" spacing={1} flex={1}>
                              <HStack spacing={2}>
                                <Bot size={16} color="#4299E1" />
                                <Text className={styles.agentName}>
                                  {agent.name}
                                </Text>
                              </HStack>
                              <Text className={styles.agentDescription}>
                                {agent.description}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                </FormControl>
              </VStack>
            </HStack>

            <HStack spacing={4} justify="flex-end">
              <Button
                variant="ghost"
                onClick={cancelForm}
                className={styles.cancelButton}
                leftIcon={<X size={16} />}
              >
                Cancel
              </Button>
              <Button
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                isDisabled={!formData.name || formData.agents.length === 0}
                className={styles.submitButton}
                leftIcon={
                  editingTeam ? <Edit2 size={16} /> : <Plus size={16} />
                }
              >
                {editingTeam ? 'Update Team' : 'Create Team'}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Collapse>

      {/* Teams List */}
      <Box className={styles.content}>
        {teams.length === 0 && !showCreateForm ? (
          <Box className={styles.emptyState}>
            <VStack spacing={6}>
              <Users size={64} color="rgba(255, 255, 255, 0.3)" />
              <VStack spacing={3}>
                <Text className={styles.emptyTitle}>
                  No agent teams created yet
                </Text>
                <Text className={styles.emptySubtitle}>
                  Create your first team to start orchestrating multiple agents
                  together
                </Text>
              </VStack>
              <Button
                leftIcon={<Plus size={20} />}
                onClick={() => {
                  resetForm();
                  setShowCreateForm(true);
                }}
                className={styles.createButton}
                size="lg"
              >
                Create Your First Team
              </Button>
            </VStack>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {teams.map((team) => (
              <Box key={team.id} className={styles.teamCard}>
                <HStack justify="space-between" align="start">
                  <HStack spacing={3} align="start" flex={1}>
                    <Users
                      size={24}
                      color="#4299E1"
                      style={{ marginTop: '2px', flexShrink: 0 }}
                    />
                    <VStack align="start" spacing={2} flex={1}>
                      <Text className={styles.teamName}>{team.name}</Text>
                      <Text className={styles.teamDescription}>
                        {team.description || 'No description provided'}
                      </Text>
                      <HStack spacing={2} wrap="wrap">
                        <Text className={styles.agentsLabel}>
                          Agents ({team.agents.length}):
                        </Text>
                        {team.agents.map((agent) => (
                          <Box key={agent} className={styles.agentBadge}>
                            <HStack spacing={1}>
                              <Bot size={12} />
                              <Text fontSize="sm">{agent}</Text>
                            </HStack>
                          </Box>
                        ))}
                      </HStack>
                      <Text className={styles.teamDate}>
                        Created {new Date(team.created_at).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Edit team"
                      icon={<Edit2 size={16} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditTeam(team)}
                      className={styles.actionButton}
                    />
                    <IconButton
                      aria-label="Delete team"
                      icon={<Trash2 size={16} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTeam(team.id)}
                      className={styles.deleteButton}
                    />
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
};
