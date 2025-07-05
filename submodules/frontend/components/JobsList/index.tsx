import React, { FC, useState } from "react";
import { Box, VStack, Text, Button, HStack, Badge, Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { ChatIcon, TimeIcon } from "@chakra-ui/icons";
import styles from "./index.module.css";

export interface Job {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Date;
  lastMessage?: string;
  messageCount: number;
}

interface JobsListProps {
  jobs: Job[];
  onJobClick: (jobId: string) => void;
  isLoading?: boolean;
}

const isCurrentJob = (job: Job) => {
  // Current jobs are those in progress or completed within the last 24 hours
  if (job.status === 'pending' || job.status === 'running') {
    return true;
  }
  
  if (job.status === 'completed') {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return new Date(job.createdAt) > oneDayAgo;
  }
  
  return false;
};

const isPreviousJob = (job: Job) => {
  // Previous jobs are completed/failed jobs older than 24 hours
  if (job.status === 'failed') {
    return true;
  }
  
  if (job.status === 'completed') {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return new Date(job.createdAt) <= oneDayAgo;
  }
  
  return false;
};

const getStatusColor = (status: Job["status"]) => {
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

const JobItem: FC<{ job: Job; onClick: (jobId: string) => void }> = ({ job, onClick }) => (
  <Button
    key={job.id}
    className={styles.jobItem}
    onClick={() => onClick(job.id)}
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
            {job.title}
          </Text>
          <Text
            fontSize="sm"
            color="gray.500"
            textAlign="left"
            noOfLines={2}
            w="100%"
          >
            {job.description}
          </Text>
        </VStack>
        <Badge colorScheme={getStatusColor(job.status)} variant="subtle" size="sm" flexShrink={0}>
          {job.status}
        </Badge>
      </HStack>
      
      <HStack justify="space-between" fontSize="xs" color="gray.600" w="100%">
        <HStack spacing={4} flexShrink={0}>
          <HStack spacing={1}>
            <ChatIcon w={3} h={3} />
            <Text>{job.messageCount} messages</Text>
          </HStack>
          <HStack spacing={1}>
            <TimeIcon w={3} h={3} />
            <Text>{formatTimeAgo(job.createdAt)}</Text>
          </HStack>
        </HStack>
      </HStack>
      
      {job.lastMessage && (
        <Text
          fontSize="xs"
          color="gray.600"
          textAlign="left"
          noOfLines={1}
          fontStyle="italic"
          w="100%"
        >
          &quot;{job.lastMessage}&quot;
        </Text>
      )}
    </VStack>
  </Button>
);

export const JobsList: FC<JobsListProps> = ({ jobs, onJobClick, isLoading }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  const currentJobs = jobs.filter(isCurrentJob);
  const previousJobs = jobs.filter(isPreviousJob);
  
  if (jobs.length === 0 && !isLoading) {
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
                  {currentJobs.map((job) => (
                    <JobItem key={job.id} job={job} onClick={onJobClick} />
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
                  {previousJobs.map((job) => (
                    <JobItem key={job.id} job={job} onClick={onJobClick} />
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