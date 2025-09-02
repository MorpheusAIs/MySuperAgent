import { ScheduledJobEditModal } from '@/components/ScheduledJobEditModal';
import JobsAPI from '@/services/api-clients/jobs';
import { Job } from '@/services/database/db';
import { trackEvent } from '@/services/analytics';
import { useWalletAddress } from '@/services/wallet/utils';
import {
  CalendarIcon,
  ChatIcon,
  CheckCircleIcon,
  DeleteIcon,
  EditIcon,
  RepeatIcon,
  SearchIcon,
  SettingsIcon,
  SmallCloseIcon,
  TimeIcon,
  TriangleUpIcon,
} from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.module.css';

interface JobsListProps {
  onJobClick: (jobId: string) => void;
  onRunScheduledJob?: (
    originalJobId: string,
    newJobId: string,
    initialMessage: string
  ) => void;
  isLoading?: boolean;
  refreshKey?: number;
}

const getJobStatus = (
  job: Job
): 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' => {
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

const getStatusColor = (
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
) => {
  switch (status) {
    case 'pending':
      return 'gray';
    case 'running':
      return 'blue';
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'cancelled':
      return 'orange';
    default:
      return 'gray';
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
    <HStack spacing={3} justify="center" className={styles.paginationControls}>
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        isDisabled={currentPage === 1}
        className={styles.paginationButton}
      >
        Previous
      </Button>
      <Text className={styles.paginationText}>
        {currentPage} / {totalPages}
      </Text>
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        isDisabled={currentPage === totalPages}
        className={styles.paginationButton}
      >
        Next
      </Button>
    </HStack>
  );
};

