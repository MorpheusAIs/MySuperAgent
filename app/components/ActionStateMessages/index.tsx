/**
 * Action State Message Components
 * Unique UI components for different action states that require user interaction
 */

import React, { FC } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import {
  CheckIcon,
  WarningIcon,
  InfoIcon,
  TimeIcon,
  QuestionIcon,
  LockIcon,
  RepeatIcon,
  ExternalLinkIcon
} from '@chakra-ui/icons';
import { ActionState, ActionStateContext } from '@/services/utils/action-state-detection';

interface ActionStateMessageProps {
  actionState: ActionStateContext;
  originalContent: string;
  onAction?: (action: string, data?: any) => void;
}

/**
 * Main component that renders the appropriate action state message
 */
export const ActionStateMessage: FC<ActionStateMessageProps> = ({
  actionState,
  originalContent,
  onAction
}) => {
  const bg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // If no specific action state, render original content
  if (actionState.state === ActionState.NONE) {
    return <Text>{originalContent}</Text>;
  }

  return (
    <Box>
      {/* Original content */}
      <Text mb={4}>{originalContent}</Text>
      
      {/* Action state UI */}
      <Box
        p={4}
        bg={bg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        mt={3}
      >
        {renderActionStateComponent(actionState, onAction)}
      </Box>
    </Box>
  );
};

/**
 * Renders the specific component for each action state
 */
function renderActionStateComponent(
  actionState: ActionStateContext,
  onAction?: (action: string, data?: any) => void
): React.ReactNode {
  switch (actionState.state) {
    case ActionState.REQUIRES_APPROVAL:
      return <RequiresApprovalMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.REQUIRES_INPUT:
      return <RequiresInputMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.REQUIRES_CONFIRMATION:
      return <RequiresConfirmationMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.REQUIRES_SELECTION:
      return <RequiresSelectionMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.WALLET_CONNECTION_REQUIRED:
      return <WalletConnectionRequiredMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.AUTH_REQUIRED:
      return <AuthRequiredMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.TRANSACTION_PENDING:
      return <TransactionPendingMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.TRANSACTION_SIGNING:
      return <TransactionSigningMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.MCP_CONNECTION_REQUIRED:
      return <MCPConnectionRequiredMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.PROCESSING:
      return <ProcessingMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.SUCCESS:
      return <SuccessMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.ERROR:
      return <ErrorMessage actionState={actionState} onAction={onAction} />;
      
    case ActionState.RATE_LIMITED:
      return <RateLimitedMessage actionState={actionState} onAction={onAction} />;
      
    default:
      return <DefaultActionMessage actionState={actionState} onAction={onAction} />;
  }
}

// Individual action state components

const RequiresApprovalMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="warning" variant="left-accent" borderRadius="md">
    <AlertIcon as={QuestionIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Approval Required</AlertTitle>
      <AlertDescription>
        This action requires your approval to proceed.
      </AlertDescription>
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="green" 
          size="sm"
          onClick={() => onAction?.('approve')}
        >
          Approve
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction?.('deny')}
        >
          Deny
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('review')}
        >
          Review Details
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const RequiresInputMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="info" variant="left-accent" borderRadius="md">
    <AlertIcon as={InfoIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Input Required</AlertTitle>
      <AlertDescription>
        Please provide the requested information to continue.
      </AlertDescription>
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="blue" 
          size="sm"
          onClick={() => onAction?.('provide_input')}
        >
          Provide Information
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('cancel')}
        >
          Cancel
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const RequiresConfirmationMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="warning" variant="left-accent" borderRadius="md">
    <AlertIcon as={CheckIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Confirmation Required</AlertTitle>
      <AlertDescription>
        Please verify that the information is correct before proceeding.
      </AlertDescription>
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="green" 
          size="sm"
          onClick={() => onAction?.('confirm')}
        >
          Confirm
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction?.('edit')}
        >
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('cancel')}
        >
          Cancel
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const RequiresSelectionMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="info" variant="left-accent" borderRadius="md">
    <AlertIcon as={QuestionIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Selection Required</AlertTitle>
      <AlertDescription>
        Please choose from the available options.
      </AlertDescription>
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="blue" 
          size="sm"
          onClick={() => onAction?.('select_option')}
        >
          Select Option
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('view_options')}
        >
          View All Options
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const WalletConnectionRequiredMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="warning" variant="left-accent" borderRadius="md">
    <AlertIcon as={LockIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Wallet Connection Required</AlertTitle>
      <AlertDescription>
        Connect your wallet to continue with this action.
      </AlertDescription>
      {actionState.nextSteps && (
        <VStack align="flex-start" mt={2} spacing={1}>
          {actionState.nextSteps.map((step, index) => (
            <Text key={index} fontSize="sm" color="gray.600">
              {index + 1}. {step}
            </Text>
          ))}
        </VStack>
      )}
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="blue" 
          size="sm"
          leftIcon={<LockIcon />}
          onClick={() => onAction?.('connect_wallet')}
        >
          Connect Wallet
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          rightIcon={<ExternalLinkIcon />}
          onClick={() => onAction?.('learn_more')}
        >
          Learn More
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const AuthRequiredMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="warning" variant="left-accent" borderRadius="md">
    <AlertIcon as={LockIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Authentication Required</AlertTitle>
      <AlertDescription>
        Please login to access this feature.
      </AlertDescription>
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="blue" 
          size="sm"
          onClick={() => onAction?.('login')}
        >
          Login
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction?.('register')}
        >
          Register
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('continue_guest')}
        >
          Continue as Guest
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const TransactionPendingMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="info" variant="left-accent" borderRadius="md">
    <AlertIcon as={TimeIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Transaction Pending</AlertTitle>
      <AlertDescription>
        Your transaction is being processed on the blockchain.
      </AlertDescription>
      <Progress size="sm" isIndeterminate colorScheme="blue" mt={2} />
      <HStack mt={3} spacing={3}>
        <Button 
          variant="outline" 
          size="sm"
          rightIcon={<ExternalLinkIcon />}
          onClick={() => onAction?.('view_transaction')}
        >
          View Transaction
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('cancel')}
        >
          Cancel
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const TransactionSigningMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="warning" variant="left-accent" borderRadius="md">
    <AlertIcon as={LockIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Transaction Signing Required</AlertTitle>
      <AlertDescription>
        Please sign the transaction in your wallet to continue.
      </AlertDescription>
      <Progress size="sm" isIndeterminate colorScheme="orange" mt={2} />
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="orange" 
          size="sm"
          onClick={() => onAction?.('sign_transaction')}
        >
          Sign Transaction
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction?.('review_details')}
        >
          Review Details
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('cancel')}
        >
          Cancel
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const MCPConnectionRequiredMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="warning" variant="left-accent" borderRadius="md">
    <AlertIcon as={ExternalLinkIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">MCP Configuration Required</AlertTitle>
      <AlertDescription>
        This tool requires an MCP server connection to function.
      </AlertDescription>
      {actionState.nextSteps && (
        <VStack align="flex-start" mt={2} spacing={1}>
          {actionState.nextSteps.map((step, index) => (
            <Text key={index} fontSize="sm" color="gray.600">
              {index + 1}. {step}
            </Text>
          ))}
        </VStack>
      )}
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="blue" 
          size="sm"
          rightIcon={<ExternalLinkIcon />}
          onClick={() => onAction?.('setup_mcp')}
        >
          Setup MCP
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction?.('configure_server')}
        >
          Configure Server
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('skip')}
        >
          Skip for Now
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const ProcessingMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="info" variant="left-accent" borderRadius="md">
    <AlertIcon as={RepeatIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Processing</AlertTitle>
      <AlertDescription>
        Please wait while we process your request...
      </AlertDescription>
      <Progress size="sm" isIndeterminate colorScheme="blue" mt={2} />
      <HStack mt={3} spacing={3}>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('cancel')}
        >
          Cancel
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const SuccessMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="success" variant="left-accent" borderRadius="md">
    <AlertIcon as={CheckIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Success!</AlertTitle>
      <AlertDescription>
        The action completed successfully.
      </AlertDescription>
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="green" 
          size="sm"
          onClick={() => onAction?.('continue')}
        >
          Continue
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction?.('view_details')}
        >
          View Details
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('share_result')}
        >
          Share Result
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const ErrorMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="error" variant="left-accent" borderRadius="md">
    <AlertIcon as={WarningIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Error Occurred</AlertTitle>
      <AlertDescription>
        Something went wrong while processing your request.
      </AlertDescription>
      <HStack mt={3} spacing={3}>
        <Button 
          colorScheme="red" 
          size="sm"
          onClick={() => onAction?.('retry')}
        >
          Retry
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction?.('report_issue')}
        >
          Report Issue
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('try_different_approach')}
        >
          Try Different Approach
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const RateLimitedMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Alert status="warning" variant="left-accent" borderRadius="md">
    <AlertIcon as={TimeIcon} />
    <Box flex="1">
      <AlertTitle fontSize="md">Rate Limited</AlertTitle>
      <AlertDescription>
        You&apos;ve reached the rate limit. Please wait before trying again.
      </AlertDescription>
      <HStack mt={3} spacing={3}>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction?.('wait')}
        >
          Wait
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAction?.('try_later')}
        >
          Try Later
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          rightIcon={<ExternalLinkIcon />}
          onClick={() => onAction?.('upgrade_plan')}
        >
          Upgrade Plan
        </Button>
      </HStack>
    </Box>
  </Alert>
);

const DefaultActionMessage: FC<{
  actionState: ActionStateContext;
  onAction?: (action: string, data?: any) => void;
}> = ({ actionState, onAction }) => (
  <Box p={3} bg="gray.700" borderRadius="md">
    <Flex align="center" justify="space-between" mb={2}>
      <Text fontSize="sm" fontWeight="semibold" color="blue.300">
        Action Required
      </Text>
      <Badge colorScheme="blue" fontSize="xs">
        {actionState.state}
      </Badge>
    </Flex>
    <Text fontSize="sm" color="gray.300" mb={3}>
      This message requires user action to proceed.
    </Text>
    {actionState.suggestedActions && actionState.suggestedActions.length > 0 && (
      <HStack spacing={2} flexWrap="wrap">
        {actionState.suggestedActions.map((action, index) => (
          <Button 
            key={index}
            size="sm" 
            variant="outline" 
            colorScheme="blue"
            onClick={() => onAction?.(action.toLowerCase().replace(' ', '_'))}
          >
            {action}
          </Button>
        ))}
      </HStack>
    )}
  </Box>
);