import React, { FC, useState } from "react";
import { Box, useBreakpointValue, Text, VStack } from "@chakra-ui/react";
import { MessageList } from "@/components/MessageList";
import { JobsList, Job } from "@/components/JobsList";
import { ChatInput } from "@/components/ChatInput";
import { useChatContext } from "@/contexts/chat/useChatContext";
import { trackEvent } from "@/services/analytics";
import styles from "./index.module.css";

export const Chat: FC<{ isSidebarOpen?: boolean }> = ({
  isSidebarOpen = false,
}) => {
  const { state, sendMessage, addJob, updateJob, setCurrentView, selectJob } = useChatContext();
  const { messages, currentConversationId, isLoading, jobs, currentView } = state;
  const [localLoading, setLocalLoading] = useState(false);
  const [showPrefilledOptions, setShowPrefilledOptions] = useState(false);
  const currentMessages = messages[currentConversationId] || [];
  const isMobile = useBreakpointValue({ base: true, md: false });
  const showLoading = isLoading || localLoading;

  const handleSubmit = async (
    message: string,
    file: File | null,
    useResearch?: boolean
  ) => {
    try {
      setLocalLoading(true);
      
      if (currentView === 'jobs') {
        // Create a new job and conversation
        const newJobId = Date.now().toString();
        const newJob: Job = {
          id: newJobId,
          title: message.length > 50 ? message.substring(0, 50) + '...' : message,
          description: message,
          status: 'running',
          createdAt: new Date(),
          messageCount: 0,
          lastMessage: undefined
        };
        
        // Add the job
        addJob(newJob);
        
        // Switch to this new conversation
        await selectJob(newJobId);
      }
      
      // Send the message (this will use the current conversation ID)
      await sendMessage(message, file, useResearch ?? false);
      
      // Update job after message is sent
      if (currentView === 'chat' && currentConversationId !== 'default') {
        const job = jobs.find(j => j.id === currentConversationId);
        if (job) {
          const messages = state.messages[currentConversationId] || [];
          updateJob(currentConversationId, {
            messageCount: messages.length,
            lastMessage: messages[messages.length - 1]?.content
          });
        }
      }
      
      setTimeout(() => setLocalLoading(false), 200);
    } catch (error) {
      console.error("Error sending message:", error);
      setLocalLoading(false);
    }
  };
  
  const handleJobClick = async (jobId: string) => {
    try {
      setLocalLoading(true);
      await selectJob(jobId);
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
        <Box flex={1} display="flex" flexDirection="column" justifyContent={jobs.length > 0 ? "flex-start" : "center"} px={4} pt={jobs.length > 0 ? 8 : 0}>
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
            
            {/* Jobs List - directly under input */}
            <Box width="100%" maxWidth="600px">
              <JobsList
                jobs={jobs}
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
