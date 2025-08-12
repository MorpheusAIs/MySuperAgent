import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Text,
  Badge,
  HStack,
  IconButton,
  Switch,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  useToast,
} from "@chakra-ui/react";
import { FaWrench } from "react-icons/fa";
import { AgentTools } from "./AgentTools";
import styles from "./ToolsConfiguration.module.css";

// LocalStorage key prefix for selected agents
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

interface AgentCardProps {
  agent: Agent;
  apiBaseUrl: string;
  selectedAgents: string[];
  onAgentToggled: (updatedSelectedAgents: string[]) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  apiBaseUrl,
  selectedAgents,
  onAgentToggled,
}) => {
  const [isEnabled, setIsEnabled] = useState(
    selectedAgents.includes(agent.name)
  );
  const toast = useToast();
  const hasTools = agent.tools && agent.tools.length > 0;
  // Use a ref to track if an operation is in progress to prevent duplicate toasts
  const isTogglingRef = useRef(false);

  // Update local state when selectedAgents prop changes
  useEffect(() => {
    setIsEnabled(selectedAgents.includes(agent.name));
  }, [selectedAgents, agent.name]);

  const toggleAgent = async () => {
    // If already processing a toggle, exit early
    if (isTogglingRef.current) return;

    // Mark as processing
    isTogglingRef.current = true;

    const newState = !isEnabled;

    try {
      // Create updated list of selected agents
      let updatedSelectedAgents = [...selectedAgents];

      if (newState) {
        if (!updatedSelectedAgents.includes(agent.name)) {
          updatedSelectedAgents.push(agent.name);
        }
      } else {
        updatedSelectedAgents = updatedSelectedAgents.filter(
          (name) => name !== agent.name
        );
      }

      // Save to localStorage
      localStorage.setItem(
        SELECTED_AGENTS_KEY,
        JSON.stringify(updatedSelectedAgents)
      );

      // Update local state
      setIsEnabled(newState);
      onAgentToggled(updatedSelectedAgents);

      // Show subtle toast notification
      toast({
        title: `${agent.human_readable_name}`,
        description: `Successfully ${newState ? "enabled" : "disabled"}`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
        variant: "subtle",
      });
    } catch (error) {
      console.error("Error toggling agent:", error);
      toast({
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not update agent status",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
        variant: "subtle",
      });
    } finally {
      // Reset processing state after a small delay to prevent rapid toggling
      setTimeout(() => {
        isTogglingRef.current = false;
      }, 300);
    }
  };

  // Use separate handler functions to avoid event propagation issues
  const handleSwitchChange = () => {
    toggleAgent();
  };

  const handleLabelClick = () => {
    toggleAgent();
  };

  return (
    <Box className={styles.agentCard}>
      <Box className={styles.cardHeader}>
        <Text className={styles.agentName}>{agent.human_readable_name}</Text>
        {agent.upload_required && (
          <Badge className={styles.uploadBadge}>Upload</Badge>
        )}
        {agent.mcp_server_url && (
          <HStack spacing={1} alignItems="center">
            <Text className={styles.mcpUrlLabel}>MCP</Text>
          </HStack>
        )}
      </Box>

      <Text className={styles.agentDescription} noOfLines={2}>
        {agent.description}
      </Text>

      <HStack className={styles.cardFooter} spacing={3}>
        <HStack spacing={1}>
          <Switch
            size="sm"
            isChecked={isEnabled}
            onChange={handleSwitchChange}
            colorScheme="green"
          />
          <Text
            fontSize="xs"
            color={isEnabled ? "#59f886" : "#aaa"}
            cursor="pointer"
            onClick={handleLabelClick}
          >
            {isEnabled ? "Enabled" : "Disabled"}
          </Text>
        </HStack>

        <Popover placement="bottom" closeOnBlur closeOnEsc>
          <PopoverTrigger>
            <IconButton
              aria-label="View tools"
              icon={<FaWrench />}
              variant="ghost"
              size="sm"
              className={
                hasTools ? styles.toolsButton : styles.toolsButtonDisabled
              }
              isDisabled={!hasTools}
            />
          </PopoverTrigger>
          {hasTools && (
            <PopoverContent className={styles.popoverContent}>
              <PopoverArrow className={styles.popoverArrow} />
              <PopoverBody className={styles.popoverBody} p={0}>
                <AgentTools
                  agentName={agent.name}
                  tools={agent.tools}
                  apiBaseUrl={apiBaseUrl}
                />
              </PopoverBody>
            </PopoverContent>
          )}
        </Popover>
      </HStack>
    </Box>
  );
};
