/**
 * Action State Detection System
 * Detects when agent responses end in specific action states that require unique UI handling
 */

export enum ActionState {
  // User input required
  REQUIRES_APPROVAL = 'requires_approval',
  REQUIRES_INPUT = 'requires_input',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_SELECTION = 'requires_selection',
  
  // Transaction states
  TRANSACTION_PENDING = 'transaction_pending',
  TRANSACTION_SIGNING = 'transaction_signing',
  TRANSACTION_BROADCASTING = 'transaction_broadcasting',
  TRANSACTION_CONFIRMING = 'transaction_confirming',
  
  // Authentication states
  AUTH_REQUIRED = 'auth_required',
  WALLET_CONNECTION_REQUIRED = 'wallet_connection_required',
  PERMISSION_REQUIRED = 'permission_required',
  
  // Processing states
  PROCESSING = 'processing',
  WAITING_FOR_EXTERNAL_DATA = 'waiting_for_external_data',
  RATE_LIMITED = 'rate_limited',
  
  // Success/Error states
  SUCCESS = 'success',
  ERROR = 'error',
  PARTIAL_SUCCESS = 'partial_success',
  
  // Tool execution states
  TOOL_EXECUTION_PENDING = 'tool_execution_pending',
  TOOL_AUTHENTICATION_REQUIRED = 'tool_authentication_required',
  
  // MCP states
  MCP_CONNECTION_REQUIRED = 'mcp_connection_required',
  MCP_TOOL_UNAVAILABLE = 'mcp_tool_unavailable',
  
  // None (default/completed)
  NONE = 'none'
}

export interface ActionStateContext {
  state: ActionState;
  data?: any;
  requiresUserInteraction: boolean;
  suggestedActions?: string[];
  nextSteps?: string[];
  metadata?: Record<string, any>;
}

/**
 * Patterns and keywords that indicate specific action states
 */
const ACTION_STATE_PATTERNS: Record<ActionState, RegExp[]> = {
  [ActionState.REQUIRES_APPROVAL]: [
    /requires?\s+(your\s+)?approval/i,
    /please\s+(confirm|approve)/i,
    /do\s+you\s+(want\s+to|approve|confirm)/i,
    /proceed\s+with/i,
    /authorize\s+this/i
  ],
  
  [ActionState.REQUIRES_INPUT]: [
    /please\s+(provide|enter|specify)/i,
    /need\s+(more\s+)?information/i,
    /what\s+(would\s+you\s+like|is)/i,
    /which\s+(option|one)/i,
    /enter\s+(your|the)/i
  ],
  
  [ActionState.REQUIRES_CONFIRMATION]: [
    /confirm\s+(this|that)/i,
    /is\s+this\s+correct/i,
    /verify\s+(this|that)/i,
    /double.?check/i,
    /are\s+you\s+sure/i
  ],
  
  [ActionState.REQUIRES_SELECTION]: [
    /choose\s+(from|one)/i,
    /select\s+(an?\s+)?option/i,
    /pick\s+one/i,
    /multiple\s+options/i,
    /which\s+would\s+you\s+like/i
  ],
  
  [ActionState.TRANSACTION_PENDING]: [
    /transaction\s+pending/i,
    /waiting\s+for\s+transaction/i,
    /tx\s+pending/i,
    /broadcasted\s+transaction/i,
    /transaction\s+submitted/i
  ],
  
  [ActionState.TRANSACTION_SIGNING]: [
    /please\s+sign/i,
    /signature\s+required/i,
    /sign\s+the\s+transaction/i,
    /wallet\s+signature/i,
    /awaiting\s+signature/i
  ],
  
  [ActionState.AUTH_REQUIRED]: [
    /authentication\s+required/i,
    /please\s+(login|authenticate)/i,
    /credentials\s+needed/i,
    /not\s+authenticated/i,
    /login\s+required/i
  ],
  
  [ActionState.WALLET_CONNECTION_REQUIRED]: [
    /connect\s+(your\s+)?wallet/i,
    /wallet\s+not\s+connected/i,
    /please\s+connect/i,
    /no\s+wallet\s+detected/i,
    /wallet\s+required/i
  ],
  
  [ActionState.PROCESSING]: [
    /processing/i,
    /working\s+on\s+it/i,
    /in\s+progress/i,
    /analyzing/i,
    /calculating/i
  ],
  
  [ActionState.ERROR]: [
    /error\s+occurred/i,
    /failed\s+to/i,
    /something\s+went\s+wrong/i,
    /unable\s+to/i,
    /could\s+not/i
  ],
  
  [ActionState.SUCCESS]: [
    /successfully/i,
    /completed/i,
    /done/i,
    /finished/i,
    /(task|action)\s+complete/i
  ],
  
  [ActionState.TOOL_EXECUTION_PENDING]: [
    /executing\s+tool/i,
    /running\s+tool/i,
    /tool\s+execution/i,
    /calling\s+external/i
  ],
  
  [ActionState.MCP_CONNECTION_REQUIRED]: [
    /mcp\s+(server\s+)?not\s+connected/i,
    /connect\s+mcp\s+server/i,
    /mcp\s+setup\s+required/i,
    /configure\s+mcp/i
  ],
  
  [ActionState.RATE_LIMITED]: [
    /rate\s+limit/i,
    /too\s+many\s+requests/i,
    /please\s+wait/i,
    /try\s+again\s+later/i
  ],
  
  // Default patterns for states without specific patterns
  [ActionState.TRANSACTION_BROADCASTING]: [],
  [ActionState.TRANSACTION_CONFIRMING]: [],
  [ActionState.PERMISSION_REQUIRED]: [],
  [ActionState.WAITING_FOR_EXTERNAL_DATA]: [],
  [ActionState.PARTIAL_SUCCESS]: [],
  [ActionState.TOOL_AUTHENTICATION_REQUIRED]: [],
  [ActionState.MCP_TOOL_UNAVAILABLE]: [],
  [ActionState.NONE]: []
};

