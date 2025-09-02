import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Switch,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Divider,
  Badge,
  Box,
  Alert,
  AlertIcon,
  Code,
  Select,
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon, ExternalLinkIcon, ViewIcon } from '@chakra-ui/icons';
import { Job, SharedJob } from '@/services/database/db';
import BASE_URL from '@/services/config/constants';
import { trackEvent } from '@/services/analytics';

interface ShareJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  walletAddress: string;
}

interface ShareResponse {
  shareToken: string;
  shareUrl: string;
  sharedJob: SharedJob;
}

export default function ShareJobModal({
  isOpen,
  onClose,
  job,
  walletAddress,
}: ShareJobModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<ShareResponse | null>(null);
  const [existingShare, setExistingShare] = useState<SharedJob | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [copied, setCopied] = useState(false);

  // Load existing share if it exists
  useEffect(() => {
    if (!isOpen || !job.id) return;

    const loadExistingShare = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/v1/jobs/${job.id}/share`, {
          headers: { 'x-wallet-address': walletAddress },
        });

        if (response.ok) {
          const data = await response.json();
          setExistingShare(data.sharedJob);
          setShareData({ ...data });
          setTitle(data.sharedJob.title || '');
          setDescription(data.sharedJob.description || '');
          setIsPublic(data.sharedJob.is_public);
        }
      } catch (error) {
        // No existing share, that's fine
      }
    };

    loadExistingShare();
  }, [isOpen, job.id, walletAddress]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setExpiresIn('never');
      setCopied(false);
      setShareData(null);
      setExistingShare(null);
    }
  }, [isOpen]);

  const handleCreateShare = async () => {
    try {
      setLoading(true);

      const requestBody: any = {
        title: title || undefined,
        description: description || undefined,
        isPublic,
      };

      if (expiresIn !== 'never') {
        requestBody.expiresIn = parseInt(expiresIn);
      }

      const response = await fetch(`${BASE_URL}/api/v1/jobs/${job.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create share');
      }

      const data: ShareResponse = await response.json();
      setShareData(data);
      setExistingShare(data.sharedJob);

      trackEvent('shared_job.created', {
        jobId: job.id,
        hasCustomTitle: !!title,
        hasCustomDescription: !!description,
        isPublic,
        hasExpiration: expiresIn !== 'never',
        expiresIn: expiresIn !== 'never' ? parseInt(expiresIn) : null,
      });

      toast({
        title: 'Share link created!',
        description: 'Your job is now shareable',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: 'Error creating share',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareData?.shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      trackEvent('shared_job.link_copied', {
        jobId: job.id,
        shareToken: shareData.shareToken,
      });

      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteShare = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/api/v1/jobs/${job.id}/share`, {
        method: 'DELETE',
        headers: { 'x-wallet-address': walletAddress },
      });

      if (!response.ok) {
        throw new Error('Failed to delete share');
      }

      setShareData(null);
      setExistingShare(null);

      trackEvent('shared_job.deleted', {
        jobId: job.id,
        viewCount: existingShare?.view_count || 0,
      });

      toast({
        title: 'Share link removed',
        description: 'This job is no longer shareable',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      toast({
        title: 'Error removing share',
        description: 'Failed to remove share link',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
      <ModalContent bg="#1a1a1a" border="1px solid rgba(255, 255, 255, 0.1)">
        <ModalHeader color="gray.100">
          Share Job: {job.name}
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Existing share info */}
            {existingShare && (
              <Alert status="info" bg="rgba(59, 130, 246, 0.1)" border="1px solid rgba(59, 130, 246, 0.2)">
                <AlertIcon color="blue.400" />
                <VStack spacing={2} align="flex-start" flex={1}>
                  <Text color="gray.100">This job is already shared</Text>
                  <HStack spacing={4} fontSize="sm" color="gray.400">
                    <HStack spacing={1}>
                      <ViewIcon w={3} h={3} />
                      <Text>{existingShare.view_count} views</Text>
                    </HStack>
                    <Text>
                      Created {new Date(existingShare.created_at).toLocaleDateString()}
                    </Text>
                  </HStack>
                </VStack>
              </Alert>
            )}

            {/* Share link display */}
            {shareData && (
              <Box>
                <FormLabel color="gray.300" fontSize="sm" mb={2}>
                  Share Link
                </FormLabel>
                <InputGroup size="sm">
                  <Input
                    value={shareData.shareUrl}
                    readOnly
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="gray.300"
                    fontSize="sm"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Copy link"
                      icon={copied ? <CheckIcon w={3} h={3} /> : <CopyIcon w={3} h={3} />}
                      size="xs"
                      colorScheme={copied ? 'green' : 'blue'}
                      variant="ghost"
                      onClick={handleCopyLink}
                    />
                  </InputRightElement>
                </InputGroup>
              </Box>
            )}

            <Divider borderColor="rgba(255, 255, 255, 0.1)" />

            {/* Share settings */}
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="gray.300" fontSize="sm">
                  Title (Optional)
                </FormLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={job.name}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="gray.300"
                  _placeholder={{ color: 'gray.500' }}
                />
                <FormHelperText color="gray.500" fontSize="xs">
                  Custom title for the shared job
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300" fontSize="sm">
                  Description (Optional)
                </FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this shared job..."
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="gray.300"
                  _placeholder={{ color: 'gray.500' }}
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <HStack justify="space-between">
                  <VStack spacing={1} align="flex-start">
                    <FormLabel color="gray.300" fontSize="sm" mb={0}>
                      Public Access
                    </FormLabel>
                    <Text fontSize="xs" color="gray.500">
                      Allow anyone with the link to view
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    colorScheme="blue"
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300" fontSize="sm">
                  Link Expiration
                </FormLabel>
                <Select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="gray.300"
                >
                  <option value="never">Never expires</option>
                  <option value="1">1 day</option>
                  <option value="7">1 week</option>
                  <option value="30">1 month</option>
                  <option value="90">3 months</option>
                </Select>
              </FormControl>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="100%" justify={shareData ? 'space-between' : 'flex-end'}>
            {shareData && (
              <Button
                variant="ghost"
                colorScheme="red"
                size="sm"
                onClick={handleDeleteShare}
                isLoading={loading}
              >
                Remove Share
              </Button>
            )}
            
            <HStack spacing={2}>
              <Button variant="ghost" onClick={onClose} size="sm">
                Cancel
              </Button>
              
              {shareData ? (
                <Button
                  as="a"
                  href={shareData.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  colorScheme="blue"
                  size="sm"
                  leftIcon={<ExternalLinkIcon />}
                >
                  View Public Page
                </Button>
              ) : (
                <Button
                  colorScheme="blue"
                  onClick={handleCreateShare}
                  isLoading={loading}
                  size="sm"
                >
                  Create Share Link
                </Button>
              )}
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}