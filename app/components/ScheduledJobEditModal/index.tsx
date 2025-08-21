import JobsAPI from '@/services/api-clients/jobs';
import { Job } from '@/services/database/db';
import { useWalletAddress } from '@/services/wallet/utils';
import {
  CalendarIcon,
  CheckIcon,
  InfoIcon,
  RepeatIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';

interface ScheduledJobEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onJobUpdated: () => void;
}

type ScheduleTypeOption = {
  id: 'once' | 'daily' | 'weekly' | 'custom';
  label: string;
  description: string;
  icon: React.ElementType;
  isRecurring: boolean;
};

const scheduleOptions: ScheduleTypeOption[] = [
  {
    id: 'once',
    label: 'Run Once',
    description: 'Execute this job at a specific time',
    icon: CalendarIcon,
    isRecurring: false,
  },
  {
    id: 'daily',
    label: 'Daily',
    description: 'Run every day at the same time',
    icon: RepeatIcon,
    isRecurring: true,
  },
  {
    id: 'weekly',
    label: 'Weekly',
    description: 'Run once a week on the same day',
    icon: RepeatIcon,
    isRecurring: true,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Set your own interval in days',
    icon: TimeIcon,
    isRecurring: true,
  },
];

const daysOfWeek = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

export const ScheduledJobEditModal: FC<ScheduledJobEditModalProps> = ({
  isOpen,
  onClose,
  job,
  onJobUpdated,
}) => {
  const [jobName, setJobName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<
    'once' | 'daily' | 'weekly' | 'custom'
  >('daily');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [intervalDays, setIntervalDays] = useState(1);
  const [maxRuns, setMaxRuns] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorder = useColorModeValue('blue.500', 'blue.300');

  // Load job data when modal opens or job changes
  useEffect(() => {
    if (job && isOpen) {
      setJobName(job.name);
      setJobDescription(job.description || '');
      
      // Set schedule type
      if (job.schedule_type) {
        // Map 'hourly' to 'custom' with 1 day interval for backwards compatibility
        if (job.schedule_type === 'hourly') {
          setScheduleType('custom');
          setIntervalDays(1);
        } else {
          setScheduleType(job.schedule_type as 'once' | 'daily' | 'weekly' | 'custom');
        }
      }
      
      // Parse schedule time
      if (job.schedule_time) {
        const scheduleDateTime = new Date(job.schedule_time);
        // Format date as YYYY-MM-DD
        const year = scheduleDateTime.getFullYear();
        const month = String(scheduleDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(scheduleDateTime.getDate()).padStart(2, '0');
        setScheduleDate(`${year}-${month}-${day}`);
        
        // Format time as HH:MM
        const hours = String(scheduleDateTime.getHours()).padStart(2, '0');
        const minutes = String(scheduleDateTime.getMinutes()).padStart(2, '0');
        setScheduleTime(`${hours}:${minutes}`);
      }
      
      // Set interval days for custom schedules
      if (job.interval_days) {
        setIntervalDays(job.interval_days);
      }
      
      // Set max runs
      if (job.max_runs) {
        setMaxRuns(job.max_runs);
      }
      
      // Parse weekly days
      if (job.weekly_days) {
        setSelectedDays(job.weekly_days.split(','));
      }
    }
  }, [job, isOpen]);

  const isRecurring =
    scheduleOptions.find((opt) => opt.id === scheduleType)?.isRecurring ||
    false;

  const handleSubmit = async () => {
    if (!job) return;
    
    if (!jobName || !scheduleTime) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in job name and time',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // For non-weekly schedules, date is required
    if (scheduleType !== 'weekly' && !scheduleDate) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in the schedule date',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (scheduleType === 'weekly' && selectedDays.length === 0) {
      toast({
        title: 'Missing weekly schedule',
        description: 'Please select at least one day of the week',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const walletAddress = getAddress();
      if (!walletAddress) {
        toast({
          title: 'Wallet not connected',
          description: 'Please connect your wallet to edit scheduled jobs',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      // For weekly schedules, use next occurrence of selected day
      let scheduleDateTime: Date;
      if (scheduleType === 'weekly') {
        // Get current date and set the time
        const now = new Date();
        const [hours, minutes] = scheduleTime.split(':');
        now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Find the next occurrence of the first selected day
        const dayIndex = daysOfWeek.findIndex(d => selectedDays.includes(d.id));
        const currentDayIndex = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        
        let daysUntilNext = (dayIndex - currentDayIndex + 7) % 7;
        if (daysUntilNext === 0 && now < new Date()) {
          daysUntilNext = 7; // If it's the same day but time has passed, schedule for next week
        }
        
        scheduleDateTime = new Date(now);
        scheduleDateTime.setDate(scheduleDateTime.getDate() + daysUntilNext);
      } else {
        // Combine date and time for other schedule types
        scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      }

      // Calculate next run time
      const nextRunTime = JobsAPI.calculateNextRunTime(
        scheduleType,
        scheduleDateTime,
        scheduleType === 'custom' ? intervalDays : undefined
      );

      // Update the job with new scheduling details
      await JobsAPI.updateJob(job.id, {
        wallet_address: walletAddress,
        name: jobName,
        description: jobDescription || null,
        schedule_type: scheduleType,
        schedule_time: scheduleDateTime,
        next_run_time: nextRunTime,
        interval_days: scheduleType === 'custom' ? intervalDays : null,
        max_runs: maxRuns,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekly_days: scheduleType === 'weekly' ? selectedDays.join(',') : null,
        is_active: true, // Ensure job remains active after editing
      });

      toast({
        title: 'Schedule updated successfully! 🎉',
        description: `"${jobName}" will ${getScheduleDescription()}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onJobUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating scheduled job:', error);
      toast({
        title: 'Error updating schedule',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduleDescription = () => {
    const time = new Date(`2000-01-01T${scheduleTime}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    switch (scheduleType) {
      case 'once':
        return `run once on ${scheduleDate} at ${time}`;
      case 'daily':
        return `run daily at ${time}`;
      case 'weekly':
        if (selectedDays.length === 0) return `run weekly at ${time}`;
        const dayNames = selectedDays
          .map((day) => daysOfWeek.find((d) => d.id === day)?.label)
          .join(', ');
        return `run every ${dayNames} at ${time}`;
      case 'custom':
        return `run every ${intervalDays} day${
          intervalDays !== 1 ? 's' : ''
        } at ${time}`;
      default:
        return '';
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (!job) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent bg={bg} color="white" mx={4} my={8}>
        <ModalHeader>
          <Flex align="center" gap={3}>
            <Icon as={CalendarIcon} color="blue.400" />
            <Text>Edit Scheduled Job</Text>
            <Badge colorScheme="green" fontSize="xs">
              Editing
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Job Details Section */}
            <Box>
              <Text fontWeight="semibold" mb={4} color="gray.300">
                Job Details
              </Text>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Job Name</FormLabel>
                  <Input
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="e.g., Daily Market Analysis"
                    bg="gray.700"
                    border="1px solid"
                    borderColor={borderColor}
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px blue.400',
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="medium">Description</FormLabel>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Optional description of what this job does"
                    rows={2}
                    bg="gray.700"
                    border="1px solid"
                    borderColor={borderColor}
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px blue.400',
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="medium">
                    <Flex align="center" gap={2}>
                      <Icon as={InfoIcon} color="blue.400" />
                      Original Message
                    </Flex>
                  </FormLabel>
                  <Textarea
                    value={job.initial_message}
                    isReadOnly
                    bg="gray.700"
                    rows={3}
                    opacity={0.8}
                    fontSize="sm"
                  />
                </FormControl>
              </VStack>
            </Box>

            <Divider borderColor={borderColor} />

            {/* Schedule Configuration Section */}
            <Box>
              <Text fontWeight="semibold" mb={4} color="gray.300">
                Schedule Configuration
              </Text>

              {/* Schedule Type Selection */}
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">
                    When should this job run?
                  </FormLabel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {scheduleOptions.map((option) => (
                      <Box
                        key={option.id}
                        p={4}
                        border="2px solid"
                        borderColor={
                          scheduleType === option.id
                            ? selectedBorder
                            : borderColor
                        }
                        bg={
                          scheduleType === option.id ? selectedBg : 'gray.700'
                        }
                        borderRadius="lg"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                          borderColor: 'blue.300',
                          transform: 'translateY(-1px)',
                        }}
                        onClick={() => setScheduleType(option.id)}
                      >
                        <Flex align="center" gap={3}>
                          <Icon as={option.icon} color="blue.400" />
                          <Box flex={1}>
                            <Text fontWeight="medium" fontSize="sm">
                              {option.label}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              {option.description}
                            </Text>
                          </Box>
                          {scheduleType === option.id && (
                            <Icon as={CheckIcon} color="blue.400" />
                          )}
                        </Flex>
                      </Box>
                    ))}
                  </SimpleGrid>
                </FormControl>

                {/* Weekly Days Selection */}
                {scheduleType === 'weekly' && (
                  <FormControl isRequired>
                    <FormLabel fontWeight="medium">Select Days</FormLabel>
                    <CheckboxGroup
                      value={selectedDays}
                      onChange={(value) => setSelectedDays(value as string[])}
                    >
                      <SimpleGrid columns={7} spacing={2}>
                        {daysOfWeek.map((day) => (
                          <Box key={day.id} textAlign="center">
                            <Checkbox
                              value={day.id}
                              size="lg"
                              colorScheme="blue"
                              display="none"
                              id={`edit-${day.id}`}
                            />
                            <Box
                              as="label"
                              htmlFor={`edit-${day.id}`}
                              display="block"
                              p={2}
                              border="2px solid"
                              borderColor={
                                selectedDays.includes(day.id)
                                  ? 'blue.400'
                                  : borderColor
                              }
                              bg={
                                selectedDays.includes(day.id)
                                  ? 'blue.900'
                                  : 'gray.700'
                              }
                              borderRadius="md"
                              cursor="pointer"
                              textAlign="center"
                              fontSize="sm"
                              fontWeight="medium"
                              transition="all 0.2s"
                              _hover={{ borderColor: 'blue.300' }}
                            >
                              {day.label}
                            </Box>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  </FormControl>
                )}

                {/* Custom Interval */}
                {scheduleType === 'custom' && (
                  <FormControl isRequired>
                    <FormLabel fontWeight="medium">Interval (days)</FormLabel>
                    <InputGroup>
                      <InputLeftAddon bg="gray.600" borderColor={borderColor}>
                        Every
                      </InputLeftAddon>
                      <NumberInput
                        value={intervalDays}
                        onChange={(_, value) => setIntervalDays(value)}
                        min={1}
                        max={365}
                        flex={1}
                      >
                        <NumberInputField
                          bg="gray.700"
                          border="1px solid"
                          borderColor={borderColor}
                          borderLeftRadius={0}
                          _focus={{
                            borderColor: 'blue.400',
                            boxShadow: '0 0 0 1px blue.400',
                          }}
                        />
                      </NumberInput>
                      <InputLeftAddon bg="gray.600" borderColor={borderColor}>
                        {intervalDays === 1 ? 'day' : 'days'}
                      </InputLeftAddon>
                    </InputGroup>
                  </FormControl>
                )}

                {/* Date and Time */}
                {scheduleType === 'weekly' ? (
                  // For weekly schedules, only show time
                  <FormControl isRequired>
                    <FormLabel fontWeight="medium">
                      <Flex align="center" gap={2}>
                        <Icon as={TimeIcon} color="blue.400" />
                        Time
                      </Flex>
                    </FormLabel>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      bg="gray.700"
                      border="1px solid"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'blue.400',
                        boxShadow: '0 0 0 1px blue.400',
                      }}
                    />
                  </FormControl>
                ) : (
                  // For other schedule types, show both date and time
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">
                        <Flex align="center" gap={2}>
                          <Icon as={CalendarIcon} color="blue.400" />
                          {scheduleType === 'once' ? 'Date' : 'Start Date'}
                        </Flex>
                      </FormLabel>
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={getMinDateTime()}
                        bg="gray.700"
                        border="1px solid"
                        borderColor={borderColor}
                        _focus={{
                          borderColor: 'blue.400',
                          boxShadow: '0 0 0 1px blue.400',
                        }}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">
                        <Flex align="center" gap={2}>
                          <Icon as={TimeIcon} color="blue.400" />
                          Time
                        </Flex>
                      </FormLabel>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        bg="gray.700"
                        border="1px solid"
                        borderColor={borderColor}
                        _focus={{
                          borderColor: 'blue.400',
                          boxShadow: '0 0 0 1px blue.400',
                        }}
                      />
                    </FormControl>
                  </SimpleGrid>
                )}

                {/* Advanced Options for Recurring Jobs */}
                {isRecurring && (
                  <FormControl>
                    <FormLabel fontWeight="medium">
                      Maximum Runs (optional)
                    </FormLabel>
                    <NumberInput
                      value={maxRuns || ''}
                      onChange={(_, value) => setMaxRuns(value || null)}
                      min={1}
                    >
                      <NumberInputField
                        placeholder="Leave empty for unlimited"
                        bg="gray.700"
                        border="1px solid"
                        borderColor={borderColor}
                        _focus={{
                          borderColor: 'blue.400',
                          boxShadow: '0 0 0 1px blue.400',
                        }}
                      />
                    </NumberInput>
                  </FormControl>
                )}

                {/* Schedule Preview */}
                {jobName &&
                  scheduleTime &&
                  (scheduleType === 'weekly' || scheduleDate) && (
                    <Box
                      p={4}
                      bg="blue.900"
                      border="1px solid"
                      borderColor="blue.400"
                      borderRadius="lg"
                    >
                      <Flex align="center" gap={2} mb={2}>
                        <Icon as={InfoIcon} color="blue.400" />
                        <Text fontWeight="medium" fontSize="sm">
                          Schedule Preview
                        </Text>
                      </Flex>
                      <Text fontSize="sm" color="blue.100">
                        &quot;{jobName}&quot; will {getScheduleDescription()}
                        {maxRuns && (
                          <Text as="span" color="blue.200">
                            {' '}
                            (max {maxRuns} run{maxRuns !== 1 ? 's' : ''})
                          </Text>
                        )}
                      </Text>
                    </Box>
                  )}

                {/* Job Status Info */}
                <Box
                  p={3}
                  bg="gray.700"
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                >
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="xs" color="gray.400" mb={1}>
                        Current Status
                      </Text>
                      <Badge
                        colorScheme={job.is_active ? 'green' : 'red'}
                        fontSize="xs"
                      >
                        {job.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </Box>
                    {job.run_count !== undefined && (
                      <Box>
                        <Text fontSize="xs" color="gray.400" mb={1}>
                          Times Run
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {job.run_count}
                        </Text>
                      </Box>
                    )}
                    {job.last_run_at && (
                      <Box>
                        <Text fontSize="xs" color="gray.400" mb={1}>
                          Last Run
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {new Date(job.last_run_at).toLocaleDateString()}
                        </Text>
                      </Box>
                    )}
                    {job.next_run_time && (
                      <Box>
                        <Text fontSize="xs" color="gray.400" mb={1}>
                          Next Run
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {new Date(job.next_run_time).toLocaleDateString()}
                        </Text>
                      </Box>
                    )}
                  </SimpleGrid>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Updating..."
            leftIcon={<CalendarIcon />}
          >
            Update Schedule
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};