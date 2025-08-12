import React, { useEffect, useRef } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Fade,
  Icon,
  Flex,
  Collapse,
} from "@chakra-ui/react";
import {
  FaRobot,
  FaCog,
  FaCheck,
  FaBrain,
  FaClock,
  FaCoins,
} from "react-icons/fa";
import { StreamingState } from "@/contexts/chat/types";
import styles from "./index.module.css";

interface StreamingProgressProps {
  streamingState: StreamingState;
}

export const StreamingProgress: React.FC<StreamingProgressProps> = ({
  streamingState,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect when content changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [streamingState.output, streamingState.subtask]);

  if (!streamingState || streamingState.status === "idle") {
    return null;
  }

  const getStatusIcon = () => {
    switch (streamingState.status) {
      case "synthesizing":
        return <FaBrain className={styles.spinningIcon} />;
      case "processing":
        return <FaCog className={styles.spinningIcon} />;
      default:
        return <FaRobot className={styles.spinningIcon} />;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration && duration !== 0) return null;
    // duration is in seconds from backend
    const seconds = Math.round(duration);
    return seconds < 60
      ? `${seconds}s`
      : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const formatTokenUsage = () => {
    if (!streamingState.telemetry?.token_usage) return null;
    const tokens = streamingState.telemetry.token_usage;
    // Check for both naming conventions from backend
    const totalTokens = tokens.total || 0;
    if (totalTokens) {
      return `${totalTokens} tokens`;
    }
    return null;
  };

  return (
    <Box className={styles.messageContainer}>
      <Box className={styles.messageWrapper}>
        <Fade in={true} transition={{ enter: { duration: 0.2 } }}>
          <Box
            ref={containerRef}
            className={styles.progressContainer}
            data-status={streamingState.status}
          >
            <VStack spacing={4} align="stretch">
              {/* Header */}
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={getStatusIcon} boxSize={5} color="blue.400" />
                  <Text fontSize="md" fontWeight="bold" color="white">
                    {streamingState.status === "synthesizing"
                      ? "Synthesizing Response"
                      : "Processing Request"}
                  </Text>
                </HStack>
                {streamingState.totalAgents && (
                  <Badge colorScheme="blue" variant="subtle" px={2} py={1}>
                    {streamingState.currentAgentIndex || 0} /{" "}
                    {streamingState.totalAgents} agents
                  </Badge>
                )}
              </Flex>

              {/* Current Task */}
              {streamingState.subtask && (
                <Fade in={true} transition={{ enter: { duration: 0.3 } }}>
                  <Box
                    bg="gray.800"
                    p={4}
                    borderRadius="lg"
                    borderLeft="4px solid"
                    borderColor="blue.400"
                    position="relative"
                    overflow="hidden"
                  >
                    <Text
                      fontSize="sm"
                      color="gray.400"
                      fontWeight="semibold"
                      mb={2}
                    >
                      Current Subtask
                    </Text>
                    <Text fontSize="sm" color="white">
                      {streamingState.subtask}
                    </Text>
                    <Box className={styles.glowEffect} />
                  </Box>
                </Fade>
              )}

              {/* Active Agents */}
              {streamingState.agents && streamingState.agents.length > 0 && (
                <Fade
                  in={true}
                  transition={{ enter: { duration: 0.3, delay: 0.1 } }}
                >
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={2}>
                      Active Agents
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {streamingState.agents.map((agent, index) => (
                        <Fade
                          key={index}
                          in={true}
                          transition={{
                            enter: { duration: 0.2, delay: index * 0.05 },
                          }}
                        >
                          <Badge
                            colorScheme="purple"
                            variant="outline"
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                            className={styles.agentBadge}
                          >
                            <HStack spacing={1}>
                              <Icon as={FaRobot} boxSize={3} />
                              <Text>{agent}</Text>
                            </HStack>
                          </Badge>
                        </Fade>
                      ))}
                    </HStack>
                  </Box>
                </Fade>
              )}

              {/* Output */}
              <Collapse in={!!streamingState.output} animateOpacity>
                <Box
                  ref={contentRef}
                  bg="gray.900"
                  p={4}
                  borderRadius="lg"
                  maxHeight="200px"
                  overflowY="auto"
                  className={styles.outputBox}
                  position="relative"
                >
                  <HStack spacing={2} mb={2}>
                    <Icon as={FaCheck} color="green.400" boxSize={3} />
                    <Text fontSize="xs" color="gray.400" fontWeight="semibold">
                      Agent Response
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.200" whiteSpace="pre-wrap">
                    {streamingState.output}
                  </Text>
                  <Box className={styles.fadeOverlay} />
                </Box>
              </Collapse>

              {/* Telemetry Stats */}
              {streamingState.telemetry && (
                <Fade
                  in={true}
                  transition={{ enter: { duration: 0.3, delay: 0.2 } }}
                >
                  <HStack spacing={4} justify="center">
                    {streamingState.telemetry.processing_time?.duration !==
                      undefined && (
                      <HStack spacing={1}>
                        <Icon as={FaClock} color="gray.500" boxSize={3} />
                        <Text fontSize="xs" color="gray.500">
                          {formatDuration(
                            streamingState.telemetry.processing_time.duration
                          )}
                        </Text>
                      </HStack>
                    )}
                    {formatTokenUsage() && (
                      <HStack spacing={1}>
                        <Icon as={FaCoins} color="gray.500" boxSize={3} />
                        <Text fontSize="xs" color="gray.500">
                          {formatTokenUsage()}
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                </Fade>
              )}

              {/* Synthesis Message */}
              {streamingState.status === "synthesizing" && (
                <Fade in={true} transition={{ enter: { duration: 0.3 } }}>
                  <Box
                    bg="yellow.900"
                    p={3}
                    borderRadius="lg"
                    borderLeft="4px solid"
                    borderColor="yellow.500"
                    position="relative"
                    overflow="hidden"
                  >
                    <HStack spacing={2}>
                      <Icon as={FaBrain} color="yellow.300" boxSize={4} />
                      <Text fontSize="sm" color="yellow.200">
                        Combining agent responses into a comprehensive answer...
                      </Text>
                    </HStack>
                    <Box className={styles.shimmer} />
                  </Box>
                </Fade>
              )}
            </VStack>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};
