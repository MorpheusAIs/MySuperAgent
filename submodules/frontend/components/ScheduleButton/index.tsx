import React, { FC, useState } from 'react';
import { Button, useDisclosure } from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';
import { ScheduledJobModal } from '@/components/ScheduledJobModal';

interface ScheduleButtonProps {
  message: string;
  disabled?: boolean;
  size?: string;
  onJobScheduled?: (jobId: number) => void;
}

export const ScheduleButton: FC<ScheduleButtonProps> = ({
  message,
  disabled = false,
  size = "sm",
  onJobScheduled,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleJobCreated = (jobId: number) => {
    if (onJobScheduled) {
      onJobScheduled(jobId);
    }
  };

  return (
    <>
      <Button
        leftIcon={<TimeIcon />}
        size={size}
        variant="ghost"
        onClick={onOpen}
        isDisabled={disabled || !message.trim()}
        color="gray.400"
        _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.1)" }}
        fontSize="sm"
      >
        Schedule
      </Button>
      
      <ScheduledJobModal
        isOpen={isOpen}
        onClose={onClose}
        initialMessage={message}
        onJobCreated={handleJobCreated}
      />
    </>
  );
};