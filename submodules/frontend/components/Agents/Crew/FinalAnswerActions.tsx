import React from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { 
  FinalAnswerAction, 
  FinalAnswerActionType 
} from './FinalAnswerAction.types';
import { FaTwitter, FaExchangeAlt, FaPaperPlane, FaImage, FaChartLine } from 'react-icons/fa';

interface FinalAnswerActionsProps {
  actions: FinalAnswerAction[];
  onActionExecute: (action: FinalAnswerAction) => Promise<void>;
}

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: FinalAnswerAction | null;
  onConfirm: () => Promise<void>;
}

const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  action, 
  onConfirm 
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (!action) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!action) return null;

  // Get action-specific content based on action type
  const getActionContent = () => {
    switch (action.action_type) {
      case FinalAnswerActionType.TWEET:
        const tweetMetadata = action.metadata as import('./FinalAnswerAction.types').TweetActionMetadata;
        const tweetContent = tweetMetadata.content;
        return (
          <Box p={4} borderRadius="md" bg="gray.100" color="black">
            {tweetContent}
          </Box>
        );
      
      case FinalAnswerActionType.SWAP:
        const swapMetadata = action.metadata as import('./FinalAnswerAction.types').SwapActionMetadata;
        const { from_token, to_token, amount } = swapMetadata;
        return (
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text>From:</Text>
              <Text fontWeight="bold">{from_token}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>To:</Text>
              <Text fontWeight="bold">{to_token}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Amount:</Text>
              <Text fontWeight="bold">{amount}</Text>
            </HStack>
          </VStack>
        );
      
      case FinalAnswerActionType.TRANSFER:
        const transferMetadata = action.metadata as import('./FinalAnswerAction.types').TransferActionMetadata;
        const { token, to_address, amount: transferAmount } = transferMetadata;
        return (
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text>Token:</Text>
              <Text fontWeight="bold">{token}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>To Address:</Text>
              <Text fontWeight="bold" isTruncated maxW="250px">{to_address}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Amount:</Text>
              <Text fontWeight="bold">{transferAmount}</Text>
            </HStack>
          </VStack>
        );
      
      case FinalAnswerActionType.IMAGE_GENERATION:
        const imageMetadata = action.metadata as import('./FinalAnswerAction.types').ImageGenerationActionMetadata;
        const { prompt } = imageMetadata;
        return (
          <VStack align="stretch" spacing={2}>
            <Text fontWeight="bold">Image Prompt:</Text>
            <Box p={4} borderRadius="md" bg="gray.100" color="black">
              {prompt}
            </Box>
          </VStack>
        );
      
      default:
        return <Text>Are you sure you want to execute this action?</Text>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Action</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text>{action.description || `Execute ${action.action_type} action?`}</Text>
            {getActionContent()}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

/**
 * Component to render actionable buttons for final answer actions
 */
const FinalAnswerActions: React.FC<FinalAnswerActionsProps> = ({ 
  actions,
  onActionExecute 
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAction, setSelectedAction] = React.useState<FinalAnswerAction | null>(null);

  if (!actions || actions.length === 0) {
    return null;
  }

  const handleActionClick = (action: FinalAnswerAction) => {
    setSelectedAction(action);
    onOpen();
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;
    await onActionExecute(selectedAction);
  };

  // Get icon for action type
  const getActionIcon = (actionType: FinalAnswerActionType) => {
    switch (actionType) {
      case FinalAnswerActionType.TWEET:
        return FaTwitter;
      case FinalAnswerActionType.SWAP:
        return FaExchangeAlt;
      case FinalAnswerActionType.TRANSFER:
        return FaPaperPlane;
      case FinalAnswerActionType.IMAGE_GENERATION:
        return FaImage;
      case FinalAnswerActionType.ANALYSIS:
        return FaChartLine;
      default:
        return null;
    }
  };

  // Get color scheme for action type
  const getActionColorScheme = (actionType: FinalAnswerActionType) => {
    switch (actionType) {
      case FinalAnswerActionType.TWEET:
        return "twitter";
      case FinalAnswerActionType.SWAP:
        return "purple";
      case FinalAnswerActionType.TRANSFER:
        return "green";
      case FinalAnswerActionType.IMAGE_GENERATION:
        return "pink";
      case FinalAnswerActionType.ANALYSIS:
        return "orange";
      default:
        return "blue";
    }
  };

  return (
    <>
      <Box mt={4}>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Available Actions:
        </Text>
        <HStack spacing={2} wrap="wrap">
          {actions.map((action, index) => {
            const Icon = getActionIcon(action.action_type);
            const colorScheme = getActionColorScheme(action.action_type);
            
            return (
              <Tooltip 
                key={index} 
                label={action.description || `Execute ${action.action_type} action`}
              >
                <Button
                  size="sm"
                  leftIcon={Icon ? <Icon /> : undefined}
                  colorScheme={colorScheme}
                  onClick={() => handleActionClick(action)}
                  mb={2}
                >
                  {action.action_type === FinalAnswerActionType.TWEET 
                    ? "Tweet This" 
                    : action.action_type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                </Button>
              </Tooltip>
            );
          })}
        </HStack>
      </Box>

      <ActionConfirmationModal 
        isOpen={isOpen}
        onClose={onClose}
        action={selectedAction}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default FinalAnswerActions;