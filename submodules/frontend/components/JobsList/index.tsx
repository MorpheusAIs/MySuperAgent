import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import { Box, VStack, Text, Button, HStack, Badge, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, Input, InputGroup, InputLeftElement, Select, Flex } from "@chakra-ui/react";
import { ChatIcon, TimeIcon, RepeatIcon, CalendarIcon, SearchIcon } from "@chakra-ui/icons";
import { Job } from "@/services/Database/db";
import JobsAPI from "@/services/API/jobs";
import { useWalletAddress } from "@/services/Wallet/utils";
import styles from "./index.module.css";

interface JobsListProps {
  onJobClick: (jobId: string) => void;
  isLoading?: boolean;
  refreshKey?: number;
}

const getJobStatus = (job: Job): "pending" | "running" | "completed" | "failed" => {
  return job.status;
};

const isCurrentJob = (job: Job) => {
  const status = getJobStatus(job);
  
  // Current jobs are those in progress or completed within the last 24 hours
  if (status === 'pending' || status === 'running') {
    return true;
  }
  
  if (status === 'completed') {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return new Date(job.created_at) > oneDayAgo;
  }
  
  return false;
};

const isPreviousJob = (job: Job) => {
  const status = getJobStatus(job);
  
  // Previous jobs are completed/failed jobs older than 24 hours
  if (status === 'failed') {
    return true;
  }
  
  if (status === 'completed') {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return new Date(job.created_at) <= oneDayAgo;
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

const PaginationControls: FC<{ 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  return (
    <HStack spacing={2} justify="center" mt={4}>
      <Button 
        size="xs" 
        onClick={() => onPageChange(currentPage - 1)} 
        isDisabled={currentPage === 1}
        variant="ghost"
      >
        Previous
      </Button>
      <Text fontSize="xs" color="gray.500">
        {currentPage} / {totalPages}
      </Text>
      <Button 
        size="xs" 
        onClick={() => onPageChange(currentPage + 1)} 
        isDisabled={currentPage === totalPages}
        variant="ghost"
      >
        Next
      </Button>
    </HStack>
  );
};

const ScheduledJobItem: FC<{ job: Job; onToggle: (jobId: string) => void }> = ({ job, onToggle }) => {
  const nextRun = job.next_run_time ? new Date(job.next_run_time) : null;
  const isOverdue = nextRun && nextRun < new Date() && job.is_active;
  
  const formatScheduleDescription = (job: Job): string => {
    if (!job.schedule_type) return 'Unknown';
    
    switch (job.schedule_type) {
      case 'once':
        return 'One time';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        return job.interval_days ? `Every ${job.interval_days} days` : 'Custom';
      default:
        return job.schedule_type;
    }
  };
  
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
                {job.name}
              </Text>
            </HStack>
            <Text
              fontSize="sm"
              color="gray.500"
              textAlign="left"
              noOfLines={2}
              w="100%"
            >
              {job.description || job.initial_message.substring(0, 100) + '...'}
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
              <Text>{formatScheduleDescription(job)}</Text>
            </HStack>
            {nextRun && (
              <HStack spacing={1}>
                <TimeIcon w={3} h={3} />
                <Text>
                  Next: {nextRun.toLocaleDateString()} {nextRun.toLocaleTimeString()}
                </Text>
              </HStack>
            )}
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

const JobItem: FC<{ job: Job; onClick: (jobId: string) => void; messageCount?: number }> = ({ job, onClick, messageCount = 0 }) => {
  const status = getJobStatus(job);
  
  // Get title and description from job
  const title = job.name !== "New Job" ? job.name : 
    (job.initial_message ? 
      (job.initial_message.substring(0, 50) + (job.initial_message.length > 50 ? '...' : '')) : 
      'Untitled Job');
  const description = job.description || job.initial_message || 'No description';
  
  return (
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
              <Text>{messageCount} messages</Text>
            </HStack>
            <HStack spacing={1}>
              <TimeIcon w={3} h={3} />
              <Text>{formatTimeAgo(new Date(job.created_at))}</Text>
            </HStack>
          </HStack>
        </HStack>
        
        {job.status === 'completed' && (
          <Text
            fontSize="xs"
            color="gray.600"
            textAlign="left"
            noOfLines={1}
            fontStyle="italic"
            w="100%"
          >
            &quot;Job completed successfully&quot;
          </Text>
        )}
      </VStack>
    </Button>
  );
};

export const JobsList: FC<JobsListProps> = ({ onJobClick, isLoading, refreshKey = 0 }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [scheduledJobsLoading, setScheduledJobsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [scheduledPage, setScheduledPage] = useState(1);
  const [previousPage, setPreviousPage] = useState(1);
  const { getAddress } = useWalletAddress();
  const toast = useToast();
  
  const ITEMS_PER_PAGE = 10;

  // Load jobs and scheduled jobs
  useEffect(() => {
    const loadData = async () => {
      const walletAddress = getAddress();
      if (!walletAddress) {
        // No wallet connected, reset state
        setJobs([]);
        setScheduledJobs([]);
        setJobsLoading(false);
        setScheduledJobsLoading(false);
        return;
      }
      
      // Load regular jobs
      setJobsLoading(true);
      try {
        const jobsList = await JobsAPI.getJobs(walletAddress);
        setJobs(jobsList);
      } catch (error: any) {
        console.error('Error loading jobs:', error);
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }

      // Load scheduled jobs
      setScheduledJobsLoading(true);
      try {
        const scheduledJobsList = await JobsAPI.getScheduledJobs(walletAddress);
        setScheduledJobs(scheduledJobsList);
      } catch (error: any) {
        console.error('Error loading scheduled jobs:', error);
        setScheduledJobs([]);
      } finally {
        setScheduledJobsLoading(false);
      }
    };

    loadData();
  }, [getAddress, refreshKey]); // Add refreshKey to trigger reload when jobs are created
  
  // Filter jobs based on search and status
  const filterJobs = useCallback((jobsList: Job[]) => {
    return jobsList.filter(job => {
      const matchesSearch = searchQuery === "" || 
        job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        job.initial_message.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);
  
  // Apply filters and pagination
  const allCurrentJobs = useMemo(() => filterJobs(jobs.filter(isCurrentJob)), [jobs, filterJobs]);
  const allPreviousJobs = useMemo(() => filterJobs(jobs.filter(isPreviousJob)), [jobs, filterJobs]);
  const allActiveScheduledJobs = useMemo(() => filterJobs(scheduledJobs.filter(job => job.is_active)), [scheduledJobs, filterJobs]);
  
  // Paginate results
  const paginateJobs = (jobsList: Job[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return jobsList.slice(start, end);
  };
  
  const currentJobs = paginateJobs(allCurrentJobs, currentPage);
  const previousJobs = paginateJobs(allPreviousJobs, previousPage);
  const activeScheduledJobs = paginateJobs(allActiveScheduledJobs, scheduledPage);
  
  // Calculate total pages
  const currentTotalPages = Math.ceil(allCurrentJobs.length / ITEMS_PER_PAGE);
  const previousTotalPages = Math.ceil(allPreviousJobs.length / ITEMS_PER_PAGE);
  const scheduledTotalPages = Math.ceil(allActiveScheduledJobs.length / ITEMS_PER_PAGE);

  const handleScheduledJobToggle = async (jobId: string) => {
    try {
      const walletAddress = getAddress();
      if (!walletAddress) {
        toast({
          title: 'Wallet not connected',
          description: 'Please connect your wallet to update jobs',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const job = scheduledJobs.find(j => j.id === jobId);
      if (job) {
        await JobsAPI.updateJob(jobId, { 
          wallet_address: walletAddress,
          is_active: !job.is_active 
        });
        // Refresh scheduled jobs
        const updatedJobs = await JobsAPI.getScheduledJobs(walletAddress);
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
  
  if (jobs.length === 0 && activeScheduledJobs.length === 0 && !isLoading && !scheduledJobsLoading) {
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
            Current Jobs ({allCurrentJobs.length})
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
            Scheduled Jobs ({allActiveScheduledJobs.length})
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
            Previous Jobs ({allPreviousJobs.length})
          </Tab>
        </TabList>

        <TabPanels className={styles.tabPanelsContainer}>
          <TabPanel p={0} h="100%">
            <Box className={styles.scrollableContent}>
              {allCurrentJobs.length === 0 ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {searchQuery || statusFilter !== "all" ? "No jobs match your search criteria" : "No current jobs"}
                  </Text>
                </Box>
              ) : (
                <>
                  <VStack spacing={2} width="100%" align="stretch" pb={2}>
                    {currentJobs.map((job) => (
                      <JobItem key={job.id} job={job} onClick={onJobClick} />
                    ))}
                  </VStack>
                  <PaginationControls 
                    currentPage={currentPage}
                    totalPages={currentTotalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
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
              ) : allActiveScheduledJobs.length === 0 ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {searchQuery || statusFilter !== "all" ? "No jobs match your search criteria" : "No scheduled jobs yet"}
                  </Text>
                </Box>
              ) : (
                <>
                  <VStack spacing={2} width="100%" align="stretch" pb={2}>
                    {activeScheduledJobs.map((job) => (
                      <ScheduledJobItem key={job.id} job={job} onToggle={handleScheduledJobToggle} />
                    ))}
                  </VStack>
                  <PaginationControls 
                    currentPage={scheduledPage}
                    totalPages={scheduledTotalPages}
                    onPageChange={setScheduledPage}
                  />
                </>
              )}
            </Box>
          </TabPanel>
          
          <TabPanel p={0} pt={4} h="100%">
            <Box className={styles.scrollableContent}>
              {allPreviousJobs.length === 0 ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {searchQuery || statusFilter !== "all" ? "No jobs match your search criteria" : "No completed jobs yet"}
                  </Text>
                </Box>
              ) : (
                <>
                  <VStack spacing={2} width="100%" align="stretch" pb={2}>
                    {previousJobs.map((job) => (
                      <JobItem key={job.id} job={job} onClick={onJobClick} />
                    ))}
                  </VStack>
                  <PaginationControls 
                    currentPage={previousPage}
                    totalPages={previousTotalPages}
                    onPageChange={setPreviousPage}
                  />
                </>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};