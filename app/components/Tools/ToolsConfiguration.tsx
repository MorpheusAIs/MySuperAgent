import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  useDisclosure,
  IconButton,
  Spinner,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";
import { AgentCard } from "./AgentCard";
import { CreateAgentModal } from "./CreateAgentModal/index";
import styles from "./ToolsConfiguration.module.css";

// LocalStorage key for selected agents
const SELECTED_AGENTS_KEY = "selectedAgents";

interface Agent {
  name: string;
  description: string;
  human_readable_name: string;
  command: string;
  upload_required: boolean;
  is_enabled: boolean;
  tools: any[];
  mcp_server_url?: string;
}

interface ToolsConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
}

export const ToolsConfigurationModal: React.FC<
  ToolsConfigurationModalProps
> = ({ isOpen, onClose, apiBaseUrl }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState<number>(0);
  const createAgentModal = useDisclosure();

  // Load selected agents from localStorage on initial render
  useEffect(() => {
    const loadSelectedAgentsFromLocalStorage = () => {
      try {
        const savedAgents = localStorage.getItem(SELECTED_AGENTS_KEY);
        if (savedAgents) {
          setSelectedAgents(JSON.parse(savedAgents));
        }
      } catch (err) {
        console.error("Error loading selected agents from localStorage:", err);
        // If there's an error loading from localStorage, just use an empty array
        setSelectedAgents([]);
      }
    };

    loadSelectedAgentsFromLocalStorage();
  }, []);

  // Fetch agents when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen, apiBaseUrl]);

  // Filter agents when search query changes
  useEffect(() => {
    if (agents.length > 0) {
      filterAgents();
    }
  }, [searchQuery, agents]);

  const fetchAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/agents/available`);

      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }

      const data = await response.json();
      const availableAgents = data.available_agents || [];
      setAgents(availableAgents);

      // Check if we need to create default localStorage entry (all agents enabled)
      const savedAgents = localStorage.getItem(SELECTED_AGENTS_KEY);
      if (!savedAgents) {
        // By default, enable all agents
        const allAgentNames = availableAgents.map((agent: Agent) => agent.name);
        localStorage.setItem(
          SELECTED_AGENTS_KEY,
          JSON.stringify(allAgentNames)
        );
        setSelectedAgents(allAgentNames);
      }

      // Set filtered agents after setting agents
      if (searchQuery) {
        filterAgents();
      } else {
        setFilteredAgents(availableAgents);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAgents = () => {
    if (!searchQuery.trim()) {
      setFilteredAgents(agents);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = agents.filter(
      (agent) =>
        agent.human_readable_name?.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query) ||
        agent.mcp_server_url?.toLowerCase().includes(query)
    );
    setFilteredAgents(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAgentCreated = () => {
    fetchAgents();
    createAgentModal.onClose();
  };

  const handleAgentToggled = (updatedSelectedAgents: string[]) => {
    setSelectedAgents(updatedSelectedAgents);
  };

  const handleTabChange = (index: number) => {
    setTabIndex(index);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay className={styles.overlay} />
      <ModalContent className={styles.modalContent}>
        <ModalHeader className={styles.modalHeader}>Agent Registry</ModalHeader>
        <ModalCloseButton className={styles.closeButton} />

        <ModalBody className={styles.modalBody}>
          <Tabs
            variant="unstyled"
            index={tabIndex}
            onChange={handleTabChange}
            className={styles.tabsContainer}
          >
            <TabList className={styles.tabList}>
              <Tab className={tabIndex === 0 ? styles.activeTab : styles.tab}>
                Manage
              </Tab>
              <Tab className={tabIndex === 1 ? styles.activeTab : styles.tab}>
                Publish
              </Tab>
            </TabList>

            <TabPanels>
              {/* Manage Agents Tab */}
              <TabPanel padding="1rem 1.5rem">
                <Flex mb={4} alignItems="center">
                  <InputGroup size="sm" flex="1">
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="#59f886" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search agents..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className={styles.searchInput}
                      borderRadius="md"
                    />
                  </InputGroup>
                  <Tooltip label="Add New Agent" placement="top">
                    <IconButton
                      icon={<AddIcon boxSize={3} />}
                      aria-label="Add new agent"
                      onClick={createAgentModal.onOpen}
                      className={styles.addButton}
                      size="sm"
                      ml={2}
                    />
                  </Tooltip>
                </Flex>

                {isLoading ? (
                  <Box className={styles.loadingContainer}>
                    <Spinner size="md" color="#3a8c59" />
                    <Text mt={2} fontSize="sm">
                      Loading agents...
                    </Text>
                  </Box>
                ) : error ? (
                  <Box className={styles.errorContainer}>
                    <Text color="red.400" fontSize="sm">
                      {error}
                    </Text>
                    <Button
                      onClick={fetchAgents}
                      mt={2}
                      variant="outline"
                      size="sm"
                    >
                      Retry
                    </Button>
                  </Box>
                ) : (
                  <>
                    {filteredAgents.length === 0 ? (
                      <Text className={styles.noAgentsText}>
                        {searchQuery
                          ? "No agents found matching your search."
                          : "No agents available. Create a new agent to get started."}
                      </Text>
                    ) : (
                      <SimpleGrid columns={[1, 2, 3]} spacing={3}>
                        {filteredAgents.map((agent) => (
                          <AgentCard
                            key={agent.name}
                            agent={agent}
                            apiBaseUrl={apiBaseUrl}
                            selectedAgents={selectedAgents}
                            onAgentToggled={handleAgentToggled}
                          />
                        ))}
                      </SimpleGrid>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Import Agents Tab */}
              <TabPanel padding="1rem 1.5rem">
                <Box className={styles.comingSoonContainer}>
                  <Text className={styles.comingSoonText}>Coming Soon!</Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>

      <CreateAgentModal
        isOpen={createAgentModal.isOpen}
        onClose={createAgentModal.onClose}
        onAgentCreated={handleAgentCreated}
        apiBaseUrl={apiBaseUrl}
      />
    </Modal>
  );
};
