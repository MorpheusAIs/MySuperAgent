import React, { FC, useState, useEffect } from "react";
import { Box, VStack, Text, Button, HStack, Badge, Tabs, TabList, TabPanels, Tab, TabPanel, useToast } from "@chakra-ui/react";
import { ChatIcon, TimeIcon, RepeatIcon, CalendarIcon } from "@chakra-ui/icons";
import { Conversation } from "@/services/types";
import { getMessagesHistory } from "@/services/ChatManagement/storage";
import { ScheduledJob } from "@/services/ScheduledJobs/db";
import ScheduledJobsAPI from "@/services/ScheduledJobs/api";
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

const ScheduledJobItem: FC<{ job: ScheduledJob; onToggle: (jobId: number) => void }> = ({ job, onToggle }) => {
  const nextRun = new Date(job.next_run_time);
  const isOverdue = nextRun < new Date() && job.is_active;
  
  return (
    <Button
      key={job.id}
      className={styles.jobItem}
      onClick={() => onToggle(job.id)}
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
            <HStack spacing={2} w="100%">
              <RepeatIcon w={4} h={4} color="blue.400" />
              <Text
                fontSize="md"
                fontWeight="semibold"
                color="gray.200"
                textAlign="left"
                noOfLines={1}
                flex={1}
              >
                {job.job_name}
              </Text>
            </HStack>
            <Text
              fontSize="sm"
              color="gray.500"
              textAlign="left"
              noOfLines={2}
              w="100%"
            >
              {job.job_description || job.message_content.substring(0, 100) + '...'}
            </Text>
          </VStack>
          <Badge 
            colorScheme={job.is_active ? (isOverdue ? "red" : "blue") : "gray"} 
            variant="subtle" 
            size="sm" 
            flexShrink={0}
          >
            {!job.is_active ? 'inactive' : isOverdue ? 'overdue' : 'scheduled'}
          </Badge>
        </HStack>
        
        <HStack justify="space-between" fontSize="xs" color="gray.600" w="100%">
          <HStack spacing={4} flexShrink={0}>
            <HStack spacing={1}>
              <CalendarIcon w={3} h={3} />
              <Text>{ScheduledJobsAPI.formatScheduleDescription(job)}</Text>
            </HStack>
            <HStack spacing={1}>
              <TimeIcon w={3} h={3} />
              <Text>
                Next: {nextRun.toLocaleDateString()} {nextRun.toLocaleTimeString()}
              </Text>
            </HStack>
          </HStack>
        </HStack>
        
        {job.run_count > 0 && (
          <Text
            fontSize="xs"
            color="gray.600"
            textAlign="left"
            w="100%"
          >
            Executed {job.run_count} time{job.run_count !== 1 ? 's' : ''}
            {job.max_runs && ` of ${job.max_runs}`}
          </Text>
        )}
      </VStack>
    </Button>
  );
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
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [scheduledJobsLoading, setScheduledJobsLoading] = useState(false);
  const toast = useToast();

  // Load scheduled jobs
  useEffect(() => {
    const loadScheduledJobs = async () => {
      setScheduledJobsLoading(true);
      try {
        const jobs = await ScheduledJobsAPI.getScheduledJobs();
        setScheduledJobs(jobs);
      } catch (error) {
        console.error('Error loading scheduled jobs:', error);
        toast({
          title: 'Error loading scheduled jobs',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setScheduledJobsLoading(false);
      }
    };

    loadScheduledJobs();
  }, [toast]);
  
  // Filter out default conversation and conversations without user messages
  const jobConversations = conversations.filter(conv => {
    if (conv.id === "default") return false;
    const messages = getMessagesHistory(conv.id);
    const userMessages = messages.filter(m => m.role === "user");
    return userMessages.length > 0;
  });
  
  const currentJobs = jobConversations.filter(isCurrentJob);
  const previousJobs = jobConversations.filter(isPreviousJob);
  const activeScheduledJobs = scheduledJobs.filter(job => job.is_active);

  const handleScheduledJobToggle = async (jobId: number) => {
    try {
      const job = scheduledJobs.find(j => j.id === jobId);
      if (job) {
        await ScheduledJobsAPI.updateScheduledJob(jobId, { is_active: !job.is_active });
        // Refresh scheduled jobs
        const updatedJobs = await ScheduledJobsAPI.getScheduledJobs();
        setScheduledJobs(updatedJobs);
        
        toast({
          title: `Job ${job.is_active ? 'deactivated' : 'activated'}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error toggling scheduled job:', error);
      toast({
        title: 'Error updating job',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  if (jobConversations.length === 0 && activeScheduledJobs.length === 0 && !isLoading && !scheduledJobsLoading) {
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
            Scheduled Jobs ({activeScheduledJobs.length})
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
              {scheduledJobsLoading ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Loading scheduled jobs...
                  </Text>
                </Box>
              ) : activeScheduledJobs.length === 0 ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    No scheduled jobs yet
                  </Text>
                </Box>
              ) : (
                <VStack spacing={2} width="100%" align="stretch" pb={2}>
                  {activeScheduledJobs.map((job) => (
                    <ScheduledJobItem key={job.id} job={job} onToggle={handleScheduledJobToggle} />
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