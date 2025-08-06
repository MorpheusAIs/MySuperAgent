import React, { FC, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  useToast,
  VStack,
  HStack,
  Text,
  Switch,
  Box,
  Flex,
  Badge,
  Icon,
  SimpleGrid,
  Divider,
  InputGroup,
  InputLeftAddon,
  Checkbox,
  CheckboxGroup,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  CalendarIcon, 
  TimeIcon, 
  RepeatIcon, 
  InfoIcon,
  CheckIcon 
} from '@chakra-ui/icons';
import JobsAPI from '@/services/API/jobs';
import { useWalletAddress } from '@/services/Wallet/utils';

interface ScheduledJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage: string;
  onJobCreated: (jobId: string) => void;
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

export const ScheduledJobModal: FC<ScheduledJobModalProps> = ({
  isOpen,
  onClose,
  initialMessage,
  onJobCreated,
}) => {
  const [jobName, setJobName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<'once' | 'daily' | 'weekly' | 'custom'>('once');
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

  const isRecurring = scheduleOptions.find(opt => opt.id === scheduleType)?.isRecurring || false;

  const handleSubmit = async () => {
    if (!jobName || !scheduleDate || !scheduleTime) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in job name, date, and time',
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
      // Combine date and time
      const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      const walletAddress = getAddress();
      if (!walletAddress) {
        toast({
          title: 'Wallet not connected',
          description: 'Please connect your wallet to schedule jobs',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }
      
      // Calculate next run time
      const nextRunTime = JobsAPI.calculateNextRunTime(
        scheduleType as 'once' | 'daily' | 'weekly' | 'custom',
        scheduleDateTime,
        scheduleType === 'custom' ? intervalDays : undefined
      );
      
      // Create the job with scheduling information
      const job = await JobsAPI.createJob(walletAddress, {
        name: jobName,
        description: jobDescription || '',
        initial_message: initialMessage,
        is_scheduled: true,
      });

      // Update the job with scheduling details
      await JobsAPI.updateJob(job.id, {
        wallet_address: walletAddress,
        schedule_type: scheduleType as 'once' | 'daily' | 'weekly' | 'custom',
        schedule_time: scheduleDateTime,
        next_run_time: nextRunTime,
        interval_days: scheduleType === 'custom' ? intervalDays : null,
        max_runs: maxRuns,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekly_days: scheduleType === 'weekly' ? selectedDays.join(',') : null,
      });

      toast({
        title: 'Job scheduled successfully! 🎉',
        description: `"${jobName}" will ${getScheduleDescription()}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onJobCreated(job.id);
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating scheduled job:', error);
      toast({
        title: 'Error scheduling job',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setJobName('');
    setJobDescription('');
    setScheduleType('once');
    setScheduleDate('');
    setScheduleTime('09:00');
    setIntervalDays(1);
    setMaxRuns(null);
    setSelectedDays([]);
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
        const dayNames = selectedDays.map(day => 
          daysOfWeek.find(d => d.id === day)?.label
        ).join(', ');
        return `run every ${dayNames} at ${time}`;
      case 'custom':
        return `run every ${intervalDays} day${intervalDays !== 1 ? 's' : ''} at ${time}`;
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent bg={bg} color="white" mx={4} my={8}>
        <ModalHeader>
          <Flex align="center" gap={3}>
            <Icon as={CalendarIcon} color="blue.400" />
            <Text>Schedule Job</Text>
            <Badge colorScheme="blue" fontSize="xs">
              New
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
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
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
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="medium">
                    <Flex align="center" gap={2}>
                      <Icon as={InfoIcon} color="blue.400" />
                      Message to Execute
                    </Flex>
                  </FormLabel>
                  <Textarea
                    value={initialMessage}
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
                  <FormLabel fontWeight="medium">When should this job run?</FormLabel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {scheduleOptions.map((option) => (
                      <Box
                        key={option.id}
                        p={4}
                        border="2px solid"
                        borderColor={scheduleType === option.id ? selectedBorder : borderColor}
                        bg={scheduleType === option.id ? selectedBg : 'gray.700'}
                        borderRadius="lg"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ borderColor: 'blue.300', transform: 'translateY(-1px)' }}
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
                    <CheckboxGroup value={selectedDays} onChange={(value) => setSelectedDays(value as string[])}>
                      <SimpleGrid columns={7} spacing={2}>
                        {daysOfWeek.map((day) => (
                          <Box key={day.id} textAlign="center">
                            <Checkbox
                              value={day.id}
                              size="lg"
                              colorScheme="blue"
                              display="none"
                              id={day.id}
                            />
                            <Box
                              as="label"
                              htmlFor={day.id}
                              display="block"
                              p={2}
                              border="2px solid"
                              borderColor={selectedDays.includes(day.id) ? 'blue.400' : borderColor}
                              bg={selectedDays.includes(day.id) ? 'blue.900' : 'gray.700'}
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
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
                        />
                      </NumberInput>
                      <InputLeftAddon bg="gray.600" borderColor={borderColor}>
                        {intervalDays === 1 ? 'day' : 'days'}
                      </InputLeftAddon>
                    </InputGroup>
                  </FormControl>
                )}

                {/* Date and Time */}
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
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
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
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Advanced Options for Recurring Jobs */}
                {isRecurring && (
                  <FormControl>
                    <FormLabel fontWeight="medium">Maximum Runs (optional)</FormLabel>
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
                        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
                      />
                    </NumberInput>
                  </FormControl>
                )}

                {/* Schedule Preview */}
                {jobName && scheduleDate && scheduleTime && (
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
                          {' '}(max {maxRuns} run{maxRuns !== 1 ? 's' : ''})
                        </Text>
                      )}
                    </Text>
                  </Box>
                )}
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
            loadingText="Scheduling..."
            leftIcon={<CalendarIcon />}
          >
            Schedule Job
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};