/**
 * Keywords that typically appear at the end of messages for each action state
 */
const END_OF_MESSAGE_INDICATORS: Record<ActionState, string[]> = {
  [ActionState.REQUIRES_APPROVAL]: ['approve?', 'proceed?', 'confirm?', 'continue?'],
  [ActionState.REQUIRES_INPUT]: ['please provide', 'enter:', 'specify:', 'what would you like'],
  [ActionState.REQUIRES_CONFIRMATION]: ['correct?', 'confirm?', 'verify?', 'sure?'],
  [ActionState.REQUIRES_SELECTION]: ['choose:', 'select:', 'pick one', 'which option'],
  [ActionState.WALLET_CONNECTION_REQUIRED]: ['connect wallet', 'please connect', 'wallet required'],
  [ActionState.AUTH_REQUIRED]: ['please login', 'authenticate first', 'login required'],
  [ActionState.PROCESSING]: ['processing...', 'working on it...', 'please wait...'],
  [ActionState.SUCCESS]: ['completed!', 'done!', 'successful!', 'finished!'],
  [ActionState.ERROR]: ['error occurred', 'failed', 'something went wrong'],
  [ActionState.MCP_CONNECTION_REQUIRED]: ['configure mcp', 'setup required', 'connect server'],
  
  // Default empty arrays for other states
  [ActionState.TRANSACTION_PENDING]: [],
  [ActionState.TRANSACTION_SIGNING]: [],
  [ActionState.TRANSACTION_BROADCASTING]: [],
  [ActionState.TRANSACTION_CONFIRMING]: [],
  [ActionState.PERMISSION_REQUIRED]: [],
  [ActionState.WAITING_FOR_EXTERNAL_DATA]: [],
  [ActionState.PARTIAL_SUCCESS]: [],
  [ActionState.TOOL_EXECUTION_PENDING]: [],
  [ActionState.TOOL_AUTHENTICATION_REQUIRED]: [],
  [ActionState.MCP_TOOL_UNAVAILABLE]: [],
  [ActionState.RATE_LIMITED]: [],
  [ActionState.NONE]: []
};

/**
 * Detects action state from message content
 */
export function detectActionState(content: string): ActionStateContext {
  if (!content || typeof content !== 'string') {
    return {
      state: ActionState.NONE,
      requiresUserInteraction: false
    };
  }

  const messageText = content.toLowerCase().trim();
  const lastSentence = messageText.split(/[.!?]/).pop()?.trim() || '';
  const lastTwoSentences = messageText.split(/[.!?]/).slice(-2).join(' ').trim();

  // Check each action state for pattern matches
  for (const [state, patterns] of Object.entries(ACTION_STATE_PATTERNS)) {
    const actionState = state as ActionState;
    
    // Check main patterns in the entire message
    const hasMainPattern = patterns.some(pattern => pattern.test(messageText));
    
    // Check end-of-message indicators
    const endIndicators = END_OF_MESSAGE_INDICATORS[actionState];
    const hasEndIndicator = endIndicators.some(indicator => 
      lastSentence.includes(indicator.toLowerCase()) || 
      lastTwoSentences.includes(indicator.toLowerCase())
    );
    
    if (hasMainPattern || (patterns.length === 0 && hasEndIndicator)) {
      return {
        state: actionState,
        requiresUserInteraction: getRequiresUserInteraction(actionState),
        suggestedActions: getSuggestedActions(actionState),
        nextSteps: getNextSteps(actionState),
        data: extractActionData(content, actionState)
      };
    }
  }

  return {
    state: ActionState.NONE,
    requiresUserInteraction: false
  };
}

/**
 * Determines if an action state requires user interaction
 */
function getRequiresUserInteraction(state: ActionState): boolean {
  const interactiveStates = [
    ActionState.REQUIRES_APPROVAL,
    ActionState.REQUIRES_INPUT,
    ActionState.REQUIRES_CONFIRMATION,
    ActionState.REQUIRES_SELECTION,
    ActionState.TRANSACTION_SIGNING,
    ActionState.AUTH_REQUIRED,
    ActionState.WALLET_CONNECTION_REQUIRED,
    ActionState.PERMISSION_REQUIRED,
    ActionState.TOOL_AUTHENTICATION_REQUIRED,
    ActionState.MCP_CONNECTION_REQUIRED
  ];
  
  return interactiveStates.includes(state);
}

