import { Box, Text } from '@chakra-ui/react';
import { FC, useCallback, useEffect, useState } from 'react';

interface MessageCounterProps {
  fontSize?: string;
  color?: string;
  textAlign?: any;
}

interface ComprehensiveStats {
  stats: {
    totalJobs: number;
    recurringJobs: number;
    activeScheduledJobs: number;
    completedToday: number;
    timeSavedHours: number;
    efficiencyScore: number;
    uptime: string;
  };
  carouselMessages: string[];
  timestamp: string;
}

export const MessageCounter: FC<MessageCounterProps> = ({
  fontSize = '2xl',
  color = 'rgba(255, 255, 255, 0.7)',
  textAlign = 'center',
}) => {
  const [stats, setStats] = useState<ComprehensiveStats | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/stats/comprehensive');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch comprehensive stats:', error);
    }
  }, []);

  // Fetch stats only once on mount and set up polling
  useEffect(() => {
    fetchStats();
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Carousel animation logic
  useEffect(() => {
    const messages = stats?.carouselMessages || [
      'has completed 0 jobs',
      'is ready to assist you',
      'handles automated tasks',
      'saves you time'
    ];

    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [stats]);

  const messages = stats?.carouselMessages || [
    'has completed 0 jobs',
    'is ready to assist you', 
    'handles automated tasks',
    'saves you time'
  ];

  return (
    <Box 
      textAlign={textAlign} 
      position="relative" 
      height="40px" 
      overflow="hidden"
    >
      <style jsx global>{`
        @keyframes slideUp {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          10% {
            transform: translateY(0);
            opacity: 1;
          }
          90% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        
        .carousel-text {
          animation: slideUp 4s ease-in-out infinite;
        }
      `}</style>
      
      <Text fontSize={fontSize} fontWeight="500" display="inline-flex" alignItems="baseline">
        {/* Neo is ALWAYS visible and fixed */}
        <Text
          as="span"
          background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          bgClip="text"
          color="transparent"
          fontWeight="600"
        >
          Neo
        </Text>
        
        <Text as="span" color={color} mx={1}>
          {' '}
        </Text>
        
        {/* Carousel container - inline-block to stay on same line */}
        <Box
          as="span"
          display="inline-block"
          position="relative"
          height="1.5em"
          width="auto"
          overflow="hidden"
          verticalAlign="baseline"
        >
          {messages.map((msg, index) => (
            <Text
              key={`${msg}-${index}`}
              as="span"
              color={color}
              position="absolute"
              whiteSpace="nowrap"
              transform={`translateY(${(index - currentMessageIndex) * 100}%)`}
              transition="transform 0.5s ease-in-out"
              opacity={index === currentMessageIndex ? 1 : 0}
              display="block"
            >
              {msg}
            </Text>
          ))}
        </Box>
      </Text>
    </Box>
  );
};