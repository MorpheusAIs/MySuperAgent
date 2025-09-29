import { JobThread } from '@/pages/api/v1/jobs/threaded';
import { Job } from '@/services/database/db';
import {
  ChatIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DeleteIcon,
  EditIcon,
  ExternalLinkIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Collapse,
  HStack,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import styles from './index.module.css';

interface ThreadedJobItemProps {
  thread: JobThread;
  onClick: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onShare?: (jobId: string) => void;
  onHover?: (jobId: string, position: { x: number; y: number }) => void;
  onHoverEnd?: () => void;
  jobOutputs?: Record<string, string>;
  outputsLoading?: boolean;
  isLoading?: boolean;
}

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

const JobInstanceItem: FC<{
  job: Job;
  onClick: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onShare?: (jobId: string) => void;
  onHover?: (jobId: string, position: { x: number; y: number }) => void;
  onHoverEnd?: () => void;
  jobOutputs?: Record<string, string>;
  isLoading?: boolean;
}> = ({
  job,
  onClick,
  onDelete,
  onEdit,
  onShare,
  onHover,
  onHoverEnd,
  jobOutputs,
  isLoading = false,
}) => {
  const status = job.status;
  const description =
    jobOutputs?.[job.id] ||
    job.description ||
    job.initial_message ||
    'No description';

  return (
    <Box
      className={styles.jobInstanceItem}
      p={3}
      borderRadius="md"
      w="100%"
      bg="rgba(255, 255, 255, 0.02)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      _hover={{
        bg: 'rgba(255, 255, 255, 0.04)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      transition="all 0.2s ease"
    >
      <VStack align="stretch" spacing={2} width="100%">
        {/* Header with status and time */}
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Badge
              colorScheme={getStatusColor(status)}
              variant="subtle"
              size="sm"
            >
              {status}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              {formatTimeAgo(new Date(job.created_at))}
            </Text>
          </HStack>

          <HStack spacing={1}>
            {job.status === 'completed' && onShare && (
              <Tooltip label="Share job" placement="top">
                <IconButton
                  aria-label="Share job"
                  icon={<ExternalLinkIcon w={3} h={3} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="green"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(job.id);
                  }}
                />
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip label="Edit job" placement="top">
                <IconButton
                  aria-label="Edit job"
                  icon={<EditIcon w={3} h={3} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(job.id);
                  }}
                />
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip label="Delete job" placement="top">
                <IconButton
                  aria-label="Delete job"
                  icon={<DeleteIcon w={3} h={3} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(job.id);
                  }}
                />
              </Tooltip>
            )}
          </HStack>
        </HStack>

        {/* Description */}
        <Text
          fontSize="sm"
          color="gray.400"
          noOfLines={2}
          cursor="pointer"
          onClick={() => onClick(job.id)}
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
          {isLoading ? 'Loading...' : description}
        </Text>
      </VStack>
    </Box>
  );
};

export const ThreadedJobItem: FC<ThreadedJobItemProps> = ({
  thread,
  onClick,
  onDelete,
  onEdit,
  onShare,
  onHover,
  onHoverEnd,
  jobOutputs,
  outputsLoading = false,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const latestJob = thread.latest_job;
  const description =
    jobOutputs?.[latestJob.id] ||
    thread.description ||
    thread.initial_message ||
    'No description';

  return (
    <Box
      className={styles.threadedJobItem}
      borderRadius="lg"
      w="100%"
      overflow="hidden"
      position="relative"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      bg="rgba(255, 255, 255, 0.01)"
      _hover={{
        bg: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
      transition="all 0.2s ease"
    >
      {/* Main thread header */}
      <Box
        cursor="pointer"
        p={4}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onHover?.(latestJob.id, {
            x: rect.right,
            y: rect.top,
          });
        }}
        onMouseLeave={() => {
          onHoverEnd?.();
        }}
      >
        <VStack align="stretch" spacing={3} width="100%">
          {/* Header with title and status */}
          <HStack justify="space-between" align="flex-start" spacing={3}>
            <VStack align="flex-start" spacing={1} flex={1} minW={0}>
              <HStack spacing={2} w="100%">
                <IconButton
                  aria-label={isExpanded ? 'Collapse thread' : 'Expand thread'}
                  icon={
                    isExpanded ? (
                      <ChevronDownIcon w={4} h={4} />
                    ) : (
                      <ChevronRightIcon w={4} h={4} />
                    )
                  }
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                />
                <Text
                  fontSize="md"
                  fontWeight="semibold"
                  color="gray.200"
                  textAlign="left"
                  noOfLines={1}
                  flex={1}
                >
                  {thread.name}
                </Text>
                <Badge
                  colorScheme="blue"
                  variant="subtle"
                  size="sm"
                  flexShrink={0}
                >
                  {thread.total_runs} runs
                </Badge>
              </HStack>
              <Text
                fontSize="sm"
                color="gray.500"
                textAlign="left"
                noOfLines={2}
                w="100%"
              >
                {isLoading ? 'Loading...' : description}
              </Text>
            </VStack>

            <Badge
              colorScheme={getStatusColor(thread.latest_status as any)}
              variant="subtle"
              size="sm"
              flexShrink={0}
            >
              {thread.latest_status}
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
                <Text>Latest run</Text>
              </HStack>
              <HStack spacing={1}>
                <TimeIcon w={3} h={3} />
                <Text>{formatTimeAgo(new Date(thread.latest_created_at))}</Text>
              </HStack>
            </HStack>
            {thread.is_scheduled && (
              <HStack spacing={1}>
                <CheckCircleIcon w={3} h={3} />
                <Text>Scheduled ({thread.schedule_type})</Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Expandable job instances */}
      <Collapse in={isExpanded} animateOpacity>
        <Box
          borderTop="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
          bg="rgba(255, 255, 255, 0.02)"
          p={3}
        >
          <VStack spacing={2} align="stretch">
            <Text fontSize="xs" color="gray.500" fontWeight="medium" mb={2}>
              Job History ({thread.jobs.length} runs)
            </Text>
            {thread.jobs.map((job) => (
              <JobInstanceItem
                key={job.id}
                job={job}
                onClick={onClick}
                onDelete={onDelete}
                onEdit={onEdit}
                onShare={onShare}
                onHover={onHover}
                onHoverEnd={onHoverEnd}
                jobOutputs={jobOutputs}
                isLoading={isLoading}
              />
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};
