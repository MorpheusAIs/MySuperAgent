import React from "react";
import {
  Box,
  VStack,
  Text,
  Badge,
  Divider,
  HStack,
  Tooltip,
} from "@chakra-ui/react";
import styles from "./ToolsConfiguration.module.css";

interface Tool {
  name: string;
  description: string;
  type?: string;
  parameters?: any[];
}

interface AgentToolsProps {
  agentName?: string;
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
      <Text className={styles.toolsHeader}>
        Available Tools ({tools.length})
      </Text>
      <Divider className={styles.toolsDivider} />

      <Box className={styles.toolsScrollArea}>
        {tools.map((tool, index) => (
          <React.Fragment key={`${agentName}-tool-${index}`}>
            <Box className={styles.toolItem}>
              <HStack spacing={1} mb={1}>
                <Text className={styles.toolName}>{tool.name}</Text>
                {tool.type && (
                  <Badge className={styles.toolTypeBadge}>{tool.type}</Badge>
                )}
                {tool.parameters && tool.parameters.length > 0 && (
                  <Tooltip
                    label={`${tool.parameters.length} parameter${
                      tool.parameters.length > 1 ? "s" : ""
                    }`}
                    placement="top"
                  >
                    <Badge className={styles.parameterBadge}>
                      {tool.parameters.length}
                    </Badge>
                  </Tooltip>
                )}
              </HStack>
              <Text className={styles.toolDescription}>{tool.description}</Text>
            </Box>

            {index < tools.length - 1 && (
              <Divider className={styles.toolItemDivider} />
            )}
          </React.Fragment>
        ))}
      </Box>
    </VStack>
  );
};
