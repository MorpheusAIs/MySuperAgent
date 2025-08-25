import { TimeIcon } from '@chakra-ui/icons';
import { Box, Button, Tooltip } from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';

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
  size = 'sm',
  isExpanded = false,
  onToggle,
}) => {
  const [hasViewedScheduling, setHasViewedScheduling] = useState(false);

  // Check if user has viewed scheduling before
  useEffect(() => {
    const viewed = localStorage.getItem('hasViewedScheduling');
    setHasViewedScheduling(viewed === 'true');
  }, []);

  // Mark as viewed when expanded
  useEffect(() => {
    if (isExpanded && !hasViewedScheduling) {
      localStorage.setItem('hasViewedScheduling', 'true');
      setHasViewedScheduling(true);
    }
  }, [isExpanded, hasViewedScheduling]);

  const showNotificationBadge =
    !hasViewedScheduling && !disabled && message.trim();
  return (
    <Tooltip
      label={
        disabled || !message.trim()
          ? 'Type a message to enable scheduling'
          : isExpanded
            ? 'Hide schedule options'
            : 'Schedule this message to run automatically'
      }
      hasArrow
      placement="top"
      bg="gray.700"
      color="white"
    >
      <Box position="relative">
        <Button
          leftIcon={<TimeIcon />}
          size={size}
          variant="ghost"
          onClick={onToggle}
          isDisabled={disabled || !message.trim()}
          color={
            disabled || !message.trim()
              ? 'gray.500'
              : isExpanded
                ? 'green.300'
                : 'gray.400'
          }
          bg={isExpanded ? 'rgba(72, 187, 120, 0.15)' : 'transparent'}
          _hover={{
            color: disabled || !message.trim() ? 'gray.500' : 'green.300',
            bg:
              disabled || !message.trim()
                ? 'transparent'
                : 'rgba(72, 187, 120, 0.15)',
            transform:
              disabled || !message.trim() ? 'none' : 'translateY(-1px)',
          }}
          _active={{
            transform: disabled || !message.trim() ? 'none' : 'translateY(0px)',
          }}
          fontSize="sm"
          transition="all 0.2s ease-in-out"
          borderRadius="md"
          border={isExpanded ? '1px solid rgba(72, 187, 120, 0.3)' : 'none'}
          boxShadow={isExpanded ? '0 0 0 1px rgba(72, 187, 120, 0.2)' : 'none'}
        >
          Schedule
        </Button>
        {showNotificationBadge && (
          <Box
            position="absolute"
            top="-2px"
            right="-2px"
            width="8px"
            height="8px"
            bg="green.400"
            borderRadius="50%"
            boxShadow="0 0 6px rgba(72, 187, 120, 0.6)"
            animation="pulse 2s infinite"
          />
        )}
      </Box>
    </Tooltip>
  );
};
