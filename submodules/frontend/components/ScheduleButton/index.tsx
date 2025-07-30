import React, { FC, useState } from 'react';
import { Button, useDisclosure, Tooltip } from '@chakra-ui/react';
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
      <Tooltip 
        label={
          disabled || !message.trim() 
            ? "Type a message to enable scheduling" 
            : "Schedule this message to run automatically"
        }
        hasArrow
        placement="top"
        bg="gray.700"
        color="white"
      >
        <Button
          leftIcon={<TimeIcon />}
          size={size}
          variant="ghost"
          onClick={onOpen}
          isDisabled={disabled || !message.trim()}
          color={disabled || !message.trim() ? "gray.500" : "gray.400"}
          _hover={{ 
            color: disabled || !message.trim() ? "gray.500" : "blue.300", 
            bg: disabled || !message.trim() ? "transparent" : "rgba(59, 130, 246, 0.1)",
            transform: disabled || !message.trim() ? "none" : "translateY(-1px)"
          }}
          _active={{
            transform: disabled || !message.trim() ? "none" : "translateY(0px)"
          }}
          fontSize="sm"
          transition="all 0.2s ease-in-out"
          borderRadius="md"
        >
          Schedule
        </Button>
      </Tooltip>
      
      <ScheduledJobModal
        isOpen={isOpen}
        onClose={onClose}
        initialMessage={message}
        onJobCreated={handleJobCreated}
      />
    </>
  );
};