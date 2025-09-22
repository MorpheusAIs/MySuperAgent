import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  Button,
  Collapse,
  IconButton,
  Tooltip,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { InfoIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useWalletAddress } from '@/services/wallet/utils';

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

interface RateLimitStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ 
  showDetails = false,
  compact = false 
}) => {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(showDetails);
  const { getAddress } = useWalletAddress();
  const bgColor = useColorModeValue('gray.50', 'rgba(255, 255, 255, 0.02)');
  const borderColor = useColorModeValue('gray.200', 'rgba(255, 255, 255, 0.1)');

  useEffect(() => {
    const fetchStatus = async () => {
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
    };

    fetchStatus();
  }, [getAddress]);

  const getProgressColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'orange';
    return 'green';
  };

  const getUserTypeColor = (userType: string): string => {
    switch (userType) {
      case 'anonymous': return 'gray';
      case 'free': return 'blue';
      case 'pro': return 'purple';
      default: return 'gray';
    }
  };

  const formatResetTime = (resetTime: string): string => {
    const reset = new Date(resetTime);
    const now = new Date();
    const diffMs = reset.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  if (!status) {
    return null;
  }

  if (compact) {
    return (
      <Box
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="8px"
        p={3}
        mb={3}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Badge 
              colorScheme={getUserTypeColor(status.userType)} 
              variant="subtle"
              size="sm"
              textTransform="capitalize"
            >
              {status.userType}
            </Badge>
            <Text fontSize="sm" color="gray.500">
              Jobs: {status.limits.jobs.remaining}/{status.limits.jobs.max}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Messages: {status.limits.messages.remaining}/{status.limits.messages.max}
            </Text>
          </HStack>
          
          {status.upgradeInfo.available && (
            <Button size="xs" colorScheme="blue" variant="outline">
              Upgrade
            </Button>
          )}
        </HStack>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="12px"
      p={4}
      mb={4}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Text fontSize="md" fontWeight="semibold" color="gray.200">
              Usage Limits
            </Text>
            <Badge 
              colorScheme={getUserTypeColor(status.userType)} 
              variant="solid"
              size="sm"
              textTransform="capitalize"
            >
              {status.userType} User
            </Badge>
          </HStack>
          
          <HStack spacing={2}>
            {status.upgradeInfo.available && (
              <Button size="sm" colorScheme="blue" variant="outline">
                Upgrade to {status.upgradeInfo.nextTier}
              </Button>
            )}
            <IconButton
              aria-label={expanded ? "Show less" : "Show more"}
              icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            />
          </HStack>
        </HStack>

        {/* Quick overview */}
        <HStack spacing={4} flexWrap="wrap">
          <VStack spacing={1} align="flex-start">
            <Text fontSize="xs" color="gray.500">Jobs Today</Text>
            <HStack spacing={1}>
              <Text fontSize="sm" fontWeight="medium">
                {status.limits.jobs.current}/{status.limits.jobs.max}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({status.limits.jobs.remaining} left)
              </Text>
            </HStack>
          </VStack>
          
          <VStack spacing={1} align="flex-start">
            <Text fontSize="xs" color="gray.500">Messages/Hour</Text>
            <HStack spacing={1}>
              <Text fontSize="sm" fontWeight="medium">
                {status.limits.messages.current}/{status.limits.messages.max}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({status.limits.messages.remaining} left)
              </Text>
            </HStack>
          </VStack>
        </HStack>

        <Collapse in={expanded}>
          <VStack align="stretch" spacing={4} pt={2}>
            <Divider borderColor="rgba(255, 255, 255, 0.05)" />
            
            {/* Detailed limits */}
            {Object.entries(status.limits).map(([key, limit]) => (
              <Box key={key}>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                      {key === 'orchestration' ? 'AI Requests' : key}
                    </Text>
                    <Tooltip label={limit.description} hasArrow>
                      <InfoIcon w={3} h={3} color="gray.400" />
                    </Tooltip>
                  </HStack>
                  <HStack spacing={2}>
                    <Text fontSize="sm">
                      {limit.current}/{limit.max}
                    </Text>
                    {limit.current > 0 && (
                      <Text fontSize="xs" color="gray.500">
                        Resets in {formatResetTime(limit.resetTime)}
                      </Text>
                    )}
                  </HStack>
                </HStack>
                
                <Progress
                  value={(limit.current / limit.max) * 100}
                  colorScheme={getProgressColor(limit.current, limit.max)}
                  size="sm"
                  borderRadius="full"
                />
              </Box>
            ))}

            {/* Upgrade benefits */}
            {status.upgradeInfo.available && status.upgradeInfo.benefits.length > 0 && (
              <Box
                bg="rgba(59, 130, 246, 0.1)"
                border="1px solid rgba(59, 130, 246, 0.2)"
                borderRadius="8px"
                p={3}
              >
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Upgrade Benefits:
                </Text>
                <VStack align="flex-start" spacing={1}>
                  {status.upgradeInfo.benefits.map((benefit, index) => (
                    <Text key={index} fontSize="xs" color="gray.300">
                      • {benefit}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};