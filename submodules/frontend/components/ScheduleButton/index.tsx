import React, { FC } from 'react';
import { Button, Tooltip } from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

interface ScheduleButtonProps {
  message: string;
  disabled?: boolean;
  size?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  onJobScheduled?: (jobId: number) => void;
}

export const ScheduleButton: FC<ScheduleButtonProps> = ({
  message,
  disabled = false,
  size = "sm",
  isExpanded = false,
  onToggle,
}) => {
  return (
    <Tooltip 
      label={
        disabled || !message.trim() 
          ? "Type a message to enable scheduling" 
          : isExpanded 
            ? "Hide schedule options"
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
        onClick={onToggle}
        isDisabled={disabled || !message.trim()}
        color={disabled || !message.trim() ? "gray.500" : isExpanded ? "blue.300" : "gray.400"}
        bg={isExpanded ? "rgba(59, 130, 246, 0.1)" : "transparent"}
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
  );
};