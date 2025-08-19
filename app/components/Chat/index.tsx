import { ChatInput } from '@/components/ChatInput';
import PrefilledOptions from '@/components/ChatInput/PrefilledOptions';
import { JobsList } from '@/components/JobsList';
import { MessageCounter } from '@/components/MessageCounter';
import { MessageList } from '@/components/MessageList';
import { useChatContext } from '@/contexts/chat/useChatContext';
import { trackEvent } from '@/services/analytics';
import JobsAPI from '@/services/api-clients/jobs';
import UserPreferencesAPI from '@/services/api-clients/userPreferences';
import { UserPreferences } from '@/services/database/db';
import { useWalletAddress } from '@/services/wallet/utils';
import { Box, Text, useBreakpointValue, VStack } from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';
import styles from './index.module.css';

export const Chat: FC<{
  isSidebarOpen?: boolean;
  currentView: 'chat' | 'jobs';
  setCurrentView: (view: 'chat' | 'jobs') => void;
}> = ({ isSidebarOpen = false, currentView, setCurrentView }) => {
  const { state, sendMessage, setCurrentConversation } = useChatContext();
  const { messages, currentConversationId, isLoading } = state;
  const [localLoading, setLocalLoading] = useState(false);
  const [showPrefilledOptions, setShowPrefilledOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [jobsRefreshKey, setJobsRefreshKey] = useState(0);
  const { address, getAddress } = useWalletAddress();

  // Load user preferences only (jobs come from ChatProviderDB)
  useEffect(() => {
    const loadUserPreferences = async () => {
      const walletAddress = getAddress();
      if (!walletAddress) {
        // No wallet connected, skip loading preferences
        return;
      }

      try {
        const preferences =
          await UserPreferencesAPI.getUserPreferences(walletAddress);
        setUserPreferences(preferences);
      } catch (error) {
        console.error('Error loading user preferences:', error);
        // Don't set preferences if loading fails - use defaults
      }
    };

    loadUserPreferences();
  }, [getAddress]);

  // Function to refresh jobs list
  const refreshJobsList = () => {
    setJobsRefreshKey((prev) => prev + 1);
  };

  const currentMessages = messages[currentConversationId] || [];
  const isMobile = useBreakpointValue({ base: true, md: false });
  const showLoading = isLoading || localLoading;

  const handleSubmit = async (
    message: string,
    files: File[],
    useResearch: boolean = true
  ) => {
    if (currentView === 'jobs') {
      // Create a new job but stay in jobs view
      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          // No wallet connected, create a localStorage-based conversation
          console.log('No wallet connected - creating local conversation');
          return await handleLocalStorageJob(message, files, useResearch);
        }
        const shouldAutoSchedule = userPreferences?.auto_schedule_jobs || false;

        const newJob = await JobsAPI.createJob(walletAddress, {
          name: JobsAPI.generateJobName(message),
          initial_message: message,
          is_scheduled: shouldAutoSchedule,
          has_uploaded_file: files.length > 0,
        });

        // If auto-scheduling is enabled, update the job with scheduling fields
        if (shouldAutoSchedule && userPreferences) {
          try {
            // Create schedule time based on user preferences
            const now = new Date();
            const [hours, minutes] =
              userPreferences.default_schedule_time.split(':');
            const scheduleDateTime = new Date();
            scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // If the time has already passed today, schedule for tomorrow
            if (scheduleDateTime <= now) {
              scheduleDateTime.setDate(scheduleDateTime.getDate() + 1);
            }

            // Calculate next run time
            const nextRunTime = JobsAPI.calculateNextRunTime(
              userPreferences.default_schedule_type as
                | 'once'
                | 'daily'
                | 'weekly'
                | 'custom',
              scheduleDateTime,
              userPreferences.default_schedule_type === 'custom' ? 1 : undefined
            );

            // Update the job with scheduling information
            await JobsAPI.updateJob(newJob.id, {
              wallet_address: walletAddress,
              is_scheduled: true,
              schedule_type: userPreferences.default_schedule_type as
                | 'once'
                | 'daily'
                | 'weekly'
                | 'custom',
              schedule_time: scheduleDateTime,
              next_run_time: nextRunTime,
              interval_days:
                userPreferences.default_schedule_type === 'custom' ? 1 : null,
              timezone: userPreferences.timezone,
            });

            console.log(
              `Job auto-scheduled for ${scheduleDateTime.toLocaleString()}`
            );
          } catch (scheduleError) {
            console.error('Error auto-scheduling job:', scheduleError);
            // Continue with regular job creation even if scheduling fails
          }
        }

        // Switch to this new job but keep jobs view
        await setCurrentConversation(newJob.id);

        // Refresh the jobs list to show the new job
        refreshJobsList();

        // Send the message in the background (non-blocking)
        sendMessage(message, files[0] || null, useResearch, newJob.id)
          .then(() => {
            console.log('Message sent successfully for job:', newJob.id);
            // Refresh jobs list after message is sent to update status
            refreshJobsList();
          })
          .catch((error) => {
            console.error('Error sending message:', error);
            // Refresh even on error to show the failed status
            refreshJobsList();
          });

        // Return immediately for non-blocking behavior
        return Promise.resolve();
      } catch (error) {
        console.error('Error creating new job:', error);
        throw error;
      }
    } else {
      // For regular chat (not jobs), use the existing flow
      try {
        setLocalLoading(true);
        await sendMessage(message, files[0] || null, useResearch);
        setTimeout(() => setLocalLoading(false), 200);
      } catch (error) {
        console.error('Error sending message:', error);
        setLocalLoading(false);
      }
    }
  };

  const handleLocalStorageJob = async (
    message: string,
    files: File[],
    useResearch: boolean = true
  ) => {
    try {
      // Import localStorage utilities
      const { createNewConversation } = await import(
        '@/services/chat-management/conversations'
      );

      // Create a new localStorage conversation
      const newConversationId = createNewConversation();

      // Switch to this new conversation
      await setCurrentConversation(newConversationId);

      // Refresh the jobs list to show the new conversation
      refreshJobsList();

      // Send the message in the background (non-blocking)
      sendMessage(message, files[0] || null, useResearch, newConversationId)
        .then(() => {
          console.log(
            'Message sent successfully for conversation:',
            newConversationId
          );
          // Refresh jobs list after message is sent to update status
          refreshJobsList();
        })
        .catch((error) => {
          console.error('Error sending message:', error);
          // Refresh even on error to show the failed status
          refreshJobsList();
        });

      // Return immediately for non-blocking behavior
      return Promise.resolve();
    } catch (error) {
      console.error('Error creating local conversation:', error);
      throw error;
    }
  };

  const handleJobClick = async (jobId: string) => {
    try {
      setLocalLoading(true);
      await setCurrentConversation(jobId);
      setCurrentView('chat');
      // Small delay to ensure state updates have propagated
      setTimeout(() => setLocalLoading(false), 100);
    } catch (error) {
      console.error('Error selecting job:', error);
      setLocalLoading(false);
    }
  };

  const handleRunScheduledJob = async (
    originalJobId: string,
    newJobId: string,
    initialMessage: string
  ) => {
    try {
      // Switch to the new job
      await setCurrentConversation(newJobId);

      // Send the initial message to start the conversation
      await sendMessage(initialMessage, null, true, newJobId);

      // Switch to chat view to show the conversation
      setCurrentView('chat');

      console.log(`Scheduled job executed: ${originalJobId} -> ${newJobId}`);
    } catch (error) {
      console.error('Error running scheduled job:', error);
    }
  };

  const handleBackToJobs = () => {
    setCurrentView('jobs');
  };

  const handlePrefilledSelect = async (selectedMessage: string) => {
    if (isSubmitting || showLoading) return;
    try {
      setIsSubmitting(true);
      await handleSubmit(selectedMessage, [], true);
    } catch (error) {
      console.error('Error submitting prefilled message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentView === 'jobs') {
    return (
      <Box
        className={styles.chatContainer}
        overflow="auto"
        height="auto"
        minHeight="100vh"
      >
        {/* Header */}
        <VStack spacing={6} pt={20} pb={4}>
          <MessageCounter />
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="white"
            textAlign="center"
          >
            What are we working on next?
          </Text>
        </VStack>

        {/* Main Content Area */}
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="flex-start"
          px={4}
          pt={4}
          width="100%"
        >
          {/* Centered Job Input */}
          <VStack spacing={4} width="100%" align="center">
            <Box maxWidth="600px" width="100%">
              <ChatInput
                onSubmit={handleSubmit}
                disabled={isSubmitting || showLoading}
                isSidebarOpen={isSidebarOpen}
                onToggleHelp={() => {
                  const newValue = !showPrefilledOptions;
                  setShowPrefilledOptions(newValue);
                  trackEvent('ui.prefilled_options_toggled', {
                    isOpen: newValue,
                  });
                }}
                showPrefilledOptions={showPrefilledOptions}
                placeholder="Describe a job"
              />
            </Box>

            {/* Prefilled Options */}
            {showPrefilledOptions && (
              <Box maxWidth="600px" width="100%">
                <PrefilledOptions
                  onSelect={handlePrefilledSelect}
                  isSidebarOpen={isSidebarOpen}
                />
              </Box>
            )}

            {/* Jobs List - directly under input/options */}
            <Box width="100%" maxWidth="600px">
              <JobsList
                onJobClick={handleJobClick}
                onRunScheduledJob={handleRunScheduledJob}
                isLoading={showLoading}
                refreshKey={jobsRefreshKey}
              />
            </Box>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className={styles.chatContainer}
      paddingLeft={isMobile ? '2%' : isSidebarOpen ? '30%' : '20%'}
      paddingRight={isMobile ? '2%' : '20%'}
      display="flex"
      flexDirection="column"
      zIndex="1"
    >
      <MessageList
        messages={currentMessages}
        isLoading={showLoading}
        isSidebarOpen={isSidebarOpen}
        onSubmit={handleSubmit}
        disabled={showLoading}
        showPrefilledOptions={showPrefilledOptions}
        onBackToJobs={handleBackToJobs}
      />
      <Box position="sticky" bottom={0} bg="black" pt={2} pb={2} zIndex="1">
        {/* Give ChatInput a higher z-index than sidebar to ensure it's always accessible */}
        <ChatInput
          onSubmit={handleSubmit}
          disabled={showLoading}
          isSidebarOpen={isSidebarOpen}
          onToggleHelp={() => {
            const newValue = !showPrefilledOptions;
            setShowPrefilledOptions(newValue);
            trackEvent('ui.prefilled_options_toggled', {
              isOpen: newValue,
            });
          }}
          showPrefilledOptions={showPrefilledOptions}
        />
      </Box>
    </Box>
  );
};
