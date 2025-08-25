import { useWalletAddress } from '@/services/wallet/utils';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Switch,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import styles from './RulesAndMemories.module.css';
// Types for Rules and Memories
interface UserRule {
  id: string;
  wallet_address: string;
  title: string;
  content: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserMemory {
  id: string;
  wallet_address: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

interface RulesAndMemoriesProps {
  onSave: () => void;
}

export const RulesAndMemories: React.FC<RulesAndMemoriesProps> = ({
  onSave,
}) => {
  const [memoriesEnabled, setMemoriesEnabled] = useState(true);
  const [rules, setRules] = useState<UserRule[]>([]);
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const {
    isOpen: isRuleModalOpen,
    onOpen: onRuleModalOpen,
    onClose: onRuleModalClose,
  } = useDisclosure();
  const {
    isOpen: isMemoryModalOpen,
    onOpen: onMemoryModalOpen,
    onClose: onMemoryModalClose,
  } = useDisclosure();

  // Form states
  const [newRule, setNewRule] = useState({ title: '', content: '' });
  const [newMemory, setNewMemory] = useState({ title: '', content: '' });

  const toast = useToast();
  const { getAddress } = useWalletAddress();

  // Load existing rules and memories from API (with localStorage fallback)
  useEffect(() => {
    const loadData = async () => {
      const walletAddress = getAddress();

      setIsLoading(true);
      try {
        // Use localStorage for now since API has database issues
        loadFromLocalStorage();

        // TODO: Re-enable when database issues are resolved
        // if (walletAddress) {
        //   try {
        //     const [rulesData, memoriesData] = await Promise.all([
        //       RulesAndMemoriesAPI.getUserRules(walletAddress),
        //       RulesAndMemoriesAPI.getUserMemories(walletAddress),
        //     ]);
        //     setRules(rulesData);
        //     setMemories(memoriesData);
        //   } catch (apiError) {
        //     console.warn('API not available, using localStorage fallback:', apiError);
        //     loadFromLocalStorage();
        //   }
        // } else {
        //   loadFromLocalStorage();
        // }
      } catch (error: any) {
        console.error('Error loading rules and memories:', error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
      const savedRules = localStorage.getItem('userRules');
      const savedMemories = localStorage.getItem('userMemories');

      if (savedRules) {
        try {
          setRules(JSON.parse(savedRules));
        } catch (e) {
          console.error('Error parsing saved rules:', e);
        }
      }

      if (savedMemories) {
        try {
          setMemories(JSON.parse(savedMemories));
        } catch (e) {
          console.error('Error parsing saved memories:', e);
        }
      }
    };

    loadData();
  }, [getAddress, toast]);

  const saveToLocalStorage = (
    updatedRules: UserRule[],
    updatedMemories: UserMemory[]
  ) => {
    localStorage.setItem('userRules', JSON.stringify(updatedRules));
    localStorage.setItem('userMemories', JSON.stringify(updatedMemories));
  };

  const handleAddRule = async () => {
    if (!newRule.title.trim() || !newRule.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and content',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const walletAddress = getAddress();

      // Always use localStorage for now since API has issues
      addRuleToLocalStorage();

      // TODO: Re-enable API when database issues are resolved
      // if (walletAddress) {
      //   try {
      //     const newRuleData = await RulesAndMemoriesAPI.createRule(
      //       walletAddress,
      //       newRule.title,
      //       newRule.content
      //     );
      //     setRules((prev) => [newRuleData, ...prev]);
      //   } catch (apiError) {
      //     console.warn('API not available, using localStorage:', apiError);
      //     addRuleToLocalStorage();
      //   }
      // } else {
      //   addRuleToLocalStorage();
      // }

      setNewRule({ title: '', content: '' });
      onRuleModalClose();

      toast({
        title: 'Rule Added',
        description: 'Your rule has been successfully added',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error adding rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add rule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRuleToLocalStorage = () => {
    const newRuleData: UserRule = {
      id: Date.now().toString(),
      wallet_address: getAddress() || 'local',
      title: newRule.title,
      content: newRule.content,
      is_enabled: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const updatedRules = [newRuleData, ...rules];
    setRules(updatedRules);
    saveToLocalStorage(updatedRules, memories);
  };

  const handleAddMemory = async () => {
    if (!newMemory.title.trim() || !newMemory.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and content',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use localStorage for now since API has issues
      const newMemoryData: UserMemory = {
        id: Date.now().toString(),
        wallet_address: getAddress() || 'local',
        title: newMemory.title,
        content: newMemory.content,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedMemories = [newMemoryData, ...memories];
      setMemories(updatedMemories);
      saveToLocalStorage(rules, updatedMemories);

      setNewMemory({ title: '', content: '' });
      onMemoryModalClose();

      toast({
        title: 'Memory Added',
        description: 'Your memory has been successfully saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error adding memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to add memory',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const updatedRules = rules.filter((rule) => rule.id !== id);
      setRules(updatedRules);
      saveToLocalStorage(updatedRules, memories);

      toast({
        title: 'Rule Deleted',
        description: 'Rule has been removed',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error deleting rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete rule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const updatedMemories = memories.filter((memory) => memory.id !== id);
      setMemories(updatedMemories);
      saveToLocalStorage(rules, updatedMemories);

      toast({
        title: 'Memory Deleted',
        description: 'Memory has been removed',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error deleting memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete memory',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      const updatedRules = rules.map((rule) =>
        rule.id === id ? { ...rule, is_enabled: !rule.is_enabled } : rule
      );
      setRules(updatedRules);
      saveToLocalStorage(updatedRules, memories);
    } catch (error: any) {
      console.error('Error toggling rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveAllMemories = async () => {
    try {
      setMemories([]);
      saveToLocalStorage(rules, []);

      toast({
        title: 'All Memories Removed',
        description: 'All saved memories have been cleared',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error deleting all memories:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete memories',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box className={styles.container}>
        <VStack spacing={4} align="center" justify="center" h="400px">
          <Spinner size="lg" color="blue.400" />
          <Text color="rgba(255, 255, 255, 0.7)">
            Loading rules and memories...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="2xl" fontWeight="600" color="white" mb={2}>
            Rules & Memories
          </Text>
          <Text fontSize="md" color="rgba(255, 255, 255, 0.7)">
            Manage your custom user rules and preferences
          </Text>
        </Box>

        {/* Memories Section */}
        <Box className={styles.section}>
          <VStack spacing={4} align="stretch">
            <Box className={styles.sectionHeader}>
              <Text fontSize="lg" fontWeight="600" color="white">
                Memories
              </Text>
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                Saves useful context across Chats
              </Text>
            </Box>

            <Box className={styles.settingItem}>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="md" color="white">
                    Memories
                  </Text>
                  <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                    Learn your preferences automatically based on Chats
                  </Text>
                </VStack>
                <Switch
                  isChecked={memoriesEnabled}
                  onChange={(e) => setMemoriesEnabled(e.target.checked)}
                  colorScheme="green"
                  size="lg"
                />
              </HStack>
            </Box>

            <Box className={styles.savedMemoriesSection}>
              <HStack justify="space-between" mb={4}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="md" color="white">
                    Saved Memories
                  </Text>
                  <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                    Review or remove individual Memories
                  </Text>
                </VStack>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMemories(!showMemories)}
                  className={styles.hideButton}
                >
                  {showMemories ? 'Hide' : 'Show'}
                </Button>
              </HStack>

              {showMemories && (
                <VStack spacing={3} align="stretch">
                  {memories.map((memory) => (
                    <Box key={memory.id} className={styles.memoryItem}>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontSize="sm" fontWeight="500" color="white">
                            {memory.title}
                          </Text>
                          <Text
                            fontSize="xs"
                            color="rgba(255, 255, 255, 0.6)"
                            noOfLines={2}
                          >
                            {memory.content}
                          </Text>
                        </VStack>
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteMemory(memory.id)}
                          aria-label="Delete memory"
                        />
                      </HStack>
                    </Box>
                  ))}

                  {memories.length === 0 && (
                    <Text
                      fontSize="sm"
                      color="rgba(255, 255, 255, 0.5)"
                      textAlign="center"
                      py={4}
                    >
                      No memories saved yet
                    </Text>
                  )}

                  {memories.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      colorScheme="red"
                      onClick={handleRemoveAllMemories}
                      alignSelf="center"
                      mt={4}
                    >
                      Remove All Memories
                    </Button>
                  )}
                </VStack>
              )}
            </Box>
          </VStack>
        </Box>

        <Divider borderColor="rgba(255, 255, 255, 0.1)" />

        {/* User Rules Section */}
        <Box className={styles.section}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="600" color="white">
                  User Rules
                </Text>
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                  Manage your custom user rules and preferences
                </Text>
              </VStack>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                size="sm"
                onClick={onRuleModalOpen}
              >
                Add Rule
              </Button>
            </HStack>

            {rules.length === 0 ? (
              <Box className={styles.emptyState}>
                <VStack spacing={3}>
                  <Text fontSize="lg" color="rgba(255, 255, 255, 0.6)">
                    No User Rules Yet
                  </Text>
                  <Text
                    fontSize="sm"
                    color="rgba(255, 255, 255, 0.5)"
                    textAlign="center"
                  >
                    Add rules and preferences for Agent
                  </Text>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={onRuleModalOpen}
                  >
                    Add Rule
                  </Button>
                </VStack>
              </Box>
            ) : (
              <VStack spacing={3} align="stretch">
                {rules.map((rule) => (
                  <Box key={rule.id} className={styles.ruleItem}>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={2} flex={1}>
                        <HStack>
                          <Switch
                            isChecked={rule.is_enabled}
                            onChange={() => handleToggleRule(rule.id)}
                            size="sm"
                            colorScheme="green"
                          />
                          <Text fontSize="md" fontWeight="500" color="white">
                            {rule.title}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
                          {rule.content}
                        </Text>
                      </VStack>
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteRule(rule.id)}
                        aria-label="Delete rule"
                      />
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        </Box>
      </VStack>

      {/* Add Rule Modal */}
      <Modal isOpen={isRuleModalOpen} onClose={onRuleModalClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="#1a1a1a" color="white">
          <ModalHeader>Add New Rule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Rule Title</FormLabel>
                <Input
                  value={newRule.title}
                  onChange={(e) =>
                    setNewRule({ ...newRule, title: e.target.value })
                  }
                  placeholder="Enter rule title"
                  bg="#2a2a2a"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  _focus={{ borderColor: 'blue.400' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Rule Content</FormLabel>
                <Textarea
                  value={newRule.content}
                  onChange={(e) =>
                    setNewRule({ ...newRule, content: e.target.value })
                  }
                  placeholder="Describe your rule or preference"
                  rows={4}
                  bg="#2a2a2a"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  _focus={{ borderColor: 'blue.400' }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onRuleModalClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddRule}
              isLoading={isSubmitting}
              loadingText="Adding..."
            >
              Add Rule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Memory Modal */}
      <Modal isOpen={isMemoryModalOpen} onClose={onMemoryModalClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="#1a1a1a" color="white">
          <ModalHeader>Add New Memory</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Memory Title</FormLabel>
                <Input
                  value={newMemory.title}
                  onChange={(e) =>
                    setNewMemory({ ...newMemory, title: e.target.value })
                  }
                  placeholder="Enter memory title"
                  bg="#2a2a2a"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  _focus={{ borderColor: 'blue.400' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Memory Content</FormLabel>
                <Textarea
                  value={newMemory.content}
                  onChange={(e) =>
                    setNewMemory({ ...newMemory, content: e.target.value })
                  }
                  placeholder="Describe what you want to remember"
                  rows={4}
                  bg="#2a2a2a"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  _focus={{ borderColor: 'blue.400' }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onMemoryModalClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddMemory}
              isLoading={isSubmitting}
              loadingText="Adding..."
            >
              Add Memory
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
