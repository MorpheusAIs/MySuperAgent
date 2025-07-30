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
} from '@chakra-ui/react';
import axios from 'axios';
import BASE_URL from '@/services/constants';

interface ScheduledJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage: string;
  onJobCreated: (jobId: number) => void;
}

export const ScheduledJobModal: FC<ScheduledJobModalProps> = ({
  isOpen,
  onClose,
  initialMessage,
  onJobCreated,
}) => {
  const [jobName, setJobName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'custom'>('once');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [intervalDays, setIntervalDays] = useState(1);
  const [maxRuns, setMaxRuns] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

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

    setIsLoading(true);

    try {
      // Combine date and time
      const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      
      const response = await axios.post(`${BASE_URL}/v1/scheduled-jobs`, {
        job_name: jobName,
        job_description: jobDescription || null,
        message_content: initialMessage,
        schedule_type: isRecurring ? scheduleType : 'once',
        schedule_time: scheduleDateTime.toISOString(),
        interval_days: scheduleType === 'custom' ? intervalDays : null,
        max_runs: maxRuns,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      toast({
        title: 'Job scheduled successfully',
        description: `Your job "${jobName}" has been scheduled`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onJobCreated(response.data.job.id);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating scheduled job:', error);
      toast({
        title: 'Error scheduling job',
        description: error instanceof Error ? error.message : 'An error occurred',
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
    setScheduleTime('');
    setIntervalDays(1);
    setMaxRuns(null);
    setIsRecurring(false);
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Schedule Job</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Job Name</FormLabel>
              <Input
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g., Daily Market Analysis"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Optional description of what this job does"
                rows={2}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Message</FormLabel>
              <Textarea
                value={initialMessage}
                isReadOnly
                bg="gray.700"
                rows={3}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Recurring Job</FormLabel>
              <Switch
                isChecked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
            </FormControl>

            {isRecurring && (
              <>
                <FormControl isRequired>
                  <FormLabel>Schedule Type</FormLabel>
                  <Select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value as any)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Interval</option>
                  </Select>
                </FormControl>

                {scheduleType === 'custom' && (
                  <FormControl isRequired>
                    <FormLabel>Interval (days)</FormLabel>
                    <NumberInput
                      value={intervalDays}
                      onChange={(_, value) => setIntervalDays(value)}
                      min={1}
                      max={365}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                )}

                <FormControl>
                  <FormLabel>Maximum Runs (optional)</FormLabel>
                  <NumberInput
                    value={maxRuns || ''}
                    onChange={(_, value) => setMaxRuns(value || null)}
                    min={1}
                  >
                    <NumberInputField placeholder="Leave empty for unlimited" />
                  </NumberInput>
                </FormControl>
              </>
            )}

            <HStack width="100%" spacing={4}>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={getMinDateTime()}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Time</FormLabel>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </FormControl>
            </HStack>

            {isRecurring && (
              <Text fontSize="sm" color="gray.400">
                First run will be at {scheduleDate} {scheduleTime}, then every{' '}
                {scheduleType === 'custom' ? `${intervalDays} days` : scheduleType}
              </Text>
            )}
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
          >
            Schedule Job
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};