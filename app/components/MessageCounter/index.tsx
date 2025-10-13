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
    humanEquivalentHours: number;
    totalIncomeEarned: number;
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

  // Single message display - no carousel needed
  const message = stats?.carouselMessages?.[0] || 'has completed 0 total jobs to date';

  return (
    <Box textAlign={textAlign}>
      <Text
        fontSize={fontSize}
        fontWeight="500"
        display="inline-flex"
        alignItems="baseline"
      >
        {/* FreeAI branding */}
        <Text
          as="span"
          background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          bgClip="text"
          color="transparent"
          fontWeight="600"
        >
          FreeAI
        </Text>

        <Text as="span" color={color} mx={1}>
          {' '}
        </Text>

        {/* Single message display */}
        <Text as="span" color={color}>
          {message}
        </Text>
      </Text>
    </Box>
  );
};
