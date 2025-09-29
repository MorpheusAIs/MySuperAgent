import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { useWalletAddress } from '@/services/wallet/utils';
import styles from './HeaderRateLimitStatus.module.css';

interface RateLimitInfo {
  current: number;
  max: number;
  remaining: number;
  resetTime: string;
  windowDescription: string;
  description: string;
}

interface RateLimitStatus {
  userType: 'anonymous' | 'free' | 'pro';
  identifier: string;
  limits: {
    jobs: RateLimitInfo;
    messages: RateLimitInfo;
    orchestration: RateLimitInfo;
    scheduling: RateLimitInfo;
  };
  upgradeInfo: {
    available: boolean;
    currentTier: string;
    nextTier: string;
    benefits: string[];
  };
}

export const HeaderRateLimitStatus: React.FC = () => {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { getAddress } = useWalletAddress();

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const walletAddress = getAddress();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (walletAddress) {
        headers['x-wallet-address'] = walletAddress;
      }

      const response = await fetch('/api/v1/rate-limit-status', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching rate limit status:', error);
    } finally {
      setLoading(false);
    }
  }, [getAddress]);

  useEffect(() => {
    fetchStatus();
    
    // Refresh rate limit status every 30 seconds instead of 3 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Also refresh when focus returns to the window
  useEffect(() => {
    const handleFocus = () => {
      fetchStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchStatus]);

  const getUserTypeColor = (userType: string): string => {
    switch (userType) {
      case 'anonymous': return 'gray';
      case 'free': return 'blue';
      case 'pro': return 'purple';
      default: return 'gray';
    }
  };

  const getUsageColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return '#ef4444'; // red
    if (percentage >= 70) return '#f59e0b'; // orange  
    return '#10b981'; // green
  };

  if (!status || loading) {
    return null;
  }

  const jobsPercentage = (status.limits.jobs.current / status.limits.jobs.max) * 100;
  const messagesPercentage = (status.limits.messages.current / status.limits.messages.max) * 100;

  return (
    <Tooltip 
      label={
        <Box p={2}>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Usage Limits</Text>
          <Text fontSize="xs" mb={1}>
            Jobs: {status.limits.jobs.current}/{status.limits.jobs.max} ({status.limits.jobs.remaining} remaining)
          </Text>
          <Text fontSize="xs" mb={1}>
            Messages: {status.limits.messages.current}/{status.limits.messages.max} ({status.limits.messages.remaining} remaining)
          </Text>
          {status.upgradeInfo.available && (
            <Text fontSize="xs" color="blue.300" mt={2}>
              Upgrade to {status.upgradeInfo.nextTier} for higher limits
            </Text>
          )}
        </Box>
      }
      placement="bottom"
      hasArrow
    >
      <Box className={styles.container}>
        <HStack spacing={3} align="center">
          {/* User Type Badge */}
          <Badge 
            size="sm"
            colorScheme={getUserTypeColor(status.userType)}
            className={styles.userTypeBadge}
            textTransform="capitalize"
          >
            {status.userType}
          </Badge>

          {/* Jobs Usage */}
          <Box className={styles.usageItem}>
            <Text className={styles.usageLabel}>Jobs</Text>
            <HStack spacing={1} align="center">
              <Box 
                className={styles.usageBar}
                style={{
                  background: `linear-gradient(to right, ${getUsageColor(status.limits.jobs.current, status.limits.jobs.max)} ${jobsPercentage}%, rgba(255,255,255,0.1) ${jobsPercentage}%)`
                }}
              />
              <Text className={styles.usageText}>
                {status.limits.jobs.max - status.limits.jobs.current}/{status.limits.jobs.max}
              </Text>
            </HStack>
          </Box>

          {/* Messages Usage */}
          <Box className={styles.usageItem}>
            <Text className={styles.usageLabel}>Messages</Text>
            <HStack spacing={1} align="center">
              <Box 
                className={styles.usageBar}
                style={{
                  background: `linear-gradient(to right, ${getUsageColor(status.limits.messages.current, status.limits.messages.max)} ${messagesPercentage}%, rgba(255,255,255,0.1) ${messagesPercentage}%)`
                }}
              />
              <Text className={styles.usageText}>
                {status.limits.messages.max - status.limits.messages.current}/{status.limits.messages.max}
              </Text>
            </HStack>
          </Box>
        </HStack>
      </Box>
    </Tooltip>
  );
};