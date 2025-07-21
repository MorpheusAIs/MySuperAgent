import React, { FC, useState, useEffect } from "react";
import { Box, useBreakpointValue, Text, VStack } from "@chakra-ui/react";
import { MessageList } from "@/components/MessageList";
import { JobsList } from "@/components/JobsList";
import { ChatInput } from "@/components/ChatInput";
import PrefilledOptions from "@/components/ChatInput/PrefilledOptions";
import { useChatContext } from "@/contexts/chat/useChatContext";
import { trackEvent } from "@/services/analytics";
import { createNewConversation, getAllConversations } from "@/services/ChatManagement/conversations";
import { Conversation } from "@/services/types";
import styles from "./index.module.css";

export const Chat: FC<{ isSidebarOpen?: boolean }> = ({
  isSidebarOpen = false,
}) => {
  const { state, sendMessage, setCurrentView, setCurrentConversation } = useChatContext();
  const { messages, currentConversationId, isLoading, currentView } = state;
  const [localLoading, setLocalLoading] = useState(false);
  const [showPrefilledOptions, setShowPrefilledOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Load conversations on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setConversations(getAllConversations());
    }
  }, []);
  
  // Refresh conversations when returning to jobs view
  useEffect(() => {
    if (currentView === 'jobs' && typeof window !== 'undefined') {
      setConversations(getAllConversations());
    }
  }, [currentView]);
  const currentMessages = messages[currentConversationId] || [];
  const isMobile = useBreakpointValue({ base: true, md: false });
  const showLoading = isLoading || localLoading;

  const handleSubmit = async (
    message: string,
    file: File | null,
    useResearch?: boolean
  ) => {
    if (currentView === 'jobs') {
      // Create a new conversation but stay in jobs view
      const newConversationId = createNewConversation();
      
      // Switch to this new conversation but keep jobs view
      await setCurrentConversation(newConversationId);
      
      // Send the message in the background (non-blocking)
      // Pass the newConversationId directly to avoid race conditions with state updates
      sendMessage(message, file, useResearch ?? false, newConversationId)
        .then(() => {
          console.log("Message sent successfully for conversation:", newConversationId);
          // Refresh conversations list to show updated status
          if (typeof window !== 'undefined') {
            setConversations(getAllConversations());
          }
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          // Refresh conversations list to show updated status
          if (typeof window !== 'undefined') {
            setConversations(getAllConversations());
          }
        });
      
      // Refresh conversations list immediately to show the new job
      if (typeof window !== 'undefined') {
        setConversations(getAllConversations());
      }
      
      // Return immediately for non-blocking behavior
      return Promise.resolve();
    } else {
      // For regular chat (not jobs), use the existing flow
      try {
        setLocalLoading(true);
        await sendMessage(message, file, useResearch ?? false);
        setTimeout(() => setLocalLoading(false), 200);
      } catch (error) {
        console.error("Error sending message:", error);
        setLocalLoading(false);
      }
    }
  };
  
  const handleJobClick = async (conversationId: string) => {
    try {
      setLocalLoading(true);
      await setCurrentConversation(conversationId);
      setCurrentView('chat');
      // Small delay to ensure state updates have propagated
      setTimeout(() => setLocalLoading(false), 100);
    } catch (error) {
      console.error("Error selecting conversation:", error);
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
      await handleSubmit(selectedMessage, null, false);
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
                conversations={conversations}
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
