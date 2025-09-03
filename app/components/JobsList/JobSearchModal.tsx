import { Job } from '@/services/types';
import {
  Badge,
  Box,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import styles from './JobSearchModal.module.css';

interface JobSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  scheduledJobs: Job[];
  onJobSelect: (jobId: string) => void;
}

export const JobSearchModal: React.FC<JobSearchModalProps> = ({
  isOpen,
  onClose,
  jobs,
  scheduledJobs,
  onJobSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine all jobs for searching
  const allJobs = [...jobs, ...scheduledJobs];

  // Filter jobs based on search query
  const filteredJobs = allJobs
    .filter((job) => {
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        job.name.toLowerCase().includes(searchLower) ||
        (job.description &&
          job.description.toLowerCase().includes(searchLower)) ||
        job.initial_message.toLowerCase().includes(searchLower)
      );
    })
    .slice(0, 10); // Limit to 10 results for performance

  // Reset search and selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Global escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Update selected index when filtered results change
  useEffect(() => {
    if (selectedIndex >= filteredJobs.length) {
      setSelectedIndex(Math.max(0, filteredJobs.length - 1));
    }
  }, [filteredJobs.length, selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredJobs.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredJobs[selectedIndex]) {
          handleJobSelect(filteredJobs[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleJobSelect = (job: Job) => {
    onJobSelect(job.id);
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      closeOnOverlayClick={true}
      closeOnEsc={true}
      trapFocus={true}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#1a1a1a"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="16px"
        mx={4}
        my="10vh"
        maxH="80vh"
        overflow="hidden"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.8)"
      >
        <ModalBody p={0}>
          <Box className={styles.searchContainer}>
            {/* Search Input */}
            <Box p={4} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" pl={2}>
                  <Search size={20} color="rgba(255, 255, 255, 0.5)" />
                </InputLeftElement>
                <Input
                  ref={inputRef}
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  bg="transparent"
                  border="none"
                  color="white"
                  fontSize="18px"
                  pl={12}
                  _focus={{
                    boxShadow: 'none',
                    border: 'none',
                  }}
                  _placeholder={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                />
              </InputGroup>
            </Box>

            {/* Results */}
            <Box maxH="400px" overflowY="auto">
              {filteredJobs.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Text color="rgba(255, 255, 255, 0.6)" fontSize="md">
                    {searchQuery
                      ? 'No jobs found matching your search'
                      : 'Start typing to search jobs...'}
                  </Text>
                </Box>
              ) : (
                <VStack spacing={0} align="stretch">
                  {filteredJobs.map((job, index) => (
                    <Box
                      key={job.id}
                      className={`${styles.jobResult} ${
                        index === selectedIndex ? styles.selected : ''
                      }`}
                      p={4}
                      cursor="pointer"
                      onClick={() => handleJobSelect(job)}
                      borderBottom={
                        index < filteredJobs.length - 1
                          ? '1px solid rgba(255, 255, 255, 0.05)'
                          : 'none'
                      }
                    >
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between" align="flex-start">
                          <Text
                            color="white"
                            fontWeight="600"
                            fontSize="sm"
                            noOfLines={1}
                            flex={1}
                          >
                            {job.name}
                          </Text>
                          <HStack spacing={2}>
                            <Badge
                              colorScheme={getJobStatusColor(job.status)}
                              size="sm"
                              fontSize="xs"
                            >
                              {job.status}
                            </Badge>
                            {job.is_scheduled && (
                              <Badge
                                colorScheme="purple"
                                size="sm"
                                fontSize="xs"
                              >
                                scheduled
                              </Badge>
                            )}
                          </HStack>
                        </HStack>
                        <Text
                          color="rgba(255, 255, 255, 0.7)"
                          fontSize="xs"
                          noOfLines={2}
                        >
                          {job.description || job.initial_message}
                        </Text>
                        <Text color="rgba(255, 255, 255, 0.4)" fontSize="xs">
                          Created {formatDate(job.created_at)}
                        </Text>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            {/* Footer */}
            <Box
              p={3}
              borderTop="1px solid rgba(255, 255, 255, 0.1)"
              bg="rgba(255, 255, 255, 0.02)"
            >
              <HStack
                spacing={4}
                fontSize="xs"
                color="rgba(255, 255, 255, 0.7)"
              >
                <HStack spacing={1}>
                  <Kbd
                    fontSize="xs"
                    bg="#59F886"
                    color="#000"
                    borderColor="#59F886"
                    fontWeight="600"
                  >
                    ↓
                  </Kbd>
                  <Kbd
                    fontSize="xs"
                    bg="#59F886"
                    color="#000"
                    borderColor="#59F886"
                    fontWeight="600"
                  >
                    ↑
                  </Kbd>
                  <Text>to navigate</Text>
                </HStack>
                <HStack spacing={1}>
                  <Kbd
                    fontSize="xs"
                    bg="#59F886"
                    color="#000"
                    borderColor="#59F886"
                    fontWeight="600"
                  >
                    ↵
                  </Kbd>
                  <Text>to select</Text>
                </HStack>
                <HStack spacing={1}>
                  <Kbd
                    fontSize="xs"
                    bg="#59F886"
                    color="#000"
                    borderColor="#59F886"
                    fontWeight="600"
                  >
                    esc
                  </Kbd>
                  <Text>hold to close</Text>
                </HStack>
              </HStack>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
