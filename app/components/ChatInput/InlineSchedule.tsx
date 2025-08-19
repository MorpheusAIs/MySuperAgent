import JobsAPI from '@/services/api/jobs';
import { useWalletAddress } from '@/services/wallet/utils';
import { CalendarIcon } from '@chakra-ui/icons';
import {
  Button,
  HStack,
  Input,
  Select,
  Text,
  useToast,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import styles from './InlineSchedule.module.css';

interface InlineScheduleProps {
  message: string;
  onJobCreated?: (jobId: string) => void;
  onClose?: () => void;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const InlineSchedule: FC<InlineScheduleProps> = ({
  message,
  onJobCreated,
  onClose,
}) => {
  const [jobName, setJobName] = useState('');
  const [scheduleType, setScheduleType] = useState<
    'once' | 'hourly' | 'daily' | 'weekly' | 'custom'
  >('hourly');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleDate, setScheduleDate] = useState('');
  const [intervalDays, setIntervalDays] = useState(1);
  const [maxOccurrences, setMaxOccurrences] = useState<string>('infinite');
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Default to Monday
  const [isLoading, setIsLoading] = useState(false);
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  const handleSubmit = async () => {
    if (!jobName) {
      toast({
        title: 'Missing job name',
        description: 'Please enter a job name',
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
        // Without wallet, we'll create a localStorage-based conversation instead
        console.log(
          'No wallet connected - creating local conversation instead of scheduled job'
        );

        try {
          // Import localStorage utilities
          const { createNewConversation } = await import(
            '@/services/chat-management/conversations'
          );

          // Create a new localStorage conversation
          const newConversationId = createNewConversation();

          toast({
            title: 'Conversation created! 💬',
            description: `"${jobName}" saved locally (requires wallet for scheduling)`,
            status: 'info',
            duration: 3000,
            isClosable: true,
          });

          if (onJobCreated) onJobCreated(newConversationId);
          if (onClose) onClose();
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Error creating local conversation:', error);
          toast({
            title: 'Error creating conversation',
            description: 'An error occurred while creating the conversation',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setIsLoading(false);
          return;
        }
      }

      // Create base schedule time
      const now = new Date();
      let scheduleDateTime;

      if (scheduleType === 'once') {
        // For 'once', combine the selected date and time
        if (!scheduleDate || !scheduleTime) {
          toast({
            title: 'Missing date or time',
            description: 'Please select both date and time for one-time jobs',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setIsLoading(false);
          return;
        }
        scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      } else if (scheduleType === 'hourly') {
        scheduleDateTime = now;
      } else {
        scheduleDateTime = new Date();
        const [hours, minutes] = scheduleTime.split(':');
        scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // For weekly, do NOT use a picked calendar date; use the next occurrence based on time
        // If the time has already passed today, schedule for tomorrow (server will compute next run)
        if (scheduleDateTime <= now) {
          scheduleDateTime.setDate(scheduleDateTime.getDate() + 1);
        }
      }

      const nextRunTime = JobsAPI.calculateNextRunTime(
        scheduleType,
        scheduleDateTime,
        scheduleType === 'custom' ? intervalDays : undefined
      );

      const job = await JobsAPI.createJob(walletAddress, {
        name: jobName,
        description: '',
        initial_message: message,
        is_scheduled: true,
      });

      await JobsAPI.updateJob(job.id, {
        wallet_address: walletAddress,
        schedule_type: scheduleType,
        schedule_time: scheduleDateTime,
        next_run_time: nextRunTime,
        interval_days: scheduleType === 'custom' ? intervalDays : null,
        max_runs:
          maxOccurrences === 'infinite' ? null : parseInt(maxOccurrences),
        weekly_days: scheduleType === 'weekly' ? selectedDays.join(',') : null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      toast({
        title: 'Job scheduled! 🎉',
        description: `"${jobName}" scheduled successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onJobCreated) onJobCreated(job.id);
      if (onClose) onClose();
    } catch (error: any) {
      console.error('Error creating scheduled job:', error);
      toast({
        title: 'Error scheduling job',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
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
    <div className={styles.container}>
      <HStack spacing={2} align="center">
        <Input
          placeholder="Job name"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          size="sm"
          className={styles.input}
          flex={1}
        />

        <Select
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value as any)}
          size="sm"
          className={styles.select}
          w="100px"
        >
          <option value="once">Once</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
        </Select>

        {/* Show time for daily and weekly only on first row */}
        {(scheduleType === 'daily' || scheduleType === 'weekly') && (
          <>
            <Text color="gray.400" fontSize="sm">
              @
            </Text>
            <Input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              size="sm"
              className={styles.input}
              w="130px"
            />
          </>
        )}

        {/* Max Occurrences - always visible except for 'once' */}
        {scheduleType !== 'once' && (
          <Select
            value={maxOccurrences}
            onChange={(e) => setMaxOccurrences(e.target.value)}
            size="sm"
            className={styles.select}
            w="60px"
          >
            <option value="infinite">∞</option>
            <option value="1">1x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="25">25x</option>
            <option value="50">50x</option>
            <option value="100">100x</option>
          </Select>
        )}

        <Button
          leftIcon={<CalendarIcon />}
          size="sm"
          className={styles.actionButton}
          onClick={handleSubmit}
          isLoading={isLoading}
          isDisabled={!jobName}
        >
          Schedule
        </Button>
      </HStack>

      {/* Second row for 'once' - date and time */}
      {scheduleType === 'once' && (
        <HStack spacing={2} align="center" mt={2}>
          <Input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={getMinDateTime()}
            size="sm"
            className={styles.input}
            w="140px"
          />
          <Text color="gray.400" fontSize="sm">
            @
          </Text>
          <Input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            size="sm"
            className={styles.input}
            w="150px"
          />
        </HStack>
      )}

      {/* Second row for weekly options */}
      {scheduleType === 'weekly' && (
        <HStack spacing={2} align="center" mt={2}>
          <HStack spacing={1}>
            {daysOfWeek.map((day, index) => (
              <button
                key={index}
                className={`${styles.dayButton} ${selectedDays.includes(index) ? styles.daySelected : ''}`}
                onClick={() => toggleDay(index)}
              >
                {day}
              </button>
            ))}
          </HStack>
          {/* No calendar date picker for weekly */}
        </HStack>
      )}

      {/* Second row for custom options */}
      {scheduleType === 'custom' && (
        <HStack spacing={2} align="center" mt={2}>
          <Text color="gray.400" fontSize="sm">
            every
          </Text>
          <Input
            type="number"
            value={intervalDays}
            onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
            min={1}
            max={365}
            size="sm"
            className={styles.input}
            w="70px"
          />
          <Text color="gray.400" fontSize="sm">
            days @
          </Text>
          <Input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            size="sm"
            className={styles.input}
            w="130px"
          />
          <Input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={getMinDateTime()}
            size="sm"
            className={styles.input}
            w="130px"
            placeholder="Start date (optional)"
          />
        </HStack>
      )}
    </div>
  );
};
