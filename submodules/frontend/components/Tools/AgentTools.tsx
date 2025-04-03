import React from "react";
import {
  Box,
  VStack,
  Text,
  Badge,
  Divider,
  HStack,
  Icon,
  Tooltip,
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";
import styles from "./ToolsConfiguration.module.css";

interface Tool {
  name: string;
  description: string;
  type?: string;
  parameters?: any[];
}

interface AgentToolsProps {
  agentName: string;
  tools: Tool[];
  apiBaseUrl: string;
}

export const AgentTools: React.FC<AgentToolsProps> = ({
  agentName,
  tools,
  apiBaseUrl,
}) => {
  if (!tools || tools.length === 0) {
    return (
      <Box className={styles.noToolsContainer}>
        <Text className={styles.noToolsText}>
          No tools are configured for this agent.
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={0} align="stretch" className={styles.toolsContainer}>
      <Text className={styles.toolsHeader} ml={2}>
        Available Tools
      </Text>
      <Divider className={styles.toolsDivider} mt={2} mb={2} />

      {tools.map((tool, index) => (
        <React.Fragment key={`${agentName}-tool-${index}`}>
          <Box className={styles.toolItem}>
            <HStack justifyContent="space-between" width="100%" spacing={2}>
              <Box>
                <HStack spacing={1} mb={1}>
                  <Text className={styles.toolName}>{tool.name}</Text>
                  {tool.type && (
                    <Badge className={styles.toolTypeBadge}>{tool.type}</Badge>
                  )}
                </HStack>
                <Text className={styles.toolDescription}>
                  {tool.description}
                </Text>
              </Box>

              {tool.parameters && tool.parameters.length > 0 && (
                <Tooltip
                  label={`${tool.parameters.length} parameter${
                    tool.parameters.length > 1 ? "s" : ""
                  }`}
                  placement="top"
                >
                  <Box className={styles.parameterIndicator}>
                    <Icon as={InfoIcon} boxSize={2.5} />
                    <Text fontSize="xs">{tool.parameters.length}</Text>
                  </Box>
                </Tooltip>
              )}
            </HStack>
          </Box>

          {index < tools.length - 1 && (
            <Divider className={styles.toolItemDivider} my={2} />
          )}
        </React.Fragment>
      ))}
    </VStack>
  );
};
