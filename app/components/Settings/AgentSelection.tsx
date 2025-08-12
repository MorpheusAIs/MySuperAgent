import { useState, useEffect } from "react";
import {
  VStack,
  Box,
  Checkbox,
  Button,
  Text,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import { trackEvent } from "@/services/analytics";
import { isFeatureEnabled, getNumericFlag } from "@/services/featureFlags";
import styles from "./AgentSelection.module.css";

interface Agent {
  name: string;
  description: string;
  human_readable_name: string;
}

interface AgentSelectionProps {
  onSave: (agents: string[]) => void;
}

export const AgentSelection: React.FC<AgentSelectionProps> = ({ onSave }) => {
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const toast = useToast();
  
  // Get max selection limit from feature flag
  const maxAgentSelection = getNumericFlag('feature.agent.max_selection', 6);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("http://localhost:8888/agents/available");
        const data = await response.json();
        
        // Filter agents based on feature flags
        const filteredAgents = data.available_agents.filter((agent: Agent) => {
          const featureFlagKey = `feature.agent.${agent.name}` as any;
          return isFeatureEnabled(featureFlagKey);
        });
        
        setAvailableAgents(filteredAgents);
        
        // Filter selected agents to only include those that are enabled
        const filteredSelected = data.selected_agents.filter((agentName: string) => {
          const featureFlagKey = `feature.agent.${agentName}` as any;
          return isFeatureEnabled(featureFlagKey);
        });
        
        setSelectedAgents(filteredSelected);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    };

    fetchAgents();
  }, []);

  const handleAgentToggle = (agentName: string) => {
    setSelectedAgents((prev) => {
      if (prev.includes(agentName)) {
        trackEvent('agent.selected', {
          agentName,
          action: 'deselected',
          totalSelected: prev.length - 1,
        });
        return prev.filter((name) => name !== agentName);
      } else {
        if (maxAgentSelection >= 0 && prev.length >= maxAgentSelection) {
          toast({
            title: "Maximum agents selected",
            description: `You can only select up to ${maxAgentSelection} agents at a time`,
            status: "warning",
            duration: 3000,
            isClosable: true,
            position: "top-right",
            variant: "subtle",
          });
          return prev;
        }
        
        trackEvent('agent.selected', {
          agentName,
          action: 'selected',
          totalSelected: prev.length + 1,
        });
        
        return [...prev, agentName];
      }
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch("http://localhost:8888/agents/selected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agents: selectedAgents }),
      });
      const data = await response.json();
      if (data.status === "success") {
        onSave(data.agents);
        
        // Track save event
        trackEvent('agent.selection_saved', {
          selectedAgents,
          agentCount: selectedAgents.length,
        });
        
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save selection:", error);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text className={styles.description}>
        Select which agents you want to be available in the system. For
        performance reasons, {maxAgentSelection >= 0 
          ? `only ${maxAgentSelection} agents can be selected at a time.`
          : 'there is no limit on the number of agents you can select.'}
      </Text>

      <Box className={styles.agentList}>
        <VStack spacing={2} align="stretch">
          {availableAgents.map((agent) => {
            const isDisabled = maxAgentSelection >= 0 && 
              selectedAgents.length >= maxAgentSelection && 
              !selectedAgents.includes(agent.name);
            
            return (
              <Box key={agent.name} className={styles.agentItem}>
                <Tooltip 
                  label={isDisabled ? `Maximum ${maxAgentSelection} agents already selected` : ''}
                  isDisabled={!isDisabled}
                >
                  <Checkbox
                    isChecked={selectedAgents.includes(agent.name)}
                    onChange={() => handleAgentToggle(agent.name)}
                    isDisabled={isDisabled}
                    width="100%"
                    className={styles.checkbox}
                  >
                    <VStack align="start" spacing={1} ml={3}>
                  <Text className={styles.agentName}>
                    {agent.human_readable_name}
                  </Text>
                  <Text className={styles.agentDescription}>
                    {agent.description}
                  </Text>
                </VStack>
              </Checkbox>
            </Tooltip>
          </Box>
        );
      })}
    </VStack>
  </Box>

      <Button onClick={handleSave} className={styles.saveButton}>
        Save Configuration
      </Button>
    </VStack>
  );
};
