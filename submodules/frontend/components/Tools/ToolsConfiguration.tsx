import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  useDisclosure,
  IconButton,
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { AgentCard } from "./AgentCard";
import { CreateAgentModal } from "./CreateAgentModal";
import styles from "./ToolsConfiguration.module.css";

interface Agent {
  name: string;
  description: string;
  human_readable_name: string;
  command: string;
  upload_required: boolean;
  is_enabled: boolean;
  tools: any[];
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const createAgentModal = useDisclosure();

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen, apiBaseUrl]);

  const fetchAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/agents/available`);

      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }

      const data = await response.json();
      setAgents(data.available_agents || []);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentCreated = () => {
    fetchAgents();
    createAgentModal.onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside">
      <ModalOverlay className={styles.overlay} />
      <ModalContent className={styles.modalContent}>
        <ModalHeader className={styles.modalHeader}>Agents & Tools</ModalHeader>
        <ModalCloseButton className={styles.closeButton} />

        <ModalBody className={styles.modalBody}>
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
              <Button onClick={fetchAgents} mt={2} variant="outline" size="sm">
                Retry
              </Button>
            </Box>
          ) : (
            <VStack
              spacing={2}
              align="stretch"
              className={styles.agentsContainer}
            >
              {agents.length === 0 ? (
                <Text className={styles.noAgentsText}>
                  No agents available. Create a new agent to get started.
                </Text>
              ) : (
                agents.map((agent) => (
                  <AgentCard
                    key={agent.name}
                    agent={agent}
                    apiBaseUrl={apiBaseUrl}
                  />
                ))
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter className={styles.modalFooter}>
          <HStack justifyContent="space-between" width="100%" spacing={1}>
            <Text className={styles.description}>
              View available agents and their tools in the system.
            </Text>
            <Tooltip label="Add New Agent" placement="top">
              <IconButton
                icon={<AddIcon boxSize={3} />}
                aria-label="Add new agent"
                onClick={createAgentModal.onOpen}
                className={styles.addButton}
                size="sm"
              />
            </Tooltip>
          </HStack>
        </ModalFooter>
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
