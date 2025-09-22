import JobsAPI from '@/services/api-clients/jobs';
import { Message } from '@/services/database/db';
import { useWalletAddress } from '@/services/wallet/utils';
import { Avatar, Box, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';

interface JobHoverPreviewProps {
  jobId: string;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const JobHoverPreview: FC<JobHoverPreviewProps> = ({
  jobId,
  isVisible,
  position,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAddress } = useWalletAddress();

  useEffect(() => {
    if (!isVisible || !jobId) return;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          setError('Wallet not connected');
          return;
        }

        const fetchedMessages = await JobsAPI.getMessages(walletAddress, jobId);
        // Sort by order_index to get the correct sequence
        const sortedMessages = fetchedMessages.sort(
          (a, b) => a.order_index - b.order_index
        );
        // Take only the last 5 messages for preview
        setMessages(sortedMessages.slice(-5));
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [isVisible, jobId, getAddress]);

  if (!isVisible) return null;

  const formatMessageContent = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'object' && content.text) {
      return content.text;
    }
    if (typeof content === 'object' && content.content) {
      return content.content;
    }
    return JSON.stringify(content);
  };

  const truncateContent = (
    content: string,
    maxLength: number = 150
  ): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Box
      position="fixed"
      left={`${position.x + 10}px`}
      top={`${position.y - 10}px`}
      zIndex={1000}
      bg="rgba(0, 0, 0, 0.95)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      borderRadius="12px"
      p={4}
      maxW="400px"
      maxH="300px"
      overflow="hidden"
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
      backdropFilter="blur(10px)"
      pointerEvents="none"
    >
      <VStack align="stretch" spacing={3} maxH="280px" overflowY="auto">
        {loading ? (
          <HStack justify="center" py={4}>
            <Spinner size="sm" color="blue.400" />
            <Text fontSize="sm" color="gray.400">
              Loading messages...
            </Text>
          </HStack>
        ) : error ? (
          <Text fontSize="sm" color="red.400" textAlign="center" py={2}>
            {error}
          </Text>
        ) : messages.length === 0 ? (
          <Text fontSize="sm" color="gray.400" textAlign="center" py={2}>
            No messages yet
          </Text>
        ) : (
          messages.map((message, index) => (
            <HStack key={message.id} align="flex-start" spacing={3}>
              <Avatar
                size="xs"
                bg={message.role === 'user' ? 'blue.500' : 'green.500'}
                color="white"
                name={message.role === 'user' ? 'U' : 'M'}
                fontSize="10px"
                flexShrink={0}
                mt={1}
              />
              <VStack align="flex-start" spacing={1} flex={1} minW={0}>
                <HStack spacing={2} fontSize="xs" color="gray.400">
                  <Text fontWeight="medium" textTransform="capitalize">
                    {message.role === 'assistant'
                      ? 'FreeAI'
                      : message.role}
                  </Text>
                  {message.agent_name && message.agent_name !== 'default' && (
                    <>
                      <Text>•</Text>
                      <Text>{message.agent_name}</Text>
                    </>
                  )}
                </HStack>
                <Text
                  fontSize="sm"
                  color="gray.200"
                  lineHeight="1.4"
                  wordBreak="break-word"
                >
                  {truncateContent(formatMessageContent(message.content))}
                </Text>
                {message.error_message && (
                  <Text fontSize="xs" color="red.400" fontStyle="italic">
                    Error: {message.error_message}
                  </Text>
                )}
              </VStack>
            </HStack>
          ))
        )}
      </VStack>
    </Box>
  );
};
