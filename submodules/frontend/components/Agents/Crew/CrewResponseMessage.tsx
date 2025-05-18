import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  HStack,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Circle,
  Icon,
  Badge,
  Tooltip,
  Collapse,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import {
  FaRobot,
  FaCogs,
  FaCode,
  FaChartLine,
  FaSearch,
  FaComments,
  FaBrain,
  FaDatabase,
  FaExchangeAlt,
  FaClock,
  FaMemory,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { AiOutlineDeploymentUnit } from "react-icons/ai";
import { RiTeamLine, RiFlowChart } from "react-icons/ri";
import { CrewResponseMetadata } from "@/components/Agents/Crew/CrewResponseMessage.types";
import styles from "./CrewResponseMessage.module.css";

interface CrewResponseMessageProps {
  content: string;
  metadata?: CrewResponseMetadata;
}

/**
 * Custom components for enhanced ReactMarkdown rendering
 */
const MarkdownComponents = {
  h1: (props: any) => (
    <Text fontSize="xl" fontWeight="bold" my={2} {...props} />
  ),
  h2: (props: any) => (
    <Text fontSize="lg" fontWeight="bold" my={2} {...props} />
  ),
  h3: (props: any) => (
    <Text fontSize="md" fontWeight="bold" my={2} {...props} />
  ),
  h4: (props: any) => (
    <Text fontSize="sm" fontWeight="semibold" my={2} {...props} />
  ),
  h5: (props: any) => (
    <Text fontSize="xs" fontWeight="semibold" my={1} {...props} />
  ),
  h6: (props: any) => (
    <Text fontSize="xs" fontWeight="semibold" my={1} {...props} />
  ),
  p: (props: any) => <Text mb={2} {...props} />,
  a: (props: any) => (
    <Text as="a" color="blue.500" textDecoration="underline" {...props} />
  ),
  ul: (props: any) => <Box as="ul" pl={4} mb={2} {...props} />,
  ol: (props: any) => <Box as="ol" pl={4} mb={2} {...props} />,
  li: (props: any) => <Box as="li" ml={2} mb={1} {...props} />,
  blockquote: (props: any) => (
    <Box
      borderLeftWidth={2}
      borderLeftColor="gray.200"
      pl={3}
      py={1}
      my={2}
      {...props}
    />
  ),
  code: (props: any) => {
    const { inline, className, children, ...rest } = props;
    const match = /language-(\w+)/.exec(className || "");

    return !inline ? (
      <Box
        as="pre"
        p={2}
        borderRadius="md"
        bg="gray.700"
        color="white"
        overflowX="auto"
        fontSize="xs"
        my={2}
        {...rest}
      >
        <Box as="code" className={className} {...rest}>
          {children}
        </Box>
      </Box>
    ) : (
      <Box
        as="code"
        bg="gray.100"
        p={0.5}
        borderRadius="sm"
        fontSize="xs"
        {...rest}
      >
        {children}
      </Box>
    );
  },
  table: (props: any) => (
    <Box overflowX="auto" my={2}>
      <Box
        as="table"
        width="full"
        borderWidth={1}
        borderColor="gray.200"
        {...props}
      />
    </Box>
  ),
  th: (props: any) => (
    <Box
      as="th"
      bg="gray.50"
      p={2}
      borderWidth={1}
      borderColor="gray.200"
      fontWeight="semibold"
      {...props}
    />
  ),
  td: (props: any) => (
    <Box as="td" p={2} borderWidth={1} borderColor="gray.200" {...props} />
  ),
};

/**
 * Get an icon for an agent based on its name/type
 */
const getAgentIcon = (agentName: string) => {
  const name = agentName.toLowerCase();

  if (name.includes("search") || name.includes("query")) return FaSearch;
  if (name.includes("code") || name.includes("dev")) return FaCode;
  if (name.includes("data") || name.includes("database")) return FaDatabase;
  if (name.includes("chart") || name.includes("analytics")) return FaChartLine;
  if (name.includes("chat") || name.includes("conversation")) return FaComments;
  if (name.includes("brain") || name.includes("ai")) return FaBrain;
  if (name.includes("engine") || name.includes("process")) return FaCogs;
  if (name.includes("exchange") || name.includes("swap")) return FaExchangeAlt;
  if (name.includes("deploy")) return AiOutlineDeploymentUnit;
  if (name.includes("team") || name.includes("crew")) return RiTeamLine;

  return FaRobot; // Default icon
};

/**
 * Compact task output component
 */
const CompactTaskOutput: React.FC<{
  content: string;
  taskNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ content, taskNumber, isExpanded, onToggle }) => {
  return (
    <Box position="relative" cursor="pointer" onClick={onToggle}>
      <Collapse in={!isExpanded} animateOpacity>
        <Box
          className={styles.compactOutput}
          h="40px"
          overflow="hidden"
          position="relative"
        >
          <ReactMarkdown components={MarkdownComponents}>
            {content}
          </ReactMarkdown>
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="20px"
            bgGradient="linear(to-t, gray.800, transparent)"
          />
        </Box>
      </Collapse>

      <Collapse in={isExpanded} animateOpacity>
        <Box p={3} bg="gray.825" borderRadius="md" mt={2}>
          <ReactMarkdown components={MarkdownComponents}>
            {content}
          </ReactMarkdown>
        </Box>
      </Collapse>
    </Box>
  );
};

