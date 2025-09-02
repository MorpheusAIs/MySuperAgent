import { track } from '@vercel/analytics';

// Custom event tracking types
export type AnalyticsEvent = 
  // Authentication events
  | 'auth.wallet_connected'
  | 'auth.signature_requested'
  | 'auth.authenticated'
  | 'auth.logout'
  | 'auth.error'
  
  // Agent interaction events
  | 'agent.selected'
  | 'agent.message_sent'
  | 'agent.response_received'
  | 'agent.tool_used'
  | 'agent.error'
  | 'agent.selection_saved'
  
  // Job management events
  | 'job.clicked'
  | 'job.scheduled_toggle'
  | 'job.scheduled_run'
  | 'job.deleted'
  | 'job.delete_cancelled'
  | 'job.search'
  | 'job.filter_changed'
  | 'job.tab_changed'
  | 'job.pagination'
  | 'job.share_modal_opened'
  
  // Shared job events
  | 'shared_job.created'
  | 'shared_job.link_copied'
  | 'shared_job.deleted'
  | 'shared_job.access_failed'
  | 'shared_job.accessed'
  | 'shared_job.api_error'
  | 'shared_job.page_viewed'
  | 'shared_job.load_error'
  | 'shared_job.cta_clicked'
  
  // Wallet operation events
  | 'wallet.created'
  | 'wallet.restored'
  | 'wallet.deleted'
  | 'wallet.copied_address'
  | 'wallet.set_active'
  | 'wallet.downloaded'
  
  // Transaction events
  | 'swap.initiated'
  | 'swap.approved'
  | 'swap.completed'
  | 'swap.failed'
  | 'swap.cancelled'
  
  // UI interaction events
  | 'sidebar.toggled'
  | 'settings.opened'
  | 'tools.configuration_opened'
  | 'workflow.selected'
  | 'ui.prefilled_options_toggled'
  
  // Research mode events
  | 'research.initiated'
  | 'research.streaming_started'
  | 'research.agent_progress'
  | 'research.completed'
  
  // File operation events
  | 'file.upload_started'
  | 'file.upload_completed';

// Event properties types
export interface EventProperties {
  // Common properties
  agentName?: string;
  agentId?: string;
  conversationId?: string;
  messageId?: string;
  userId?: string;
  wallet?: string;
  walletId?: string;
  
  // Job properties
  jobId?: string;
  jobName?: string;
  jobStatus?: string;
  isScheduled?: boolean;
  scheduleType?: string;
  
  // Specific event properties
  error?: string;
  duration?: number;
  location?: string;
  amount?: string;
  value?: string;
  dstAmount?: string;
  srcAmount?: string;
  txHash?: string;
  tokenSymbol?: string;
  chain?: string;
  sidebarOpen?: boolean;
  workflowId?: string;
  toolName?: string;
  selectedAgents?: string[];
  researchMode?: boolean;
  progressPercentage?: number;
  
  // Shared job properties
  shareId?: string;
  shareTitle?: string;
  shareToken?: string;
  viewCount?: number;
  messageCount?: number;
  hasCustomTitle?: boolean;
  hasCustomDescription?: boolean;
  isPublic?: boolean;
  token?: string;
  action?: string;
  reason?: string;
  userAgent?: string;
  hasExpiration?: boolean;
  ip?: string;
  referrer?: string;
  expiresIn?: number;
  fromAction?: number;
  totalSelected?: number;
  network?: string;
  walletName?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  hasError?: boolean;
  requiresAction?: boolean;
  actionType?: string;
  isOpen?: boolean;
  messageLength?: number;
  subtask?: string;
  totalAgents?: number;
  currentAgentIndex?: number;
  contributingAgents?: string[];
  subtaskCount?: number;
  totalTokens?: number;
  agentCount?: number;
  
  // UI interaction properties
  inputMethod?: string;
  searchQuery?: string;
  searchLength?: number;
  filterType?: string;
  filterValue?: string;
  previousValue?: string;
  fromTab?: string;
  toTab?: string;
  tabIndex?: number;
  fromPage?: number;
  toPage?: number;
  section?: string;
  
  // Feature flags (for analytics correlation)
  featureFlags?: Record<string, boolean | string>;
}

// Track custom event with optional properties
export const trackEvent = (
  event: AnalyticsEvent, 
  properties?: EventProperties
): void => {
  try {
    // Add timestamp and session info
    const safeProperties: Record<string, string | number | boolean | null> = {};
    
    // Sanitize properties: only accept primitive values
    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
          safeProperties[key] = value;
        } else if (Array.isArray(value)) {
          // Convert arrays to string representation
          safeProperties[key] = value.length.toString();
        } else if (typeof value === 'object') {
          // Convert objects to their count representation
          safeProperties[key] = '1';
        }
      });
    }
    
    const enrichedProperties: Record<string, string | number | boolean | null> = {
      ...safeProperties,
      timestamp: new Date().toISOString()
    };
    
    // Only add sessionId if available
    if (typeof window !== 'undefined') {
      const sessionId = window.sessionStorage.getItem('sessionId');
      if (sessionId) {
        enrichedProperties['sessionId'] = sessionId;
      }
    }
    
    // Track with Vercel Analytics
    track(event, enrichedProperties);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, enrichedProperties);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking event:', event, error);
  }
};

// Helper function to track errors
export const trackError = (
  source: string,
  error: Error | string,
  additionalProperties?: EventProperties
): void => {
  trackEvent('agent.error', {
    ...additionalProperties,
    location: source,
    error: error instanceof Error ? error.message : error,
  });
};

// Helper function to track timing events
export const trackTiming = (
  event: AnalyticsEvent,
  startTime: number,
  properties?: EventProperties
): void => {
  const duration = Date.now() - startTime;
  trackEvent(event, {
    ...properties,
    duration,
  });
};

// Session management
export const initializeSession = (): void => {
  if (typeof window !== 'undefined' && !window.sessionStorage.getItem('sessionId')) {
    const sessionId = generateSessionId();
    window.sessionStorage.setItem('sessionId', sessionId);
  }
};

// Helper to generate session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Initialize session on load
if (typeof window !== 'undefined') {
  initializeSession();
}