/**
 * Gets suggested actions for each state
 */
function getSuggestedActions(state: ActionState): string[] {
  const actionMap: Record<ActionState, string[]> = {
    [ActionState.REQUIRES_APPROVAL]: ['Approve', 'Deny', 'Review Details'],
    [ActionState.REQUIRES_INPUT]: ['Provide Information', 'Cancel'],
    [ActionState.REQUIRES_CONFIRMATION]: ['Confirm', 'Edit', 'Cancel'],
    [ActionState.REQUIRES_SELECTION]: ['Select Option', 'View All Options'],
    [ActionState.WALLET_CONNECTION_REQUIRED]: ['Connect Wallet', 'Learn More'],
    [ActionState.AUTH_REQUIRED]: ['Login', 'Register', 'Continue as Guest'],
    [ActionState.TRANSACTION_SIGNING]: ['Sign Transaction', 'Review Details', 'Cancel'],
    [ActionState.MCP_CONNECTION_REQUIRED]: ['Setup MCP', 'Configure Server', 'Skip'],
    [ActionState.ERROR]: ['Retry', 'Report Issue', 'Try Different Approach'],
    [ActionState.SUCCESS]: ['Continue', 'View Details', 'Share Result'],
    [ActionState.PROCESSING]: ['Wait', 'Cancel'],
    [ActionState.RATE_LIMITED]: ['Wait', 'Try Later', 'Sign In'],
    
    // Default empty arrays
    [ActionState.TRANSACTION_PENDING]: [],
    [ActionState.TRANSACTION_BROADCASTING]: [],
    [ActionState.TRANSACTION_CONFIRMING]: [],
    [ActionState.PERMISSION_REQUIRED]: [],
    [ActionState.WAITING_FOR_EXTERNAL_DATA]: [],
    [ActionState.PARTIAL_SUCCESS]: [],
    [ActionState.TOOL_EXECUTION_PENDING]: [],
    [ActionState.TOOL_AUTHENTICATION_REQUIRED]: [],
    [ActionState.MCP_TOOL_UNAVAILABLE]: [],
    [ActionState.NONE]: []
  };
  
  return actionMap[state] || [];
}

/**
 * Gets next steps for each state
 */
function getNextSteps(state: ActionState): string[] {
  const stepsMap: Record<ActionState, string[]> = {
    [ActionState.REQUIRES_APPROVAL]: [
      'Review the details carefully',
      'Click Approve to continue or Deny to cancel',
      'Check any associated costs or risks'
    ],
    [ActionState.REQUIRES_INPUT]: [
      'Provide the requested information',
      'Double-check your input for accuracy',
      'Submit when ready'
    ],
    [ActionState.WALLET_CONNECTION_REQUIRED]: [
      'Click the Connect Wallet button',
      'Select your preferred wallet provider',
      'Follow the connection prompts'
    ],
    [ActionState.AUTH_REQUIRED]: [
      'Login with your existing account',
      'Or create a new account if needed',
      'Complete any verification steps'
    ],
    [ActionState.MCP_CONNECTION_REQUIRED]: [
      'Navigate to MCP Settings',
      'Configure the required server',
      'Test the connection'
    ],
    
    // Default empty arrays for other states
    [ActionState.REQUIRES_CONFIRMATION]: [],
    [ActionState.REQUIRES_SELECTION]: [],
    [ActionState.TRANSACTION_PENDING]: [],
    [ActionState.TRANSACTION_SIGNING]: [],
    [ActionState.TRANSACTION_BROADCASTING]: [],
    [ActionState.TRANSACTION_CONFIRMING]: [],
    [ActionState.PERMISSION_REQUIRED]: [],
    [ActionState.PROCESSING]: [],
    [ActionState.WAITING_FOR_EXTERNAL_DATA]: [],
    [ActionState.RATE_LIMITED]: [],
    [ActionState.SUCCESS]: [],
    [ActionState.ERROR]: [],
    [ActionState.PARTIAL_SUCCESS]: [],
    [ActionState.TOOL_EXECUTION_PENDING]: [],
    [ActionState.TOOL_AUTHENTICATION_REQUIRED]: [],
    [ActionState.MCP_TOOL_UNAVAILABLE]: [],
    [ActionState.NONE]: []
  };
  
  return stepsMap[state] || [];
}

/**
 * Extracts relevant data from message content based on action state
 */
function extractActionData(content: string, state: ActionState): any {
  // This could be expanded to extract specific data for each state
  // For now, return the raw content for further processing
  return {
    originalContent: content,
    extractedAt: new Date().toISOString()
  };
}

/**
 * Checks if a message content ends with a specific action state
 */
export function messageEndsInActionState(content: string): boolean {
  const actionState = detectActionState(content);
  return actionState.state !== ActionState.NONE && actionState.requiresUserInteraction;
}

/**
 * Gets all action states that require user interaction
 */
export function getInteractiveActionStates(): ActionState[] {
  return Object.values(ActionState).filter(state => getRequiresUserInteraction(state));
}