/**
 * Renders a response from the BasicOrchestrator crew with metadata
 * about the contributing agents and task summaries.
 */
const CrewResponseMessage: React.FC<CrewResponseMessageProps> = ({
  content,
  metadata,
}) => {
  // Initialize all tasks as collapsed (empty set)
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [isFlowExpanded, setIsFlowExpanded] = useState(true);
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  // Typing animation effect
  useEffect(() => {
    if (!content) return;
    
    // Reset displayed content when content changes
    setDisplayedContent("");
    setIsTyping(true);
    
    const totalLength = content.length;
    let currentLength = 0;
    
    // Calculate typing speed to complete in ~0.8-1.2 seconds
    const typingDuration = Math.min(1000, Math.max(800, totalLength * 3)); // Dynamic duration based on length
    const charsPerInterval = Math.max(1, Math.ceil(totalLength / (typingDuration / 16))); // 60fps
    
    const interval = setInterval(() => {
      currentLength += charsPerInterval;
      
      if (currentLength >= totalLength) {
        setDisplayedContent(content);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedContent(content.substring(0, currentLength));
      }
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [content]);

  if (!metadata) {
    return (
      <ReactMarkdown components={MarkdownComponents}>{displayedContent}</ReactMarkdown>
    );
  }

  const toggleTask = (taskIndex: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskIndex)) {
      newExpanded.delete(taskIndex);
    } else {
      newExpanded.add(taskIndex);
    }
    setExpandedTasks(newExpanded);
  };

  const totalAgents =
    metadata.subtask_outputs?.reduce(
      (acc, task) => acc + (task.agents?.length || 0),
      0
    ) || 0;

  const totalTime =
    metadata.subtask_outputs?.reduce(
      (acc, task) => acc + (task.telemetry?.processing_time?.duration || 0),
      0
    ) || 0;

  const totalTokens =
    metadata.subtask_outputs?.reduce(
      (acc, task) => acc + (task.telemetry?.token_usage?.total_tokens || 0),
      0
    ) || 0;

  // Get all unique agents
  const allAgents =
    metadata.subtask_outputs?.reduce((acc: string[], task) => {
      if (task.agents) {
        task.agents.forEach((agent) => {
          if (!acc.includes(agent)) {
            acc.push(agent);
          }
        });
      }
      return acc;
    }, []) || [];

  return (
    <Box className={styles.crewResponseContainer}>
      {/* Main Response */}
      <Box mb={3} className={styles.mainResponse}>
        <ReactMarkdown components={MarkdownComponents}>{displayedContent}</ReactMarkdown>
        {isTyping && <span className={styles.typingCursor} />}
      </Box>

      {/* Orchestration Flow */}
      {metadata.subtask_outputs && metadata.subtask_outputs.length > 0 && (
        <Box
          bg="gray.900"
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor="gray.700"
          mt={4}
        >
          {/* Header */}
          <Box
            as="button"
            w="full"
            onClick={() => setIsFlowExpanded(!isFlowExpanded)}
            cursor="pointer"
            _hover={{ bg: "gray.850" }}
            p={3}
            m={-3}
            mb={-3}
            borderRadius="md"
            transition="background 0.2s"
          >
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={RiFlowChart} boxSize={5} color="blue.400" />
                <Text fontSize="md" fontWeight="bold" color="gray.100">
                  Orchestration Flow
                </Text>
                <Badge colorScheme="purple" fontSize="xs">
                  {metadata.subtask_outputs.length} steps
                </Badge>
                <Icon
                  as={isFlowExpanded ? FaChevronUp : FaChevronDown}
                  boxSize={3}
                  color="gray.400"
                />
              </HStack>

              <HStack spacing={4} fontSize="xs">
                <Popover trigger="hover" placement="top">
                  <PopoverTrigger>
                    <HStack cursor="pointer">
                      <Icon as={FaRobot} boxSize={3} color="blue.400" />
                      <Text color="gray.400">{allAgents.length} agents</Text>
                    </HStack>
                  </PopoverTrigger>
                  <PopoverContent
                    width="auto"
                    minWidth="200px"
                    maxWidth="320px"
                    bg="gray.800"
                    borderColor="gray.700"
                    boxShadow="lg"
                  >
                    <PopoverArrow bg="gray.800" />
                    <PopoverBody p={3}>
                      <Text
                        fontWeight="semibold"
                        fontSize="sm"
                        mb={2}
                        color="blue.200"
                      >
                        Agents involved:
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {allAgents.map((agent, idx) => {
                          const AgentIcon = getAgentIcon(agent);
                          return (
                            <HStack key={idx} spacing={2} color="gray.100">
                              <Icon
                                as={AgentIcon}
                                boxSize={3}
                                color="blue.400"
                              />
                              <Text fontSize="sm">{agent}</Text>
                            </HStack>
                          );
                        })}
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <HStack>
                  <Icon as={FaClock} boxSize={3} color="orange.400" />
                  <Text>
                    <Text as="span" color="orange.400" fontWeight="medium">
                      {totalTime.toFixed(1)}
                    </Text>
                    <Text as="span" color="gray.400">
                      s
                    </Text>
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={FaMemory} boxSize={3} color="purple.400" />
                  <Text>
                    <Text as="span" color="purple.400" fontWeight="medium">
                      {totalTokens}
                    </Text>
                    <Text as="span" color="gray.400">
                      {" "}
                      tokens
                    </Text>
                  </Text>
                </HStack>
              </HStack>
            </HStack>
          </Box>

          {/* Flow Visualization */}
          <Collapse in={isFlowExpanded} animateOpacity>
            <Box mt={4}>
              <VStack spacing={0} align="stretch">
                {metadata.subtask_outputs.map((subtask, idx) => {
                  const taskDescription = subtask.subtask || subtask.key || "";
                  const taskOutput = subtask.output || subtask.value || "";
                  const isExpanded = expandedTasks.has(idx);
                  const isLastTask =
                    idx === (metadata.subtask_outputs?.length || 0) - 1;

                  return (
                    <Box key={idx} position="relative" mb={isLastTask ? 0 : 4}>
                      {/* Connection Line */}
                      {idx > 0 && (
                        <Box
                          position="absolute"
                          left="20px"
                          top="-16px"
                          w="2px"
                          h="16px"
                          bg="gray.600"
                        />
                      )}

                      {/* Line to next task */}
                      {!isLastTask && (
                        <Box
                          position="absolute"
                          left="20px"
                          top="40px"
                          w="2px"
                          h="calc(100% - 40px + 16px)"
                          bg="gray.600"
                        />
                      )}

                      {/* Task Node */}
                      <HStack spacing={3} align="stretch">
                        {/* Step Number */}
                        <Circle
                          size="40px"
                          bg="blue.500"
                          color="white"
                          fontSize="sm"
                          fontWeight="bold"
                          flexShrink={0}
                          position="relative"
                          zIndex={1}
                        >
                          {idx + 1}
                        </Circle>

                        {/* Task Content */}
                        <Box
                          flex={1}
                          bg="gray.800"
                          borderRadius="md"
                          p={3}
                          border="1px solid"
                          borderColor="gray.700"
                          transition="all 0.2s"
                          _hover={{ borderColor: "gray.600" }}
                        >
                          {/* Task Header */}
                          <HStack justify="space-between" mb={2}>
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color="gray.100"
                            >
                              {taskDescription}
                            </Text>

                            {subtask.agents && subtask.agents.length > 0 && (
                              <HStack spacing={1}>
                                {subtask.agents.map((agent, agentIdx) => {
                                  const AgentIcon = getAgentIcon(agent);
                                  return (
                                    <Tooltip
                                      key={agentIdx}
                                      label={agent}
                                      placement="top"
                                    >
                                      <Circle
                                        size="24px"
                                        bg="gray.700"
                                        borderWidth={1}
                                        borderColor="gray.600"
                                      >
                                        <Icon
                                          as={AgentIcon}
                                          boxSize={3}
                                          color="blue.300"
                                        />
                                      </Circle>
                                    </Tooltip>
                                  );
                                })}
                              </HStack>
                            )}
                          </HStack>

                          {/* Task Output */}
                          <CompactTaskOutput
                            content={taskOutput}
                            taskNumber={idx}
                            isExpanded={isExpanded}
                            onToggle={() => toggleTask(idx)}
                          />

                          {/* Task Telemetry */}
                          {subtask.telemetry && (
                            <HStack
                              mt={2}
                              spacing={3}
                              fontSize="xs"
                              cursor="pointer"
                              onClick={() => toggleTask(idx)}
                            >
                              {subtask.telemetry.processing_time?.duration && (
                                <HStack spacing={1}>
                                  <Icon
                                    as={FaClock}
                                    boxSize={3}
                                    color="orange.400"
                                  />
                                  <Text>
                                    <Text
                                      as="span"
                                      color="orange.400"
                                      fontWeight="medium"
                                    >
                                      {subtask.telemetry.processing_time.duration.toFixed(
                                        2
                                      )}
                                    </Text>
                                    <Text as="span" color="gray.500">
                                      s
                                    </Text>
                                  </Text>
                                </HStack>
                              )}
                              {subtask.telemetry.token_usage && (
                                <HStack spacing={1}>
                                  <Icon
                                    as={FaMemory}
                                    boxSize={3}
                                    color="purple.400"
                                  />
                                  <Text>
                                    <Text
                                      as="span"
                                      color="purple.400"
                                      fontWeight="medium"
                                    >
                                      {
                                        subtask.telemetry.token_usage
                                          .total_tokens
                                      }
                                    </Text>
                                    <Text as="span" color="gray.500">
                                      {" "}
                                      tokens
                                    </Text>
                                  </Text>
                                </HStack>
                              )}
                              <Icon
                                as={isExpanded ? FaChevronUp : FaChevronDown}
                                boxSize={3}
                                color="gray.400"
                                ml="auto"
                              />
                            </HStack>
                          )}
                        </Box>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default CrewResponseMessage;
