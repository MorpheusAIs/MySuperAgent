import React, { FC, useState, useEffect, useCallback } from "react";
import { Box, useBreakpointValue, Text, VStack } from "@chakra-ui/react";
import { MessageList } from "@/components/MessageList";
import { JobsList } from "@/components/JobsList";
import { ChatInput } from "@/components/ChatInput";
import PrefilledOptions from "@/components/ChatInput/PrefilledOptions";
import { useChatContext } from "@/contexts/chat/useChatContext";
import { trackEvent } from "@/services/analytics";
import JobsAPI from "@/services/API/jobs";
import { useWalletAddress } from "@/services/Wallet/utils";
import { Job, UserPreferences } from "@/services/Database/db";
import UserPreferencesAPI from "@/services/API/userPreferences";
import styles from "./index.module.css";

export const Chat: FC<{ isSidebarOpen?: boolean }> = ({
  isSidebarOpen = false,
}) => {
  const { state, sendMessage, setCurrentView, setCurrentConversation } = useChatContext();
  const { messages, currentConversationId, isLoading, currentView } = state;
  const [localLoading, setLocalLoading] = useState(false);
  const [showPrefilledOptions, setShowPrefilledOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
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
        const preferences = await UserPreferencesAPI.getUserPreferences(walletAddress);
        setUserPreferences(preferences);
      } catch (error) {
        console.error('Error loading user preferences:', error);
        // Don't set preferences if loading fails - use defaults
      }
    };

    loadUserPreferences();
  }, [getAddress]);
  
  // No need to refresh jobs - ChatProviderDB handles this

  const currentMessages = messages[currentConversationId] || [];
  const isMobile = useBreakpointValue({ base: true, md: false });
  const showLoading = isLoading || localLoading;

  const handleSubmit = async (
    message: string,
    file: File | null,
    useResearch: boolean = true
  ) => {
    if (currentView === 'jobs') {
      // Create a new job but stay in jobs view
      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          console.error("No wallet connected - cannot create job");
          throw new Error("Please connect your wallet to create jobs");
        }
        const shouldAutoSchedule = userPreferences?.auto_schedule_jobs || false;
        
        const newJob = await JobsAPI.createJob(walletAddress, {
          name: JobsAPI.generateJobName(message),
          initial_message: message,
          is_scheduled: shouldAutoSchedule,
          has_uploaded_file: !!file
        });
        
        // If auto-scheduling is enabled, update the job with scheduling fields
        if (shouldAutoSchedule && userPreferences) {
          try {
            // Create schedule time based on user preferences
            const now = new Date();
            const [hours, minutes] = userPreferences.default_schedule_time.split(':');
            const scheduleDateTime = new Date();
            scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // If the time has already passed today, schedule for tomorrow
            if (scheduleDateTime <= now) {
              scheduleDateTime.setDate(scheduleDateTime.getDate() + 1);
            }

            // Calculate next run time
            const nextRunTime = JobsAPI.calculateNextRunTime(
              userPreferences.default_schedule_type as 'once' | 'daily' | 'weekly' | 'monthly' | 'custom',
              scheduleDateTime,
              userPreferences.default_schedule_type === 'custom' ? 1 : undefined
            );
            
            // Update the job with scheduling information
            await JobsAPI.updateJob(newJob.id, {
              wallet_address: walletAddress,
              is_scheduled: true,
              schedule_type: userPreferences.default_schedule_type as 'once' | 'daily' | 'weekly' | 'monthly' | 'custom',
              schedule_time: scheduleDateTime,
              next_run_time: nextRunTime,
              interval_days: userPreferences.default_schedule_type === 'custom' ? 1 : null,
              timezone: userPreferences.timezone,
            });
            
            console.log(`Job auto-scheduled for ${scheduleDateTime.toLocaleString()}`);
          } catch (scheduleError) {
            console.error('Error auto-scheduling job:', scheduleError);
            // Continue with regular job creation even if scheduling fails
          }
        }
        
        // Switch to this new job but keep jobs view
        await setCurrentConversation(newJob.id);
        
        // Send the message in the background (non-blocking)
        sendMessage(message, file, useResearch, newJob.id)
          .then(() => {
            console.log("Message sent successfully for job:", newJob.id);
          })
          .catch((error) => {
            console.error("Error sending message:", error);
          });
        
        // Return immediately for non-blocking behavior
        return Promise.resolve();
      } catch (error) {
        console.error("Error creating new job:", error);
        throw error;
      }
    } else {
      // For regular chat (not jobs), use the existing flow
      try {
        setLocalLoading(true);
        await sendMessage(message, file, useResearch);
        setTimeout(() => setLocalLoading(false), 200);
      } catch (error) {
        console.error("Error sending message:", error);
        setLocalLoading(false);
      }
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
      console.error("Error selecting job:", error);
      setLocalLoading(false);
    }
  };
  
  const handleBackToJobs = () => {
    setCurrentView('jobs');
  };

  const handlePrefilledSelect = async (selectedMessage: string) => {
    if (isSubmitting || showLoading) return;
    try {
      setIsSubmitting(true);
      await handleSubmit(selectedMessage, null, true);
    } catch (error) {
      console.error("Error submitting prefilled message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentView === 'jobs') {
    return (
      <Box
        className={styles.chatContainer}
        paddingLeft={isMobile ? "2%" : isSidebarOpen ? "30%" : "20%"}
        paddingRight={isMobile ? "2%" : "20%"}
        display="flex"
        flexDirection="column"
        zIndex="1"
        minHeight="100vh"
      >
        {/* Header */}
        <VStack spacing={6} pt={20} pb={4}>
          <Text fontSize="2xl" fontWeight="bold" color="white" textAlign="center">
            What are we working on next?
          </Text>
        </VStack>
        
        {/* Main Content Area */}
        <Box flex={1} display="flex" flexDirection="column" justifyContent="flex-start" px={4} pt={8}>
          {/* Centered Job Input */}
          <VStack spacing={6} width="100%" align="center">
            <Box maxWidth="600px" width="100%">
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
                placeholder="Describe a job"
              />
            </Box>
            
            {/* Prefilled Options - shows between input and jobs list when toggled */}
            {showPrefilledOptions && (
              <Box 
                width="100%" 
                maxWidth="600px" 
                mt={2}
                mb={-2}
                borderRadius="12px"
                overflow="hidden"
                bg="rgba(0, 0, 0, 0.5)"
                border="1px solid"
                borderColor="gray.800"
              >
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
                isLoading={showLoading}
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
      paddingLeft={isMobile ? "2%" : isSidebarOpen ? "30%" : "20%"}
      paddingRight={isMobile ? "2%" : "20%"}
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
