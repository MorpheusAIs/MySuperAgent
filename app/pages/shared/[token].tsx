import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { ExternalLinkIcon, CalendarIcon, ViewIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { Job, Message } from '@/services/database/db';
import { renderMessage } from '@/components/MessageItem/CustomMessageRenderers';
import { ChatMessage } from '@/services/types';
import BASE_URL from '@/services/config/constants';
import { trackEvent } from '@/services/analytics';

interface SharedJobData {
  job: Job;
  messages: Message[];
  share: {
    title: string | null;
    description: string | null;
    viewCount: number;
    createdAt: string;
    expiresAt: string | null;
  };
}

const getStatusColor = (status: Job['status']) => {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'running':
      return 'blue';
    case 'pending':
      return 'yellow';
    default:
      return 'gray';
  }
};

const convertMessageToChatMessage = (msg: Message): ChatMessage => {
  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    metadata: msg.metadata,
    error_message: msg.error_message,
    requires_action: msg.requires_action,
    action_type: msg.action_type,
  };
};

export default function SharedJobPage() {
  const router = useRouter();
  const { token } = router.query;
  const toast = useToast();
  
  const [jobData, setJobData] = useState<SharedJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || typeof token !== 'string') return;

    const fetchSharedJob = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${BASE_URL}/api/v1/shared/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load shared job');
        }

        const data: SharedJobData = await response.json();
        setJobData(data);

        // Track page view
        trackEvent('shared_job.page_viewed', {
          jobId: data.job.id,
          shareTitle: data.share.title || undefined,
          messageCount: data.messages.length,
          viewCount: data.share.viewCount,
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load shared job';
        setError(errorMessage);
        
        trackEvent('shared_job.load_error', {
          token: token.substring(0, 8) + '...',
          error: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSharedJob();
  }, [token]);

  const handleCreateOwnJob = () => {
    trackEvent('shared_job.cta_clicked', {
      jobId: jobData?.job.id,
      action: 'create_own_job',
    });
    
    router.push('/');
  };

  if (loading) {
    return (
      <Box bg="#000" minH="100vh">
        <Container maxW="4xl" py={8}>
          <VStack spacing={4} align="center" minH="50vh" justify="center">
            <Spinner size="lg" color="blue.400" />
            <Text color="white">Loading shared job...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error || !jobData) {
    return (
      <Box bg="#000" minH="100vh">
        <Container maxW="4xl" py={8}>
          <VStack spacing={6} align="center" minH="50vh" justify="center">
            <Alert 
              status="error" 
              borderRadius="lg"
              bg="rgba(239, 68, 68, 0.1)"
              border="1px solid rgba(239, 68, 68, 0.2)"
              color="rgba(255, 255, 255, 0.9)"
            >
              <AlertIcon color="red.400" />
              {error || 'Shared job not found or has expired'}
            </Alert>
            
            <VStack spacing={4} textAlign="center">
              <Text color="white">
                This shared job may have been removed or expired.
              </Text>
              <Button
                bg="#59F886"
                color="#000"
                onClick={handleCreateOwnJob}
                leftIcon={<ExternalLinkIcon />}
                _hover={{
                  bg: "#59F886",
                  transform: 'scale(1.05)',
                  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                }}
                borderRadius="24px"
                fontFamily="Inter"
              >
                Create Your Own Job
              </Button>
            </VStack>
          </VStack>
        </Container>
      </Box>
    );
  }

  const { job, messages, share } = jobData;
  const displayTitle = share.title || job.name;
  const displayDescription = share.description || job.description;

  return (
    <Box bg="#000" minH="100vh">
      <Container maxW="4xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" align="flex-start">
                <VStack spacing={2} align="flex-start" flex={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="white" fontFamily="Inter">
                    {displayTitle}
                  </Text>
                  
                  {displayDescription && (
                    <Text color="rgba(255, 255, 255, 0.85)" fontSize="md" fontFamily="Inter">
                      {displayDescription}
                    </Text>
                  )}
                </VStack>
                
                <Badge
                  colorScheme={getStatusColor(job.status)}
                  variant="subtle"
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {job.status}
                </Badge>
              </HStack>

              {/* Job metadata */}
              <HStack spacing={6} fontSize="sm" color="rgba(255, 255, 255, 0.7)">
                <HStack spacing={2}>
                  <CalendarIcon w={4} h={4} />
                  <Text fontFamily="Inter">
                    Created {new Date(job.created_at).toLocaleDateString()}
                  </Text>
                </HStack>
                
                <HStack spacing={2}>
                  <ViewIcon w={4} h={4} />
                  <Text fontFamily="Inter">{share.viewCount} views</Text>
                </HStack>
                
                {share.expiresAt && (
                  <HStack spacing={2}>
                    <CalendarIcon w={4} h={4} />
                    <Text fontFamily="Inter">
                      Expires {new Date(share.expiresAt).toLocaleDateString()}
                    </Text>
                  </HStack>
                )}
              </HStack>

              <Divider borderColor="rgba(255, 255, 255, 0.1)" />
            </VStack>
          </Box>

          {/* Messages */}
          <VStack spacing={4} align="stretch">
            {messages.map((message) => {
              const chatMessage = convertMessageToChatMessage(message);
              return (
                <Box
                  key={message.id}
                  p={4}
                  bg={message.role === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)'}
                  borderRadius="12px"
                  border="1px solid"
                  borderColor={message.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'}
                >
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Badge
                        colorScheme={message.role === 'user' ? 'blue' : 'green'}
                        variant="subtle"
                        size="sm"
                      >
                        {message.role === 'user' ? 'User' : 'Assistant'}
                      </Badge>
                      
                      {message.agent_name && (
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)" fontFamily="Inter">
                          Agent: {message.agent_name}
                        </Text>
                      )}
                    </HStack>
                    
                    <Box color="white" sx={{ '& *': { color: 'white !important' } }}>
                      {renderMessage(chatMessage)}
                    </Box>
                  </VStack>
                </Box>
              );
            })}
          </VStack>

            {/* Call to action */}
            <Box
              mt={8}
              p={6}
              bg="rgba(89, 248, 134, 0.1)"
              borderRadius="12px"
              border="1px solid"
              borderColor="rgba(89, 248, 134, 0.2)"
              textAlign="center"
            >
              <VStack spacing={4}>
                <Text fontSize="lg" fontWeight="semibold" color="white" fontFamily="Inter">
                  Want to create your own AI agent job?
                </Text>
                <Text color="rgba(255, 255, 255, 0.85)" fontFamily="Inter">
                  Join MySuperAgent to access our full suite of AI agents and tools
                </Text>
                <Button
                  bg="#59F886"
                  color="#000"
                  size="lg"
                  onClick={handleCreateOwnJob}
                  leftIcon={<ExternalLinkIcon />}
                  _hover={{
                    bg: "#59F886",
                    transform: 'scale(1.05)',
                    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  }}
                  borderRadius="24px"
                  fontFamily="Inter"
                  fontWeight="600"
                >
                  Get Started
                </Button>
              </VStack>
            </Box>

            {/* Footer */}
            <Box textAlign="center" pt={6}>
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontFamily="Inter">
                Powered by{' '}
                <ChakraLink
                  as={Link}
                  href="/"
                  color="#59F886"
                  _hover={{ color: "#48D96E" }}
                  fontWeight="500"
                >
                  MySuperAgent
                </ChakraLink>
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>
    );
}