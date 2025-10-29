import { Box, Text } from '@chakra-ui/react';
import { FC, useEffect, useRef, useState } from 'react';

// Simple counter component - no animations
const SimpleCounter: FC<{ count: number }> = ({ count }) => {
  return (
    <Text
      as="span"
      fontWeight="700"
      fontSize="inherit"
      color="white"
      display="inline"
    >
      {count.toLocaleString()}
    </Text>
  );
};

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
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(0);
  const [jobsPerMinute, setJobsPerMinute] = useState<number>(0);
  const incrementIntervalRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<number>();

  // Listen for job creation events to increment counter
  useEffect(() => {
    const handleJobCreated = (event: any) => {
      console.log('🎯 Job created event received!', event);
      console.log('🎯 Current displayCount:', displayCount);

      // Increment counter immediately
      setDisplayCount((prev) => {
        const newCount = prev + 1;
        console.log(`🎯 Counter increment: ${prev} -> ${newCount}`);
        return newCount;
      });
    };

    console.log('🎯 Setting up jobCreated event listener');
    // Listen for custom job creation events
    window.addEventListener('jobCreated', handleJobCreated);

    return () => {
      console.log('🎯 Removing jobCreated event listener');
      window.removeEventListener('jobCreated', handleJobCreated);
    };
  }, [displayCount]);

  // Fetch stats and update target count
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/stats/comprehensive');
        if (response.ok) {
          const data = await response.json();
          const { totalJobs, jobsPerMinute: rate } = data;

          console.log('Stats fetched:', { totalJobs, jobsPerMinute: rate });

          // Set the target count
          setTargetCount(totalJobs);
          setJobsPerMinute(rate);

          // Initialize display count on first load
          if (displayCount === 0) {
            setDisplayCount(totalJobs);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    // Poll every 20 seconds for updates
    const pollInterval = setInterval(fetchStats, 20000);

    return () => clearInterval(pollInterval);
  }, [displayCount]);

  // Animate count on initial load
  useEffect(() => {
    if (displayCount === 0 && targetCount > 0) {
      // Animate from 0 to targetCount over 2 seconds
      const duration = 2000;
      const startTime = Date.now();
      const startCount = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuad = (t: number) => t * (2 - t);
        const easedProgress = easeOutQuad(progress);

        const current = Math.floor(
          startCount + (targetCount - startCount) * easedProgress
        );
        setDisplayCount(current);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [targetCount, displayCount]);

  // Continuously increment based on jobs per minute
  useEffect(() => {
    console.log('Setting up increment with jobsPerMinute:', jobsPerMinute);

    if (jobsPerMinute > 0) {
      // Calculate increment interval based on rate
      // If jobsPerMinute = 1, increment every 60 seconds
      // If jobsPerMinute = 0.1, increment every 600 seconds
      // We want smooth increments, so we'll increment fractionally more often
      const incrementsPerMinute = Math.max(1, Math.ceil(jobsPerMinute * 10)); // At least 1 increment per minute
      const intervalMs = 60000 / incrementsPerMinute; // Interval in milliseconds

      console.log(
        `Setting up increment: ${incrementsPerMinute} increments per minute, every ${intervalMs}ms`
      );

      incrementIntervalRef.current = setInterval(() => {
        setDisplayCount((prev) => {
          const increment = jobsPerMinute / incrementsPerMinute;
          const newCount = prev + increment;

          console.log(`Incrementing: ${prev} + ${increment} = ${newCount}`);

          // Don't go too far ahead of target (max 5 jobs ahead)
          if (targetCount > 0 && newCount > targetCount + 5) {
            return targetCount + 5;
          }

          return newCount;
        });
      }, intervalMs);

      return () => {
        if (incrementIntervalRef.current) {
          clearInterval(incrementIntervalRef.current);
        }
      };
    } else {
      console.log('No jobs per minute rate, not setting up increment');
    }
  }, [jobsPerMinute, targetCount]);

  // Function to render simple counter
  const renderCounter = (num: number) => {
    return <SimpleCounter count={Math.floor(num)} />;
  };

  return (
    <>
      {/* Desktop version */}
      <Box
        display={{ base: 'none', md: 'flex' }}
        alignItems="center"
        justifyContent="center"
        fontSize={fontSize}
        fontWeight="500"
        width="100%"
      >
        {/* FreeAI is ALWAYS visible */}
        <Text
          background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          backgroundClip="text"
          sx={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          fontWeight="700"
          fontSize="3xl"
          display="inline"
        >
          FreeAI
        </Text>

        {/* Space */}
        <Text as="span" color={color} mx={1}>
          {' '}
        </Text>

        {/* Stats message */}
        <Text color={color} whiteSpace="nowrap">
          has completed {renderCounter(displayCount)} total Jobs to date
        </Text>
      </Box>

      {/* Mobile version */}
      <Box
        display={{ base: 'flex', md: 'none' }}
        alignItems="center"
        justifyContent="center"
        fontSize="lg"
        fontWeight="500"
        flexDirection="column"
        textAlign="center"
        px={4}
        width="100%"
      >
        {/* FreeAI is ALWAYS visible */}
        <Text
          background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          backgroundClip="text"
          sx={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          fontWeight="700"
          fontSize="2xl"
          display="inline"
        >
          FreeAI
        </Text>

        {/* Stats message with wrapping */}
        <Text
          color={color}
          whiteSpace="normal"
          wordBreak="break-word"
          lineHeight="1.4"
          fontSize="lg"
          maxW="90vw"
          mt={1}
        >
          has completed {renderCounter(displayCount)} total Jobs to date
        </Text>
      </Box>
    </>
  );
};
