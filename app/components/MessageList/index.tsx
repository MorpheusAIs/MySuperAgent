import PrefilledOptions from '@/components/ChatInput/PrefilledOptions';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { MessageItem } from '@/components/MessageItem';
import { StreamingProgress } from '@/components/StreamingProgress';
import { useChatContext } from '@/contexts/chat/useChatContext';
import { ChatMessage } from '@/services/types';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { Box, Button, VStack } from '@chakra-ui/react';
import { FC, useEffect, useRef, useState } from 'react';

type MessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  isSidebarOpen: boolean;
  onSubmit: (
    message: string,
    file: File | null,
    useResearch?: boolean
  ) => Promise<void>;
  disabled: boolean;
  showPrefilledOptions: boolean;
  onBackToJobs?: () => void;
};

export const MessageList: FC<MessageListProps> = ({
  messages,
  isLoading,
  isSidebarOpen,
  onSubmit,
  disabled,
  showPrefilledOptions,
  onBackToJobs,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevMessagesLength = useRef(0);
  const { state } = useChatContext();
  const streamingState = state.streamingState;

  // Effect for scrolling to bottom when new messages arrive or streaming state changes
  useEffect(() => {
    if (
      (messages.length > prevMessagesLength.current ||
        streamingState?.status !== 'idle') &&
      messagesEndRef.current
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages, streamingState]);

  // Fix for mobile viewport height
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const handlePrefilledSelect = async (selectedMessage: string) => {
    if (isSubmitting || disabled) return;
    try {
      setIsSubmitting(true);
      await onSubmit(selectedMessage, null, true);
    } catch (error) {
      console.error('Error submitting prefilled message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      height="calc(var(--vh, 1vh) * 100 - 185px)"
      width="100%"
    >
      {/* Back to Jobs Header */}
      {onBackToJobs && (
        <Box p={4} borderBottom="1px solid" borderColor="gray.700">
          <Button
            onClick={onBackToJobs}
            variant="ghost"
            size="sm"
            leftIcon={<ArrowBackIcon color="white" />}
            color="white"
            _hover={{ bg: 'gray.700' }}
            _active={{ bg: 'gray.700' }}
          >
            Back to Jobs
          </Button>
        </Box>
      )}

      <Box
        ref={containerRef}
        flex="1 1 auto"
        overflowY="auto"
        overflowX="hidden"
        position="relative"
        width="100%"
        css={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: '#000' },
          '&::-webkit-scrollbar-thumb': {
            background: '#333',
            borderRadius: '2px',
          },
        }}
      >
        <VStack spacing={0} width="100%" align="stretch">
          {messages.map((message, index) => (
            <div key={index} style={{ width: '100%' }}>
              <MessageItem message={message} />
            </div>
          ))}
          {streamingState && streamingState.status !== 'idle' && (
            <Box width="100%" py={2}>
              <StreamingProgress streamingState={streamingState} />
            </Box>
          )}
          {isLoading &&
            (!streamingState || streamingState.status === 'idle') && (
              <Box width="100%" py={2}>
                <LoadingIndicator />
              </Box>
            )}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </VStack>
      </Box>

      {/* Only render PrefilledOptions when showPrefilledOptions is true */}
      {showPrefilledOptions && (
        <Box width="100%" bg="black" mt="auto" position="relative" zIndex={2}>
          <PrefilledOptions
            onSelect={handlePrefilledSelect}
            isSidebarOpen={isSidebarOpen}
          />
        </Box>
      )}
    </Box>
  );
};
