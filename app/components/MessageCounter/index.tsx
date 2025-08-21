import { Box, Text } from '@chakra-ui/react';
import { FC, useCallback, useEffect, useState } from 'react';

interface MessageCounterProps {
  fontSize?: string;
  color?: string;
  textAlign?: any;
}

export const MessageCounter: FC<MessageCounterProps> = ({
  fontSize = '2xl',
  color = 'rgba(255, 255, 255, 0.7)',
  textAlign = 'center',
}) => {
  const [totalMessages, setTotalMessages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchMessageCount = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/stats/messages');
      if (response.ok) {
        const data = await response.json();
        if (typeof data.totalMessages === 'number') {
          setTotalMessages(data.totalMessages);
          setHasError(false);
          setRetryCount(0);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch message count:', error);
      setHasError(true);
      setRetryCount((prev) => prev + 1);

      if (totalMessages === null && retryCount < 3) {
        return;
      }

      setIsLoading(false);
    } finally {
      if (!hasError || retryCount >= 3) {
        setIsLoading(false);
      }
    }
  }, [totalMessages, retryCount, hasError]);

  useEffect(() => {
    fetchMessageCount();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchMessageCount, 5000);

    return () => clearInterval(interval);
  }, [fetchMessageCount]);

  if (isLoading) {
    return (
      <Box textAlign={textAlign}>
        <Text fontSize={fontSize} fontWeight="500">
          <Text
            as="span"
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            bgClip="text"
            color="transparent"
            fontWeight="600"
          >
            SuperAgent
          </Text>
          <Text as="span" color={color}>
            {' '}
            has completed{' '}
          </Text>
          <Text
            as="span"
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            bgClip="text"
            color="transparent"
            fontWeight="600"
          >
            __
          </Text>
          <Text as="span" color={color}>
            {' '}
            jobs
          </Text>
        </Text>
      </Box>
    );
  }

  // Show error state if we have an error and no cached data
  if (hasError && totalMessages === null) {
    return (
      <Box textAlign={textAlign}>
        <Text fontSize={fontSize} fontWeight="500">
          <Text
            as="span"
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            bgClip="text"
            color="transparent"
            fontWeight="600"
          >
            SuperAgent
          </Text>
          <Text as="span" color={color}>
            {' '}
            is ready to complete jobs
          </Text>
        </Text>
      </Box>
    );
  }

  // If we have an error but cached data, show cached data
  if (totalMessages === null) {
    return null;
  }

  return (
    <Box textAlign={textAlign}>
      <Text fontSize={fontSize} fontWeight="500">
        <Text
          as="span"
          background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          bgClip="text"
          color="transparent"
          fontWeight="600"
        >
          SuperAgent
        </Text>
        <Text as="span" color={color}>
          {' '}
          has completed{' '}
        </Text>
        <Text
          as="span"
          background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          bgClip="text"
          color="transparent"
          fontWeight="600"
        >
          {totalMessages.toLocaleString()}
        </Text>
        <Text as="span" color={hasError ? 'rgba(255, 255, 255, 0.5)' : color}>
          {' '}
          jobs{hasError ? ' (cached)' : ''}
        </Text>
      </Text>
    </Box>
  );
};
