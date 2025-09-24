import ShareJobModal from '@/components/ShareJobModal';
import { useGlobalSearch } from '@/contexts/GlobalSearchProvider';
import { trackEvent } from '@/services/analytics';
import JobsAPI from '@/services/api-clients/jobs';
import { Job } from '@/services/database/db';
import { useWalletAddress } from '@/services/wallet/utils';
import {
  CalendarIcon,
  ChatIcon,
  CheckCircleIcon,
  DeleteIcon,
  EditIcon,
  ExternalLinkIcon,
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
  Collapse,
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
import { JobHoverPreview } from './JobHoverPreview';

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
  // Scheduled jobs should never appear in current jobs
  if (job.is_scheduled) {
    return false;
  }

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
  // Scheduled jobs should never appear in previous jobs
  if (job.is_scheduled) {
    return false;
  }

  const status = getJobStatus(job);

  // Previous jobs are completed/failed jobs older than 24 hours
  if (status === 'failed') {
    return true;
  }

  if (status === 'completed') {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return new Date(job.created_at) <= twentyFourHoursAgo;
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
    <div className={styles.paginationControls}>
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
    </div>
  );
};

const ScheduledJobItem: FC<{
  job: Job;
  onToggle: (jobId: string) => void;
  onRun: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  isEditing?: boolean;
  onJobUpdated?: () => void;
  onHover?: (jobId: string, position: { x: number; y: number }) => void;
  onHoverEnd?: () => void;
  jobOutputs?: string;
  outputsLoading?: boolean;
  isLoading?: boolean;
}> = ({
  job,
  onToggle,
  onRun,
  onEdit,
  onDelete,
  isEditing = false,
  onJobUpdated,
  onHover,
  onHoverEnd,
  jobOutputs,
  outputsLoading = false,
  isLoading = false,
}) => {
  const [editJobName, setEditJobName] = useState('');
  const [editScheduleType, setEditScheduleType] = useState<
    'once' | 'daily' | 'weekly' | 'custom'
  >('daily');
  const [editScheduleTime, setEditScheduleTime] = useState('09:00');
  const [editScheduleDate, setEditScheduleDate] = useState('');
  const [editIntervalDays, setEditIntervalDays] = useState(1);
  const [editMaxRuns, setEditMaxRuns] = useState<number | null>(null);
  const [editSelectedDays, setEditSelectedDays] = useState<number[]>([1]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  const daysOfWeek = [
    { id: 0, label: 'Mon', short: 'M' },
    { id: 1, label: 'Tue', short: 'T' },
    { id: 2, label: 'Wed', short: 'W' },
    { id: 3, label: 'Thu', short: 'T' },
    { id: 4, label: 'Fri', short: 'F' },
    { id: 5, label: 'Sat', short: 'S' },
    { id: 6, label: 'Sun', short: 'S' },
  ];

  // Load job data when editing starts
  useEffect(() => {
    if (isEditing && job) {
      setEditJobName(job.name);

      // Set schedule type
      if (job.schedule_type) {
        if (job.schedule_type === 'hourly') {
          setEditScheduleType('custom');
          setEditIntervalDays(1);
        } else {
          setEditScheduleType(
            job.schedule_type as 'once' | 'daily' | 'weekly' | 'custom'
          );
        }
      }

      // Parse schedule time
      if (job.schedule_time) {
        const scheduleDateTime = new Date(job.schedule_time);
        const year = scheduleDateTime.getFullYear();
        const month = String(scheduleDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(scheduleDateTime.getDate()).padStart(2, '0');
        setEditScheduleDate(`${year}-${month}-${day}`);

        const hours = String(scheduleDateTime.getHours()).padStart(2, '0');
        const minutes = String(scheduleDateTime.getMinutes()).padStart(2, '0');
        setEditScheduleTime(`${hours}:${minutes}`);
      }

      // Parse other fields
      if (job.interval_days) {
        setEditIntervalDays(job.interval_days);
      }

      if (job.max_runs) {
        setEditMaxRuns(job.max_runs);
      }

      // Parse weekly days
      if (job.weekly_days) {
        const days = job.weekly_days.split(',').map(Number);
        setEditSelectedDays(days);
      }
    }
  }, [isEditing, job]);

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

  const handleSaveEdit = async () => {
    if (!editJobName.trim()) {
      toast({
        title: 'Job name required',
        description: 'Please enter a name for this job',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (
      editScheduleType === 'once' &&
      (!editScheduleDate || !editScheduleTime)
    ) {
      toast({
        title: 'Date and time required',
        description: 'Please select both date and time for one-time jobs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const walletAddress = getAddress();
      if (!walletAddress) {
        throw new Error('Wallet address not found');
      }

      // Create schedule datetime
      let scheduleDateTime;
      if (editScheduleType === 'once') {
        scheduleDateTime = new Date(`${editScheduleDate}T${editScheduleTime}`);
      } else {
        scheduleDateTime = new Date();
        const [hours, minutes] = editScheduleTime.split(':');
        scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If time has passed today, schedule for tomorrow
        const now = new Date();
        if (scheduleDateTime <= now) {
          scheduleDateTime.setDate(scheduleDateTime.getDate() + 1);
        }
      }

      const nextRunTime = JobsAPI.calculateNextRunTime(
        editScheduleType,
        scheduleDateTime,
        editScheduleType === 'custom' ? editIntervalDays : undefined
      );

      // Update the job
      await JobsAPI.updateJob(job.id, {
        wallet_address: walletAddress,
        name: editJobName,
        schedule_type: editScheduleType,
        schedule_time: scheduleDateTime,
        next_run_time: nextRunTime,
        interval_days: editScheduleType === 'custom' ? editIntervalDays : null,
        max_runs: editMaxRuns,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekly_days:
          editScheduleType === 'weekly' ? editSelectedDays.join(',') : null,
        is_active: true,
      });

      toast({
        title: 'Schedule updated! 🎉',
        description: `"${editJobName}" has been updated successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onJobUpdated?.();
    } catch (error: any) {
      console.error('Error updating scheduled job:', error);
      toast({
        title: 'Error updating job',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEditDay = (dayIndex: number) => {
    setEditSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onHover?.(job.id, {
          x: rect.right,
          y: rect.top,
        });
      }}
      onMouseLeave={() => {
        onHoverEnd?.();
      }}
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
              {jobOutputs
                ? jobOutputs
                : isLoading
                ? 'Loading job output...'
                : job.description ||
                  job.initial_message.substring(0, 120) + '...'}
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
                    colorScheme={isEditing ? 'green' : 'blue'}
                    bg={isEditing ? 'rgba(34, 197, 94, 0.1)' : undefined}
                    _hover={{
                      bg: isEditing
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(59, 130, 246, 0.1)',
                      transform: 'scale(1.1)',
                    }}
                    _active={{
                      bg: isEditing
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(59, 130, 246, 0.2)',
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

        {/* Expandable Editing Interface */}
        <Collapse in={isEditing}>
          <Box
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="8px"
            p={4}
            mt={3}
            bg="rgba(255, 255, 255, 0.03)"
          >
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" fontWeight="600" color="white" mb={2}>
                Edit Schedule
              </Text>

              {/* Job Name */}
              <HStack spacing={3} align="center">
                <Text fontSize="sm" fontWeight="500" color="white" minW="80px">
                  Name
                </Text>
                <Input
                  value={editJobName}
                  onChange={(e) => setEditJobName(e.target.value)}
                  placeholder="Job name"
                  size="sm"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  fontSize="12px"
                  _focus={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.3)',
                  }}
                  flex={1}
                />
              </HStack>

              {/* Schedule Type */}
              <HStack spacing={3} align="center">
                <Text fontSize="sm" fontWeight="500" color="white" minW="80px">
                  Repeat
                </Text>
                <Select
                  value={editScheduleType}
                  onChange={(e) => setEditScheduleType(e.target.value as any)}
                  size="sm"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  fontSize="12px"
                  _focus={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.3)',
                  }}
                  flex={1}
                >
                  <option
                    value="once"
                    style={{ background: '#27292c', color: 'white' }}
                  >
                    Once
                  </option>
                  <option
                    value="daily"
                    style={{ background: '#27292c', color: 'white' }}
                  >
                    Daily
                  </option>
                  <option
                    value="weekly"
                    style={{ background: '#27292c', color: 'white' }}
                  >
                    Weekly
                  </option>
                  <option
                    value="custom"
                    style={{ background: '#27292c', color: 'white' }}
                  >
                    Custom
                  </option>
                </Select>
              </HStack>

              {/* Time Input for daily, weekly, custom */}
              {(editScheduleType === 'daily' ||
                editScheduleType === 'weekly' ||
                editScheduleType === 'custom') && (
                <HStack spacing={3} align="center">
                  <Text
                    fontSize="sm"
                    fontWeight="500"
                    color="white"
                    minW="80px"
                  >
                    Time
                  </Text>
                  <Input
                    type="time"
                    value={editScheduleTime}
                    onChange={(e) => setEditScheduleTime(e.target.value)}
                    size="sm"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    fontSize="12px"
                    _focus={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.3)',
                    }}
                    flex={1}
                  />
                </HStack>
              )}

              {/* Date and Time for 'once' */}
              {editScheduleType === 'once' && (
                <HStack spacing={3} align="center">
                  <Text
                    fontSize="sm"
                    fontWeight="500"
                    color="white"
                    minW="80px"
                  >
                    When
                  </Text>
                  <HStack spacing={2} flex={1}>
                    <Input
                      type="date"
                      value={editScheduleDate}
                      onChange={(e) => setEditScheduleDate(e.target.value)}
                      min={getMinDateTime()}
                      size="sm"
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      color="white"
                      fontSize="12px"
                      _focus={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.3)',
                      }}
                      flex={1}
                    />
                    <Input
                      type="time"
                      value={editScheduleTime}
                      onChange={(e) => setEditScheduleTime(e.target.value)}
                      size="sm"
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      color="white"
                      fontSize="12px"
                      _focus={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.3)',
                      }}
                      flex={1}
                    />
                  </HStack>
                </HStack>
              )}

              {/* Days for weekly */}
              {editScheduleType === 'weekly' && (
                <HStack spacing={3} align="center">
                  <Text
                    fontSize="sm"
                    fontWeight="500"
                    color="white"
                    minW="80px"
                  >
                    Days
                  </Text>
                  <HStack spacing={1} flex={1}>
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: editSelectedDays.includes(day.id)
                            ? '#48BB78'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${
                            editSelectedDays.includes(day.id)
                              ? '#48BB78'
                              : 'rgba(255, 255, 255, 0.1)'
                          }`,
                          color: editSelectedDays.includes(day.id)
                            ? 'white'
                            : 'rgba(255, 255, 255, 0.7)',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onClick={() => toggleEditDay(day.id)}
                      >
                        {day.short}
                      </button>
                    ))}
                  </HStack>
                </HStack>
              )}

              {/* Interval for custom */}
              {editScheduleType === 'custom' && (
                <HStack spacing={3} align="center">
                  <Text
                    fontSize="sm"
                    fontWeight="500"
                    color="white"
                    minW="80px"
                  >
                    Every
                  </Text>
                  <HStack spacing={2} flex={1}>
                    <Input
                      type="number"
                      value={editIntervalDays}
                      onChange={(e) =>
                        setEditIntervalDays(parseInt(e.target.value) || 1)
                      }
                      min={1}
                      max={365}
                      size="sm"
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      color="white"
                      fontSize="12px"
                      _focus={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.3)',
                      }}
                      w="80px"
                    />
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
                      days
                    </Text>
                  </HStack>
                </HStack>
              )}

              {/* Action Buttons */}
              <HStack spacing={2} justify="flex-end" pt={2}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(job.id)}
                  color="rgba(255, 255, 255, 0.7)"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                  fontSize="12px"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  isLoading={isSubmitting}
                  bg="#48BB78"
                  color="white"
                  _hover={{ bg: '#38A169' }}
                  _active={{ bg: '#2F855A' }}
                  fontSize="12px"
                >
                  Save Changes
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Collapse>
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
  onShare?: (jobId: string) => void;
  onHover?: (jobId: string, position: { x: number; y: number }) => void;
  onHoverEnd?: () => void;
  jobOutputs?: string;
  outputsLoading?: boolean;
  isLoading?: boolean;
}> = ({
  job,
  onClick,
  messageCount = 0,
  onDelete,
  onEdit,
  onShare,
  onHover,
  onHoverEnd,
  jobOutputs,
  outputsLoading = false,
  isLoading = false,
}) => {
  const status = getJobStatus(job);

  // Get title and description from job
  const title =
    job.name !== 'New Job'
      ? job.name
      : job.initial_message
      ? job.initial_message.substring(0, 50) +
        (job.initial_message.length > 50 ? '...' : '')
      : 'Untitled Job';

  // Show job outputs as main content, fallback to description or initial message
  const description = jobOutputs
    ? jobOutputs
    : isLoading
    ? 'Loading job output...'
    : job.description || job.initial_message || 'No description';

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
            isScheduled: !!job.schedule_type,
          });
          onClick(job.id);
        }}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onHover?.(job.id, {
            x: rect.right,
            y: rect.top,
          });
        }}
        onMouseLeave={() => {
          onHoverEnd?.();
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
              inputMethod: 'keyboard',
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
            {/* Share button - only show for completed jobs */}
            {job.status === 'completed' && onShare && (
              <Tooltip label="Share job" placement="top">
                <IconButton
                  aria-label="Share job"
                  icon={<ExternalLinkIcon w={3} h={3} />}
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
                    onShare(job.id);
                  }}
                />
              </Tooltip>
            )}

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
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [jobToShare, setJobToShare] = useState<Job | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [jobOutputs, setJobOutputs] = useState<Record<string, string>>({});
  const [outputsLoading, setOutputsLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState<Set<string>>(new Set());
  const { getAddress } = useWalletAddress();
  const { openSearch } = useGlobalSearch();
  const toast = useToast();

  const ITEMS_PER_PAGE = 10;

  // Fetch job outputs for display
  const fetchJobOutputs = useCallback(
    async (jobs: Job[], immediateCount: number = 5) => {
      const walletAddress = getAddress();
      if (!walletAddress) return;

      setOutputsLoading(true);
      const outputs: Record<string, string> = {};

      // First, load the first few jobs immediately for better UX
      const immediateJobs = jobs.slice(0, immediateCount);
      const remainingJobs = jobs.slice(immediateCount);

      // Load immediate jobs first
      for (const job of immediateJobs) {
        setLoadingJobs((prev) => new Set(prev).add(job.id));
        try {
          const messages = await JobsAPI.getMessages(walletAddress, job.id);
          const sortedMessages = messages.sort(
            (a, b) => a.order_index - b.order_index
          );
          const assistantMessages = sortedMessages.filter(
            (m) => m.role === 'assistant'
          );

          if (assistantMessages.length > 0) {
            const lastAssistantMessage =
              assistantMessages[assistantMessages.length - 1];
            const content = lastAssistantMessage.content;
            let outputText = '';

            if (typeof content === 'string') {
              outputText = content;
            } else if (typeof content === 'object' && content.text) {
              outputText = content.text;
            } else if (typeof content === 'object' && content.content) {
              outputText = content.content;
            } else {
              outputText = JSON.stringify(content);
            }

            // Truncate to reasonable length for display
            outputs[job.id] =
              outputText.length > 200
                ? outputText.substring(0, 200) + '...'
                : outputText;
          }
        } catch (error) {
          console.error(`Error fetching outputs for job ${job.id}:`, error);
        } finally {
          setLoadingJobs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(job.id);
            return newSet;
          });
        }
      }

      // Update outputs with immediate results
      setJobOutputs({ ...outputs });
      setOutputsLoading(false);

      // Then load remaining jobs progressively
      if (remainingJobs.length > 0) {
        for (const job of remainingJobs) {
          setLoadingJobs((prev) => new Set(prev).add(job.id));
          try {
            const messages = await JobsAPI.getMessages(walletAddress, job.id);
            const sortedMessages = messages.sort(
              (a, b) => a.order_index - b.order_index
            );
            const assistantMessages = sortedMessages.filter(
              (m) => m.role === 'assistant'
            );

            if (assistantMessages.length > 0) {
              const lastAssistantMessage =
                assistantMessages[assistantMessages.length - 1];
              const content = lastAssistantMessage.content;
              let outputText = '';

              if (typeof content === 'string') {
                outputText = content;
              } else if (typeof content === 'object' && content.text) {
                outputText = content.text;
              } else if (typeof content === 'object' && content.content) {
                outputText = content.content;
              } else {
                outputText = JSON.stringify(content);
              }

              // Truncate to reasonable length for display
              const jobOutput =
                outputText.length > 200
                  ? outputText.substring(0, 200) + '...'
                  : outputText;

              // Update outputs progressively
              setJobOutputs((prev) => ({ ...prev, [job.id]: jobOutput }));
            }
          } catch (error) {
            console.error(`Error fetching outputs for job ${job.id}:`, error);
          } finally {
            setLoadingJobs((prev) => {
              const newSet = new Set(prev);
              newSet.delete(job.id);
              return newSet;
            });
          }
        }
      }
    },
    [getAddress]
  );

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
      // Fetch outputs for completed jobs
      await fetchJobOutputs(jobsList);
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
  }, [getAddress, loadLocalStorageConversations, fetchJobOutputs]);

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

  // Apply filters and pagination with sorting by created_at DESC (newest first)
  const allCurrentJobs = useMemo(
    () =>
      filterJobs(jobs.filter(isCurrentJob)).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [jobs, filterJobs]
  );
  const allPreviousJobs = useMemo(
    () =>
      filterJobs(jobs.filter(isPreviousJob)).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [jobs, filterJobs]
  );
  const allActiveScheduledJobs = useMemo(
    () =>
      filterJobs(scheduledJobs.filter((job) => job.is_active)).sort((a, b) => {
        // Sort by created_at to show most recently created scheduled jobs first
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }),
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
            wallet: walletAddress,
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
          wallet: walletAddress,
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
    [getAddress, loadAllData, onRunScheduledJob, toast, scheduledJobs]
  );

  const handleEditSchedule = useCallback(
    async (jobId: string) => {
      // Toggle dropdown for this job (or close others and open this one)
      setEditingJobId(editingJobId === jobId ? null : jobId);
    },
    [editingJobId]
  );

  const handleDeleteJob = useCallback(
    async (jobId: string) => {
      // Find the job to get details for analytics
      const job =
        jobs.find((j) => j.id === jobId) ||
        scheduledJobs.find((j) => j.id === jobId);

      // Show confirmation dialog
      const confirmed = window.confirm(
        'Are you sure you want to delete this job? This action cannot be undone and will permanently remove the job and all its messages.'
      );

      if (!confirmed) {
        // Track cancellation
        trackEvent('job.delete_cancelled', {
          jobId,
          jobName: job?.name,
          jobStatus: job?.status,
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
          wallet: walletAddress,
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

  const handleShareJob = useCallback(
    async (jobId: string) => {
      // Find the job to share
      const job = jobs.find((j) => j.id === jobId);
      if (!job) {
        toast({
          title: 'Job not found',
          description: 'Could not find the job to share',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Check if user is logged in
      const walletAddress = getAddress();
      if (!walletAddress) {
        toast({
          title: 'Wallet not connected',
          description: 'Please connect your wallet to share jobs',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Check if job is completed
      if (job.status !== 'completed') {
        toast({
          title: 'Job not completed',
          description: 'Only completed jobs can be shared',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Open share modal
      setJobToShare(job);
      setIsShareModalOpen(true);

      // Track analytics
      trackEvent('job.share_modal_opened', {
        jobId,
        jobName: job.name,
        jobStatus: job.status,
      });
    },
    [jobs, getAddress, toast]
  );

  const handleJobHover = useCallback(
    (jobId: string, position: { x: number; y: number }) => {
      setHoveredJobId(jobId);
      setHoverPosition(position);
    },
    []
  );

  const handleJobHoverEnd = useCallback(() => {
    setHoveredJobId(null);
  }, []);

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
            placeholder="Search jobs... (Try out ⌘K)"
            value=""
            onClick={openSearch}
            readOnly
            cursor="pointer"
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
              previousValue: statusFilter,
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
              previousValue: timeFilter,
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
          const tabNames = ['current', 'scheduled', 'previous'];
          trackEvent('job.tab_changed', {
            fromTab: tabNames[activeTab],
            toTab: tabNames[index],
            tabIndex: index,
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
            Previous Jobs ({allPreviousJobs.length})
          </Tab>
        </TabList>

        <TabPanels className={styles.tabPanelsContainer}>
          {/* First TabPanel: Current Jobs */}
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
                        onShare={handleShareJob}
                        onHover={handleJobHover}
                        onHoverEnd={handleJobHoverEnd}
                        jobOutputs={jobOutputs[job.id]}
                        outputsLoading={outputsLoading}
                        isLoading={loadingJobs.has(job.id)}
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
                        section: 'current',
                      });
                      setCurrentPage(page);
                    }}
                  />
                </>
              )}
            </Box>
          </TabPanel>

          {/* Second TabPanel: Scheduled Jobs */}
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
                        isEditing={editingJobId === job.id}
                        onJobUpdated={() => {
                          setEditingJobId(null);
                          loadAllData(); // Reload jobs after update
                        }}
                        onHover={handleJobHover}
                        onHoverEnd={handleJobHoverEnd}
                        jobOutputs={jobOutputs[job.id]}
                        outputsLoading={outputsLoading}
                        isLoading={loadingJobs.has(job.id)}
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
                        section: 'scheduled',
                      });
                      setScheduledPage(page);
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
                        onShare={handleShareJob}
                        onHover={handleJobHover}
                        onHoverEnd={handleJobHoverEnd}
                        jobOutputs={jobOutputs[job.id]}
                        outputsLoading={outputsLoading}
                        isLoading={loadingJobs.has(job.id)}
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
                        section: 'previous',
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

      {/* Share Job Modal */}
      {jobToShare && (
        <ShareJobModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setJobToShare(null);
          }}
          job={jobToShare}
          walletAddress={getAddress() || ''}
        />
      )}

      {/* Job Hover Preview */}
      <JobHoverPreview
        jobId={hoveredJobId || ''}
        isVisible={!!hoveredJobId}
        position={hoverPosition}
      />
    </Box>
  );
};
