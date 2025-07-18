import React, { FC, useState } from "react";
import { Box, VStack, Text, Button, HStack, Badge, Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { ChatIcon, TimeIcon } from "@chakra-ui/icons";
import { Conversation } from "@/services/types";
import { getMessagesHistory } from "@/services/ChatManagement/storage";
import styles from "./index.module.css";

interface JobsListProps {
  conversations: Conversation[];
  onJobClick: (jobId: string) => void;
  isLoading?: boolean;
}

const getConversationStatus = (conversation: Conversation): "pending" | "running" | "completed" | "failed" => {
  const messages = getMessagesHistory(conversation.id);
  const userMessages = messages.filter(m => m.role === "user");
  const hasAssistantResponse = messages.some(m => m.role === "assistant");
  
  if (userMessages.length === 0) return "pending";
  if (!hasAssistantResponse) return "running";
  
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.role === "assistant" ? "completed" : "running";
};

const isCurrentJob = (conversation: Conversation) => {
  const status = getConversationStatus(conversation);
  
  // Current jobs are those in progress or completed within the last 24 hours
  if (status === 'pending' || status === 'running') {
    return true;
  }
  
  if (status === 'completed') {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return new Date(conversation.createdAt) > oneDayAgo;
  }
  
  return false;
};

const isPreviousJob = (conversation: Conversation) => {
  const status = getConversationStatus(conversation);
  
  // Previous jobs are completed/failed jobs older than 24 hours
  if (status === 'failed') {
    return true;
  }
  
  if (status === 'completed') {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return new Date(conversation.createdAt) <= oneDayAgo;
  }
  
  return false;
};

const getStatusColor = (status: "pending" | "running" | "completed" | "failed") => {
  switch (status) {
    case "pending":
      return "gray";
    case "running":
      return "blue";
    case "completed":
      return "green";
    case "failed":
      return "red";
    default:
      return "gray";
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
};

const JobItem: FC<{ conversation: Conversation; onClick: (jobId: string) => void }> = ({ conversation, onClick }) => {
  const messages = getMessagesHistory(conversation.id);
  const userMessages = messages.filter(m => m.role === "user");
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const status = getConversationStatus(conversation);
  
  // Get title and description from first user message
  const firstUserMessage = userMessages[0];
  const title = conversation.name !== "New Conversation" ? conversation.name : 
    (firstUserMessage?.content ? 
      (typeof firstUserMessage.content === 'string' ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 'Untitled Job') : 
      'Untitled Job');
  const description = firstUserMessage?.content ? 
    (typeof firstUserMessage.content === 'string' ? firstUserMessage.content : 'No description') : 
    'No description';
  
  return (
    <Button
      key={conversation.id}
      className={styles.jobItem}
      onClick={() => onClick(conversation.id)}
      variant="ghost"
      size="lg"
      h="auto"
      p={4}
      justifyContent="flex-start"
      _hover={{ bg: "rgba(255, 255, 255, 0.02)" }}
      _active={{ bg: "rgba(255, 255, 255, 0.01)" }}
      w="100%"
      overflow="hidden"
    >
      <VStack align="stretch" spacing={2} width="100%">
        <HStack justify="space-between" align="flex-start" spacing={3}>
          <VStack align="flex-start" spacing={1} flex={1} minW={0}>
            <Text
              fontSize="md"
              fontWeight="semibold"
              color="gray.200"
              textAlign="left"
              noOfLines={1}
              w="100%"
            >
              {title}
            </Text>
            <Text
              fontSize="sm"
              color="gray.500"
              textAlign="left"
              noOfLines={2}
              w="100%"
            >
              {description}
            </Text>
          </VStack>
          <Badge colorScheme={getStatusColor(status)} variant="subtle" size="sm" flexShrink={0}>
            {status}
          </Badge>
        </HStack>
        
        <HStack justify="space-between" fontSize="xs" color="gray.600" w="100%">
          <HStack spacing={4} flexShrink={0}>
            <HStack spacing={1}>
              <ChatIcon w={3} h={3} />
              <Text>{messages.length} messages</Text>
            </HStack>
            <HStack spacing={1}>
              <TimeIcon w={3} h={3} />
              <Text>{formatTimeAgo(new Date(conversation.createdAt))}</Text>
            </HStack>
          </HStack>
        </HStack>
        
        {lastMessage && lastMessage.role === "assistant" && lastMessage.content && (
          <Text
            fontSize="xs"
            color="gray.600"
            textAlign="left"
            noOfLines={1}
            fontStyle="italic"
            w="100%"
          >
            &quot;{typeof lastMessage.content === 'string' ? lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '') : 'Response received'}&quot;
          </Text>
        )}
      </VStack>
    </Button>
  );
};

export const JobsList: FC<JobsListProps> = ({ conversations, onJobClick, isLoading }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Filter out default conversation and conversations without user messages
  const jobConversations = conversations.filter(conv => {
    if (conv.id === "default") return false;
    const messages = getMessagesHistory(conv.id);
    const userMessages = messages.filter(m => m.role === "user");
    return userMessages.length > 0;
  });
  
  const currentJobs = jobConversations.filter(isCurrentJob);
  const previousJobs = jobConversations.filter(isPreviousJob);
  
  if (jobConversations.length === 0 && !isLoading) {
    return (
      <Box className={styles.emptyState}>
        <Text fontSize="md" color="gray.500" textAlign="center">
          No jobs yet. Create your first job by describing what you&apos;d like to accomplish.
        </Text>
      </Box>
    );
  }

  return (
    <Box className={styles.jobsContainer}>
      <Tabs 
        index={activeTab} 
        onChange={setActiveTab}
        variant="soft-rounded"
        colorScheme="gray"
        size="sm"
      >
        <TabList className={styles.tabList} borderBottom="none">
          <Tab 
            className={styles.tab}
            _selected={{ 
              bg: "rgba(255, 255, 255, 0.08)", 
              color: "gray.200",
              borderColor: "transparent"
            }}
            fontSize="sm"
            fontWeight="medium"
          >
            Current Jobs ({currentJobs.length})
          </Tab>
          <Tab 
            className={styles.tab}
            _selected={{ 
              bg: "rgba(255, 255, 255, 0.08)", 
              color: "gray.200",
              borderColor: "transparent"
            }}
            fontSize="sm"
            fontWeight="medium"
          >
            Previous Jobs ({previousJobs.length})
          </Tab>
        </TabList>

        <TabPanels className={styles.tabPanelsContainer}>
          <TabPanel p={0} h="100%">
            <Box className={styles.scrollableContent}>
              {currentJobs.length === 0 ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    No current jobs
                  </Text>
                </Box>
              ) : (
                <VStack spacing={2} width="100%" align="stretch" pb={2}>
                  {currentJobs.map((conversation) => (
                    <JobItem key={conversation.id} conversation={conversation} onClick={onJobClick} />
                  ))}
                </VStack>
              )}
            </Box>
          </TabPanel>
          
          <TabPanel p={0} pt={4} h="100%">
            <Box className={styles.scrollableContent}>
              {previousJobs.length === 0 ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    No completed jobs yet
                  </Text>
                </Box>
              ) : (
                <VStack spacing={2} width="100%" align="stretch" pb={2}>
                  {previousJobs.map((conversation) => (
                    <JobItem key={conversation.id} conversation={conversation} onClick={onJobClick} />
                  ))}
                </VStack>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};