const ScheduledJobItem: FC<{
  job: Job;
  onToggle: (jobId: string) => void;
  onRun: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
}> = ({ job, onToggle, onRun, onEdit, onDelete }) => {
  const nextRun = job.next_run_time ? new Date(job.next_run_time) : null;
  const isOverdue = nextRun && nextRun < new Date() && job.is_active;
  const now = new Date();

  const formatScheduleDescription = (job: Job): string => {
    if (!job.schedule_type) return 'Unknown';

    switch (job.schedule_type) {
      case 'once':
        return 'One time';
      case 'hourly':
        return 'Hourly';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'custom':
        return job.interval_days ? `Every ${job.interval_days} days` : 'Custom';
      default:
        return job.schedule_type;
    }
  };

  const getTimeUntilNext = (): string => {
    if (!nextRun || !job.is_active) return '';

    const diff = nextRun.getTime() - now.getTime();
    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  return (
    <Box
      className={styles.scheduledJobItem}
      border="1px solid"
      borderColor={
        job.is_active ? (isOverdue ? 'red.400' : 'blue.400') : 'gray.600'
      }
      borderRadius="12px"
      p={4}
      bg="rgba(255, 255, 255, 0.02)"
      _hover={{ bg: 'rgba(255, 255, 255, 0.04)' }}
      transition="all 0.2s ease"
    >
      <VStack align="stretch" spacing={3} width="100%">
        {/* Header Row */}
        <HStack justify="space-between" align="flex-start" spacing={3}>
          <VStack align="flex-start" spacing={1} flex={1} minW={0}>
            <HStack spacing={2} w="100%">
              <RepeatIcon
                w={4}
                h={4}
                color={job.is_active ? 'blue.400' : 'gray.500'}
              />
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
              {job.description || job.initial_message.substring(0, 120) + '...'}
            </Text>
          </VStack>

          {/* Status Badge */}
          <Badge
            colorScheme={job.is_active ? (isOverdue ? 'red' : 'blue') : 'gray'}
            variant="subtle"
            size="sm"
            flexShrink={0}
          >
            {!job.is_active ? 'inactive' : isOverdue ? 'overdue' : 'active'}
          </Badge>
        </HStack>

        <Divider borderColor="rgba(255, 255, 255, 0.1)" />

        {/* Schedule Details */}
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between" fontSize="sm">
            <HStack spacing={2} color="gray.400">
              <CalendarIcon w={3} h={3} />
              <Text fontWeight="medium">{formatScheduleDescription(job)}</Text>
            </HStack>
            {job.run_count > 0 && (
              <Text fontSize="xs" color="gray.500">
                Executed {job.run_count}
                {job.max_runs ? `/${job.max_runs}` : ''} times
              </Text>
            )}
          </HStack>

          {nextRun && job.is_active && (
            <HStack justify="space-between" fontSize="sm">
              <HStack spacing={2} color="gray.400">
                <TimeIcon w={3} h={3} />
                <Text>
                  Next run: {nextRun.toLocaleDateString()} at{' '}
                  {nextRun.toLocaleTimeString()}
                </Text>
              </HStack>
              <Text
                fontSize="xs"
                color={isOverdue ? 'red.400' : 'blue.400'}
                fontWeight="medium"
              >
                {getTimeUntilNext()}
              </Text>
            </HStack>
          )}

          {job.last_run_at && (
            <HStack spacing={2} fontSize="xs" color="gray.600">
              <Text>
                Last run: {new Date(job.last_run_at).toLocaleDateString()} at{' '}
                {new Date(job.last_run_at).toLocaleTimeString()}
              </Text>
            </HStack>
          )}
        </VStack>

        <Divider borderColor="rgba(255, 255, 255, 0.1)" />

        {/* Action buttons bar - always visible for scheduled jobs */}
        <Box
          borderTop="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
          bg="rgba(255, 255, 255, 0.02)"
          px={0}
          py={3}
        >
          <HStack justify="space-between" align="center">
            <Text fontSize="xs" color="gray.500" fontWeight="medium">
              Actions
            </Text>
            <HStack spacing={1}>
              {job.is_active && (
                <Tooltip label="Run now" placement="top">
                  <IconButton
                    aria-label="Run job now"
                    icon={<TriangleUpIcon w={3} h={3} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="green"
                    _hover={{
                      bg: 'rgba(34, 197, 94, 0.1)',
                      transform: 'scale(1.1)',
                    }}
                    _active={{
                      bg: 'rgba(34, 197, 94, 0.2)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRun(job.id);
                    }}
                  />
                </Tooltip>
              )}

              {onEdit && (
                <Tooltip label="Edit schedule" placement="top">
                  <IconButton
                    aria-label="Edit schedule"
                    icon={<SettingsIcon w={3} h={3} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    _hover={{
                      bg: 'rgba(59, 130, 246, 0.1)',
                      transform: 'scale(1.1)',
                    }}
                    _active={{
                      bg: 'rgba(59, 130, 246, 0.2)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(job.id);
                    }}
                  />
                </Tooltip>
              )}

              <Tooltip
                label={job.is_active ? 'Deactivate' : 'Activate'}
                placement="top"
              >
                <IconButton
                  aria-label={job.is_active ? 'Deactivate job' : 'Activate job'}
                  icon={
                    job.is_active ? (
                      <SmallCloseIcon w={3} h={3} />
                    ) : (
                      <CheckCircleIcon w={3} h={3} />
                    )
                  }
                  size="xs"
                  variant="ghost"
                  colorScheme={job.is_active ? 'orange' : 'green'}
                  _hover={{
                    bg: job.is_active
                      ? 'rgba(249, 115, 22, 0.1)'
                      : 'rgba(34, 197, 94, 0.1)',
                    transform: 'scale(1.1)',
                  }}
                  _active={{
                    bg: job.is_active
                      ? 'rgba(249, 115, 22, 0.2)'
                      : 'rgba(34, 197, 94, 0.2)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(job.id);
                  }}
                />
              </Tooltip>

              {onDelete && (
                <Tooltip label="Delete job permanently" placement="top">
                  <IconButton
                    aria-label="Delete job"
                    icon={<DeleteIcon w={3} h={3} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    _hover={{
                      bg: 'rgba(239, 68, 68, 0.1)',
                      transform: 'scale(1.1)',
                    }}
                    _active={{
                      bg: 'rgba(239, 68, 68, 0.2)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(job.id);
                    }}
                  />
                </Tooltip>
              )}
            </HStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

const JobItem: FC<{
  job: Job;
  onClick: (jobId: string) => void;
  messageCount?: number;
  onDelete?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
}> = ({ job, onClick, messageCount = 0, onDelete, onEdit }) => {
  const status = getJobStatus(job);

  // Get title and description from job
  const title =
    job.name !== 'New Job'
      ? job.name
      : job.initial_message
        ? job.initial_message.substring(0, 50) +
          (job.initial_message.length > 50 ? '...' : '')
        : 'Untitled Job';
  const description =
    job.description || job.initial_message || 'No description';

  return (
    <Box
      key={job.id}
      className={styles.jobItem}
      p={0}
      borderRadius="lg"
      w="100%"
      overflow="hidden"
      position="relative"
      role="group"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      bg="rgba(255, 255, 255, 0.01)"
      _hover={{
        bg: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        '& .job-actions': { opacity: 1 },
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
      transition="all 0.2s ease"
    >
      {/* Main clickable area */}
      <Box
        cursor="pointer"
        p={4}
        pb={3}
        onClick={() => {
          trackEvent('job.clicked', {
            jobId: job.id,
            jobName: job.name,
            jobStatus: job.status,
            isScheduled: !!job.schedule_type
          });
          onClick(job.id);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            trackEvent('job.clicked', {
              jobId: job.id,
              jobName: job.name,
              jobStatus: job.status,
              isScheduled: !!job.schedule_type,
              inputMethod: 'keyboard'
            });
            onClick(job.id);
          }
        }}
      >
        <VStack align="stretch" spacing={3} width="100%">
          {/* Header with title and status */}
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

            <Badge
              colorScheme={getStatusColor(status)}
              variant="subtle"
              size="sm"
              flexShrink={0}
            >
              {status}
            </Badge>
          </HStack>

          {/* Metadata row */}
          <HStack
            justify="space-between"
            fontSize="xs"
            color="gray.600"
            w="100%"
          >
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
      </Box>

      {/* Action buttons bar - appears on hover */}
      <Box
        className="job-actions"
        opacity={0}
        borderTop="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
        bg="rgba(255, 255, 255, 0.02)"
        px={4}
        py={2}
        transition="all 0.2s ease"
      >
        <HStack justify="space-between" align="center">
          <Text fontSize="xs" color="gray.500" fontWeight="medium">
            Quick Actions
          </Text>
          <HStack spacing={1}>
            {onEdit && (
              <Tooltip label="Edit job name" placement="top">
                <IconButton
                  aria-label="Edit job"
                  icon={<EditIcon w={3} h={3} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  _hover={{
                    bg: 'rgba(59, 130, 246, 0.1)',
                    transform: 'scale(1.1)',
                  }}
                  _active={{
                    bg: 'rgba(59, 130, 246, 0.2)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(job.id);
                  }}
                />
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip label="Delete job permanently" placement="top">
                <IconButton
                  aria-label="Delete job"
                  icon={<DeleteIcon w={3} h={3} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  _hover={{
                    bg: 'rgba(239, 68, 68, 0.1)',
                    transform: 'scale(1.1)',
                  }}
                  _active={{
                    bg: 'rgba(239, 68, 68, 0.2)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(job.id);
                  }}
                />
              </Tooltip>
            )}
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export const JobsList: FC<JobsListProps> = ({
  onJobClick,
  onRunScheduledJob,
  isLoading,
  refreshKey = 0,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [scheduledJobsLoading, setScheduledJobsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [scheduledPage, setScheduledPage] = useState(1);
  const [previousPage, setPreviousPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  const ITEMS_PER_PAGE = 10;

  // Load localStorage conversations when no wallet is connected
  const loadLocalStorageConversations = useCallback(async () => {
    setJobsLoading(true);
    setScheduledJobsLoading(false);

    try {
      const { getStorageData } = await import('@/services/local-storage/core');
      const data = getStorageData();

      // Convert localStorage conversations to Job-like objects
      const localJobs: Job[] = Object.entries(data.conversations).map(
        ([id, conversation]) => ({
          id,
          name: conversation.name,
          description: '',
          initial_message:
            conversation.messages?.[0]?.content || 'No messages yet',
          status: 'completed' as const,
          created_at: new Date(conversation.createdAt || Date.now()),
          updated_at: new Date(conversation.createdAt || Date.now()),
          completed_at: new Date(conversation.createdAt || Date.now()),
          is_scheduled: false,
          has_uploaded_file: conversation.hasUploadedFile || false,
          wallet_address: '',
          run_count: 0,
          is_active: true,
          schedule_type: null,
          schedule_time: null,
          next_run_time: null,
          interval_days: null,
          max_runs: null,
          weekly_days: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          last_run_at: null,
        })
      );

      setJobs(localJobs);
      setScheduledJobs([]);
    } catch (error: any) {
      console.error('Error loading localStorage conversations:', error);
      setJobs([]);
      setScheduledJobs([]);
    } finally {
      setJobsLoading(false);
      setScheduledJobsLoading(false);
    }
  }, []);

  // Load jobs and scheduled jobs
  const loadAllData = useCallback(async () => {
    const walletAddress = getAddress();
    if (!walletAddress) {
      // No wallet connected, load localStorage conversations
      await loadLocalStorageConversations();
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
  }, [getAddress, loadLocalStorageConversations]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, refreshKey]); // Add refreshKey to trigger reload when jobs are created

  // Filter jobs based on search, status, and time
  const filterJobs = useCallback(
    (jobsList: Job[]) => {
      const now = new Date();

      return jobsList.filter((job) => {
        const matchesSearch =
          searchQuery === '' ||
          job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (job.description &&
            job.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          job.initial_message.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' || job.status === statusFilter;

        const jobDate = new Date(job.created_at);
        let matchesTime = true;

        if (timeFilter !== 'all') {
          const dayInMs = 24 * 60 * 60 * 1000;
          const diffTime = now.getTime() - jobDate.getTime();

          switch (timeFilter) {
            case 'today':
              matchesTime =
                diffTime < dayInMs &&
                jobDate.toDateString() === now.toDateString();
              break;
            case 'yesterday':
              const yesterday = new Date(now.getTime() - dayInMs);
              matchesTime = jobDate.toDateString() === yesterday.toDateString();
              break;
            case 'week':
              matchesTime = diffTime < 7 * dayInMs;
              break;
            case 'month':
              matchesTime = diffTime < 30 * dayInMs;
              break;
            case 'older':
              matchesTime = diffTime >= 30 * dayInMs;
              break;
          }
        }

        return matchesSearch && matchesStatus && matchesTime;
      });
    },
    [searchQuery, statusFilter, timeFilter]
  );

  // Apply filters and pagination
  const allCurrentJobs = useMemo(
    () => filterJobs(jobs.filter(isCurrentJob)),
    [jobs, filterJobs]
  );
  const allPreviousJobs = useMemo(
    () => filterJobs(jobs.filter(isPreviousJob)),
    [jobs, filterJobs]
  );
  const allActiveScheduledJobs = useMemo(
    () => filterJobs(scheduledJobs.filter((job) => job.is_active)),
    [scheduledJobs, filterJobs]
  );

  // Paginate results
  const paginateJobs = (jobsList: Job[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return jobsList.slice(start, end);
  };

  const currentJobs = paginateJobs(allCurrentJobs, currentPage);
  const previousJobs = paginateJobs(allPreviousJobs, previousPage);
  const activeScheduledJobs = paginateJobs(
    allActiveScheduledJobs,
    scheduledPage
  );

  // Calculate total pages
  const currentTotalPages = Math.ceil(allCurrentJobs.length / ITEMS_PER_PAGE);
  const previousTotalPages = Math.ceil(allPreviousJobs.length / ITEMS_PER_PAGE);
  const scheduledTotalPages = Math.ceil(
    allActiveScheduledJobs.length / ITEMS_PER_PAGE
  );

  const handleScheduledJobToggle = useCallback(
    async (jobId: string) => {
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

        const job = scheduledJobs.find((j) => j.id === jobId);
        if (job) {
          const action = job.is_active ? 'deactivate' : 'activate';
          
          // Track analytics before the action
          trackEvent('job.scheduled_toggle', {
            jobId,
            action,
            jobName: job.name,
            scheduleType: job.schedule_type || undefined,
            wallet: walletAddress
          });

          await JobsAPI.updateJob(jobId, {
            wallet_address: walletAddress,
            is_active: !job.is_active,
          });
          // Refresh all data
          await loadAllData();

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
    },
    [getAddress, loadAllData, scheduledJobs, toast]
  );

  const handleRunJob = useCallback(
    async (jobId: string) => {
      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          toast({
            title: 'Wallet not connected',
            description: 'Please connect your wallet to run jobs',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const job = scheduledJobs.find((j) => j.id === jobId);
        
        // Track analytics before running the job
        trackEvent('job.scheduled_run', {
          jobId,
          jobName: job?.name,
          scheduleType: job?.schedule_type || undefined,
          wallet: walletAddress
        });

        const { newJob, scheduledJob } = await JobsAPI.runJob(
          walletAddress,
          jobId
        );

        // Refresh all data
        await loadAllData();

        // If parent provided a callback to handle running, call it
        if (onRunScheduledJob) {
          onRunScheduledJob(jobId, newJob.id, newJob.initial_message);
        }

        toast({
          title: 'Job executed successfully',
          description: `Created new job instance: ${newJob.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error running scheduled job:', error);
        toast({
          title: 'Error running job',
          description:
            error instanceof Error ? error.message : 'Failed to run job',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [getAddress, loadAllData, onRunScheduledJob, toast]
  );

  const handleEditSchedule = useCallback(
    async (jobId: string) => {
      // Find the job to edit
      const job = scheduledJobs.find((j) => j.id === jobId);
      if (!job) {
        toast({
          title: 'Job not found',
          description: 'Could not find the scheduled job to edit',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Open the edit modal with the selected job
      setJobToEdit(job);
      setIsEditModalOpen(true);
    },
    [scheduledJobs, toast]
  );

  const handleDeleteJob = useCallback(
    async (jobId: string) => {
      // Find the job to get details for analytics
      const job = jobs.find((j) => j.id === jobId) || scheduledJobs.find((j) => j.id === jobId);
      
      // Show confirmation dialog
      const confirmed = window.confirm(
        'Are you sure you want to delete this job? This action cannot be undone and will permanently remove the job and all its messages.'
      );

      if (!confirmed) {
        // Track cancellation
        trackEvent('job.delete_cancelled', {
          jobId,
          jobName: job?.name,
          jobStatus: job?.status
        });
        return;
      }

      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          toast({
            title: 'Wallet not connected',
            description: 'Please connect your wallet to delete jobs',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Track deletion attempt
        trackEvent('job.deleted', {
          jobId,
          jobName: job?.name,
          jobStatus: job?.status,
          isScheduled: !!job?.schedule_type,
          wallet: walletAddress
        });

        await JobsAPI.deleteJob(walletAddress, jobId);

        // Refresh all data
        await loadAllData();

        toast({
          title: 'Job deleted successfully',
          description: 'The job and all its messages have been removed',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error deleting job:', error);
        toast({
          title: 'Error deleting job',
          description:
            error instanceof Error ? error.message : 'Failed to delete job',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [getAddress, loadAllData, toast, jobs, scheduledJobs]
  );

  const handleEditJob = useCallback(
    async (jobId: string) => {
      // Find the job to edit
      const job = jobs.find((j) => j.id === jobId);
      if (!job) {
        toast({
          title: 'Job not found',
          description: 'Could not find the job to edit',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Simple inline edit for job name
      const newName = window.prompt('Enter new job name:', job.name);
      if (newName && newName.trim() !== '' && newName !== job.name) {
        try {
          const walletAddress = getAddress();
          if (!walletAddress) {
            toast({
              title: 'Wallet not connected',
              description: 'Please connect your wallet to edit jobs',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            });
            return;
          }

          await JobsAPI.updateJob(jobId, {
            wallet_address: walletAddress,
            name: newName.trim(),
          });

          // Refresh all data
          await loadAllData();

          toast({
            title: 'Job updated successfully',
            description: `Job renamed to "${newName.trim()}"`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error updating job:', error);
          toast({
            title: 'Error updating job',
            description:
              error instanceof Error ? error.message : 'Failed to update job',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    },
    [jobs, getAddress, loadAllData, toast]
  );

  if (
    jobs.length === 0 &&
    activeScheduledJobs.length === 0 &&
    !isLoading &&
    !scheduledJobsLoading
  ) {
    return (
      <Box className={styles.emptyState}>
        <Text fontSize="md" color="gray.500" textAlign="center">
          No jobs yet. Create your first job by describing what you&apos;d like
          to accomplish.
        </Text>
      </Box>
    );
  }

  return (
    <Box className={styles.jobsContainer}>
      {/* Search and Filter Controls */}
      <Box className={styles.searchFilterContainer}>
        <InputGroup size="sm" flex={1}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => {
              const query = e.target.value;
              setSearchQuery(query);
              // Reset pages when searching
              setCurrentPage(1);
              setScheduledPage(1);
              setPreviousPage(1);
              
              // Track search analytics
              if (query.length > 0) {
                trackEvent('job.search', {
                  searchQuery: query,
                  searchLength: query.length
                });
              }
            }}
            className={styles.searchInput}
          />
        </InputGroup>
        <Select
          size="sm"
          value={statusFilter}
          onChange={(e) => {
            const newFilter = e.target.value;
            setStatusFilter(newFilter);
            // Reset pages when filtering
            setCurrentPage(1);
            setScheduledPage(1);
            setPreviousPage(1);
            
            // Track filter analytics
            trackEvent('job.filter_changed', {
              filterType: 'status',
              filterValue: newFilter,
              previousValue: statusFilter
            });
          }}
          width="120px"
          className={styles.statusFilter}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </Select>
        <Select
          size="sm"
          value={timeFilter}
          onChange={(e) => {
            const newFilter = e.target.value;
            setTimeFilter(newFilter);
            // Reset pages when filtering
            setCurrentPage(1);
            setScheduledPage(1);
            setPreviousPage(1);
            
            // Track filter analytics
            trackEvent('job.filter_changed', {
              filterType: 'time',
              filterValue: newFilter,
              previousValue: timeFilter
            });
          }}
          width="120px"
          className={styles.timeFilter}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
          <option value="older">Older</option>
        </Select>
      </Box>

      <Tabs
        index={activeTab}
        onChange={(index) => {
          const tabNames = ['scheduled', 'current', 'previous'];
          trackEvent('job.tab_changed', {
            fromTab: tabNames[activeTab],
            toTab: tabNames[index],
            tabIndex: index
          });
          setActiveTab(index);
        }}
        variant="soft-rounded"
        colorScheme="gray"
        size="sm"
      >
        <TabList className={styles.tabList} borderBottom="none">
          <Tab
            className={styles.tab}
            _selected={{
              bg: 'rgba(255, 255, 255, 0.08)',
              color: 'gray.200',
              borderColor: 'transparent',
            }}
            fontSize="sm"
            fontWeight="medium"
          >
            Scheduled Jobs ({allActiveScheduledJobs.length})
          </Tab>
          <Tab
            className={styles.tab}
            _selected={{
              bg: 'rgba(255, 255, 255, 0.08)',
              color: 'gray.200',
              borderColor: 'transparent',
            }}
            fontSize="sm"
            fontWeight="medium"
          >
            Current Jobs ({allCurrentJobs.length})
          </Tab>
          <Tab
            className={styles.tab}
            _selected={{
              bg: 'rgba(255, 255, 255, 0.08)',
              color: 'gray.200',
              borderColor: 'transparent',
            }}
            fontSize="sm"
            fontWeight="medium"
          >
            Previous Jobs ({allPreviousJobs.length})
          </Tab>
        </TabList>

        <TabPanels className={styles.tabPanelsContainer}>
          {/* First TabPanel: Scheduled Jobs */}
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
                    {searchQuery || statusFilter !== 'all'
                      ? 'No jobs match your search criteria'
                      : 'No scheduled jobs yet'}
                  </Text>
                </Box>
              ) : (
                <>
                  <VStack spacing={2} width="100%" align="stretch" pb={2}>
                    {activeScheduledJobs.map((job) => (
                      <ScheduledJobItem
                        key={job.id}
                        job={job}
                        onToggle={handleScheduledJobToggle}
                        onRun={handleRunJob}
                        onEdit={handleEditSchedule}
                        onDelete={handleDeleteJob}
                      />
                    ))}
                  </VStack>
                  <PaginationControls
                    currentPage={scheduledPage}
                    totalPages={scheduledTotalPages}
                    onPageChange={(page) => {
                      trackEvent('job.pagination', {
                        fromPage: scheduledPage,
                        toPage: page,
                        section: 'scheduled'
                      });
                      setScheduledPage(page);
                    }}
                  />
                </>
              )}
            </Box>
          </TabPanel>

          {/* Second TabPanel: Current Jobs */}
          <TabPanel p={0} h="100%">
            <Box className={styles.scrollableContent}>
              {allCurrentJobs.length === 0 ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No jobs match your search criteria'
                      : 'No current jobs'}
                  </Text>
                </Box>
              ) : (
                <>
                  <VStack spacing={2} width="100%" align="stretch" pb={2}>
                    {currentJobs.map((job) => (
                      <JobItem
                        key={job.id}
                        job={job}
                        onClick={onJobClick}
                        onDelete={handleDeleteJob}
                        onEdit={handleEditJob}
                      />
                    ))}
                  </VStack>
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={currentTotalPages}
                    onPageChange={(page) => {
                      trackEvent('job.pagination', {
                        fromPage: currentPage,
                        toPage: page,
                        section: 'current'
                      });
                      setCurrentPage(page);
                    }}
                  />
                </>
              )}
            </Box>
          </TabPanel>

          {/* Third TabPanel: Previous Jobs */}
          <TabPanel p={0} pt={4} h="100%">
            <Box className={styles.scrollableContent}>
              {allPreviousJobs.length === 0 ? (
                <Box className={styles.emptyTabState}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No jobs match your search criteria'
                      : 'No completed jobs yet'}
                  </Text>
                </Box>
              ) : (
                <>
                  <VStack spacing={2} width="100%" align="stretch" pb={2}>
                    {previousJobs.map((job) => (
                      <JobItem
                        key={job.id}
                        job={job}
                        onClick={onJobClick}
                        onDelete={handleDeleteJob}
                        onEdit={handleEditJob}
                      />
                    ))}
                  </VStack>
                  <PaginationControls
                    currentPage={previousPage}
                    totalPages={previousTotalPages}
                    onPageChange={(page) => {
                      trackEvent('job.pagination', {
                        fromPage: previousPage,
                        toPage: page,
                        section: 'previous'
                      });
                      setPreviousPage(page);
                    }}
                  />
                </>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Schedule Edit Modal */}
      <ScheduledJobEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setJobToEdit(null);
        }}
        job={jobToEdit}
        onJobUpdated={() => {
          setIsEditModalOpen(false);
          setJobToEdit(null);
          loadAllData(); // Reload jobs after update
        }}
      />
    </Box>
  );
};
