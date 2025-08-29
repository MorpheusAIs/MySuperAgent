import { Box, Text } from '@chakra-ui/react';
import { FC, useEffect, useState, useRef } from 'react';

interface StatsCarouselProps {
  fontSize?: string;
  color?: string;
  textAlign?: any;
}

export const StatsCarousel: FC<StatsCarouselProps> = ({
  fontSize = '2xl',
  color = 'rgba(255, 255, 255, 0.7)',
  textAlign = 'center',
}) => {
  const [messages, setMessages] = useState<string[]>([
    'is ready to assist you',
    'handles automated tasks',
    'saves you time'
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/stats/comprehensive');
        if (response.ok) {
          const data = await response.json();
          if (data.carouselMessages && data.carouselMessages.length > 0) {
            setMessages(data.carouselMessages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    // Poll every 30 seconds for updates
    const pollInterval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(pollInterval);
  }, []);

  // Rotate messages
  useEffect(() => {
    if (messages.length <= 1) return;
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
    }, 3000); // Change every 3 seconds
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [messages]);

  return (
    <Box 
      display="flex"
      alignItems="center"
      justifyContent={textAlign}
      fontSize={fontSize}
      fontWeight="500"
    >
      {/* Neo is ALWAYS visible */}
      <Text
        background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        backgroundClip="text"
        sx={{
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}
        fontWeight="600"
        display="inline"
      >
        Neo
      </Text>
      
      {/* Space */}
      <Text as="span" color={color} mx={1}>
        {' '}
      </Text>
      
      {/* Animated message */}
      <Box
        position="relative"
        display="inline-block"
        height="1.5em"
        overflow="hidden"
        minWidth="400px"
      >
        {messages.map((msg, index) => (
          <Text
            key={`msg-${index}`}
            color={color}
            position="absolute"
            top="0"
            left="0"
            width="100%"
            whiteSpace="nowrap"
            transition="all 0.5s ease-in-out"
            transform={`translateY(${(index - currentIndex) * 100}%)`}
            opacity={index === currentIndex ? 1 : 0}
          >
            {msg}
          </Text>
        ))}
      </Box>
    </Box>
  );
};