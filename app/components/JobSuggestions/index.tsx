import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  useToast,
  Collapse,
  IconButton,
  Divider
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, AddIcon } from '@chakra-ui/icons';
import { useWalletAddress } from '@/services/wallet/utils';
import { trackEvent } from '@/services/analytics';

interface JobSuggestion {
  title: string;
  description: string;
  scheduleType: string;
  scheduledTime?: string;
  category: string;
  estimatedValue: string;
  initialMessage: string;
  difficulty: string;
}

interface JobSuggestionsProps {
  isVisible?: boolean;
  userContext?: string;
}

export const JobSuggestions: React.FC<JobSuggestionsProps> = ({ 
  isVisible = true, 
  userContext = "" 
}) => {
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  const fetchSuggestions = async () => {
    const walletAddress = getAddress();
    if (!walletAddress) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1/suggest-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          userContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        
        trackEvent('job.suggestions_loaded');
      }
    } catch (error) {
      console.error('Error fetching job suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createJobFromSuggestion = async (suggestion: JobSuggestion) => {
    const walletAddress = getAddress();
    if (!walletAddress) {
      toast({
        title: 'Wallet not connected',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setCreating(suggestion.title);
    try {
      // Create as scheduled job if it has a schedule
      const isScheduled = suggestion.scheduleType !== 'once' && suggestion.scheduledTime;
      
      const response = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({
          name: suggestion.title,
          description: suggestion.description,
          initial_message: suggestion.initialMessage,
          is_scheduled: isScheduled
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // If it's scheduled, we need to set up the schedule
        if (isScheduled && suggestion.scheduledTime) {
          // This would require additional API call to set up scheduling
          // For now, we'll create it as a regular job
        }

        toast({
          title: '✨ Job created successfully!',
          description: `"${suggestion.title}" has been added to your jobs`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });

        // Track creation
        trackEvent('job.created_from_suggestion');

        // Remove this suggestion from the list
        setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
        
      } else {
        throw new Error('Failed to create job');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error creating job',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(null);
    }
  };

  useEffect(() => {
    if (isVisible && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isVisible]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  const displayedSuggestions = expanded ? suggestions : suggestions.slice(0, 3);

  return (
    <Box
      bg="rgba(255, 255, 255, 0.02)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      borderRadius="12px"
      p={4}
      mb={4}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Text fontSize="md" fontWeight="semibold" color="gray.200">
              💡 Suggested Jobs
            </Text>
            <Badge colorScheme="blue" variant="subtle" size="sm">
              {suggestions.length}
            </Badge>
          </HStack>
          
          {suggestions.length > 3 && (
            <IconButton
              aria-label={expanded ? "Show less" : "Show more"}
              icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            />
          )}
        </HStack>

        {loading ? (
          <HStack justify="center" py={4}>
            <Spinner size="sm" color="blue.400" />
            <Text fontSize="sm" color="gray.400">Loading suggestions...</Text>
          </HStack>
        ) : (
          <VStack align="stretch" spacing={3}>
            {displayedSuggestions.map((suggestion, index) => (
              <Box key={suggestion.title}>
                <HStack justify="space-between" align="flex-start" spacing={3}>
                  <VStack align="flex-start" spacing={1} flex={1} minW={0}>
                    <HStack spacing={2} wrap="wrap">
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.200"
                        noOfLines={1}
                      >
                        {suggestion.title}
                      </Text>
                      <Badge 
                        colorScheme={
                          suggestion.category === 'Financial' ? 'green' :
                          suggestion.category === 'Productivity' ? 'blue' :
                          suggestion.category === 'Professional' ? 'purple' :
                          'gray'
                        }
                        size="xs"
                      >
                        {suggestion.category}
                      </Badge>
                    </HStack>
                    
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      noOfLines={2}
                      lineHeight="1.3"
                    >
                      {suggestion.description}
                    </Text>
                    
                    <HStack spacing={4} fontSize="xs" color="gray.600">
                      <Text>📅 {suggestion.scheduleType}</Text>
                      {suggestion.scheduledTime && (
                        <Text>⏰ {suggestion.scheduledTime}</Text>
                      )}
                      <Text>⭐ {suggestion.difficulty}</Text>
                    </HStack>
                  </VStack>

                  <Button
                    size="xs"
                    colorScheme="green"
                    variant="solid"
                    leftIcon={<AddIcon w={2} h={2} />}
                    isLoading={creating === suggestion.title}
                    loadingText="Creating..."
                    onClick={() => createJobFromSuggestion(suggestion)}
                    minW="80px"
                  >
                    Add
                  </Button>
                </HStack>
                
                {index < displayedSuggestions.length - 1 && (
                  <Divider borderColor="rgba(255, 255, 255, 0.05)" mt={3} />
                )}
              </Box>
            ))}
          </VStack>
        )}

        {suggestions.length > 3 && !expanded && (
          <Text
            fontSize="xs"
            color="gray.500"
            textAlign="center"
            cursor="pointer"
            onClick={() => setExpanded(true)}
            _hover={{ color: 'gray.400' }}
          >
            +{suggestions.length - 3} more suggestions
          </Text>
        )}
      </VStack>
    </Box>
  );
};