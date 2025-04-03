import React, { useState } from "react";
import {
  Box,
  Text,
  VStack,
  Collapse,
  Button,
  HStack,
  Badge,
  Tooltip,
  Flex,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { AgentTools } from "./AgentTools";
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

interface AgentCardProps {
  agent: Agent;
  apiBaseUrl: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, apiBaseUrl }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box className={styles.agentCard}>
      <Flex width="100%" position="relative">
        {/* Content area with fixed width to prevent shifting */}
        <Box flexGrow={1} pr="40px">
          <HStack spacing={1} mb={0.5}>
            <Text className={styles.agentName}>
              {agent.human_readable_name}
            </Text>
            {agent.upload_required && (
              <Tooltip label="File upload required" placement="top">
                <Badge className={styles.uploadBadge}>Upload</Badge>
              </Tooltip>
            )}
            <Badge className={styles.commandBadge}>/{agent.command}</Badge>
          </HStack>
          <Text className={styles.agentDescription}>{agent.description}</Text>
        </Box>

        {/* Button in absolute position */}
        <Box
          position="absolute"
          right="0"
          top="50%"
          transform="translateY(-50%)"
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.expandButton}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </Box>
      </Flex>

      <Collapse in={isExpanded} animateOpacity>
        <Box pt={2} px={1}>
          <AgentTools
            agentName={agent.name}
            tools={agent.tools}
            apiBaseUrl={apiBaseUrl}
          />
        </Box>
      </Collapse>
    </Box>
  );
};
