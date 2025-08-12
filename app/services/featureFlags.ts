// Feature flag types
export type FeatureFlag = 
  // Agent availability flags
  | 'feature.agent.default'
  | 'feature.agent.crypto_data'
  | 'feature.agent.token_swap'
  | 'feature.agent.realtime_search'
  | 'feature.agent.dca_agent'
  | 'feature.agent.mor_claims'
  | 'feature.agent.mor_rewards'
  | 'feature.agent.news_agent'
  | 'feature.agent.tweet_sizzler'
  | 'feature.agent.imagen'
  | 'feature.agent.rag'
  | 'feature.agent.rugcheck'
  | 'feature.agent.codex'
  | 'feature.agent.dexscreener'
  | 'feature.agent.elfa'
  | 'feature.agent.mcp_agent'
  | 'feature.agent.max_selection'
  
  // UI feature flags
  | 'feature.research_mode'
  | 'feature.prefilled_options'
  | 'feature.workflows'
  | 'feature.cdp_wallets'
  | 'feature.tools_configuration'
  | 'feature.agent_creation'
  
  // Transaction feature flags
  | 'feature.swap.enabled'
  | 'feature.swap.slippage_control'
  | 'feature.swap.gas_optimization'
  
  // Security/auth flags
  | 'feature.auth.wallet_signature'
  | 'feature.auth.session_persistence'
  | 'feature.auth.multi_wallet'
  
  // Integration flags
  | 'feature.integration.coinbase'
  | 'feature.integration.twitter'
  | 'feature.integration.santiment'
  | 'feature.integration.codex'
  | 'feature.integration.oneinch'
  | 'feature.integration.elfa'
  | 'feature.mcp_agents';

// Feature flag definitions type
export interface FlagDefinition {
  description?: string;
  origin?: string;
  options?: Array<{
    value: boolean | string | number;
    label?: string;
  }>;
}

// Feature flag values type
export type FlagValues = Record<string, boolean | string | number>;

// Feature flag overrides from cookie
export type FlagOverrides = Partial<FlagValues>;

// Global flag definitions (partial - not all flags have definitions)
export const FLAG_DEFINITIONS: Partial<Record<FeatureFlag, FlagDefinition>> = {
  // Agent flags
  'feature.agent.default': {
    description: 'Enable default agent',
    options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
  },
  'feature.agent.crypto_data': {
    description: 'Enable crypto data agent for market analysis',
    options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
  },
  'feature.agent.token_swap': {
    description: 'Enable token swap agent',
    options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
  },
  'feature.agent.max_selection': {
    description: 'Maximum number of agents that can be selected',
    options: [
      { value: 3, label: '3 agents' },
      { value: 5, label: '5 agents' },
      { value: 10, label: '10 agents' },
      { value: -1, label: 'Unlimited' },
    ],
  },
  
  // UI flags
  'feature.research_mode': {
    description: 'Enable research mode for agent orchestration',
    options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
  },
  'feature.cdp_wallets': {
    description: 'Enable CDP wallet functionality',
    options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
  },
  
  // Add more definitions for other flags...
  // This is a partial list - you would expand this for all flags
} as const;

// Default feature flag values
const DEFAULT_FLAGS: FlagValues = {
  // Agent defaults
  'feature.agent.default': true,
  'feature.agent.crypto_data': true,
  'feature.agent.token_swap': true,
  'feature.agent.realtime_search': true,
  'feature.agent.dca_agent': true,
  'feature.agent.mor_claims': true,
  'feature.agent.mor_rewards': true,
  'feature.agent.news_agent': true,
  'feature.agent.tweet_sizzler': true,
  'feature.agent.imagen': true,
  'feature.agent.rag': true,
  'feature.agent.rugcheck': true,
  'feature.agent.codex': true,
  'feature.agent.dexscreener': true,
  'feature.agent.elfa': true,
  'feature.agent.mcp_agent': true,
  'feature.agent.max_selection': 5,
  
  // UI defaults
  'feature.research_mode': true,
  'feature.prefilled_options': true,
  'feature.workflows': true,
  'feature.cdp_wallets': true,
  'feature.tools_configuration': true,
  'feature.agent_creation': true,
  
  // Transaction defaults
  'feature.swap.enabled': true,
  'feature.swap.slippage_control': true,
  'feature.swap.gas_optimization': false,
  
  // Security defaults
  'feature.auth.wallet_signature': true,
  'feature.auth.session_persistence': true,
  'feature.auth.multi_wallet': false,
  
  // Integration defaults
  'feature.integration.coinbase': true,
  'feature.integration.twitter': true,
  'feature.integration.santiment': true,
  'feature.integration.codex': true,
  'feature.integration.oneinch': true,
  'feature.integration.elfa': true,
  'feature.mcp_agents': true,
};

// Storage for runtime flags (can be updated via API)
let runtimeFlags: FlagValues = { ...DEFAULT_FLAGS };

// Storage for overrides (from Vercel Toolbar)
let flagOverrides: FlagOverrides = {};

// Load overrides from cookie if available
const loadOverridesFromCookie = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    const overrideCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('vercel-flag-overrides='))
      ?.split('=')[1];
    
    if (overrideCookie) {
      // Handle encrypted overrides if FLAGS_SECRET is set
      if (process.env.NEXT_PUBLIC_FLAGS_SECRET) {
        // For use with SDK v4, you would import and use decryptOverrides
        // import { decryptOverrides } from 'flags';
        // flagOverrides = await decryptOverrides(overrideCookie);
        
        // For now, we'll just parse as JSON since we can't import server packages
        flagOverrides = JSON.parse(decodeURIComponent(overrideCookie));
      } else {
        flagOverrides = JSON.parse(decodeURIComponent(overrideCookie));
      }
    }
  } catch (error) {
    console.error('[FeatureFlags] Error loading overrides:', error);
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  loadOverridesFromCookie();
}

// Get feature flag value
export const getFeatureFlag = <T = boolean | string | number>(
  flag: FeatureFlag
): T => {
  // Priority: overrides > runtime > defaults
  if (flag in flagOverrides) {
    return flagOverrides[flag] as T;
  }
  
  if (flag in runtimeFlags) {
    return runtimeFlags[flag] as T;
  }
  
  return DEFAULT_FLAGS[flag] as T;
};

// Check if feature is enabled (for boolean flags)
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  const value = getFeatureFlag(flag);
  return Boolean(value);
};

// Update runtime flags (e.g., from API)
export const updateRuntimeFlags = (updates: Partial<FlagValues>): void => {
  // Filter out undefined values to maintain type safety
  const filteredUpdates: FlagValues = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      filteredUpdates[key] = value;
    }
  });
  runtimeFlags = { ...runtimeFlags, ...filteredUpdates };
};

// Get all current flag values (for analytics)
export const getAllFlagValues = (): FlagValues => {
  const values: FlagValues = {};
  
  Object.keys(DEFAULT_FLAGS).forEach((flag) => {
    values[flag] = getFeatureFlag(flag as FeatureFlag);
  });
  
  return values;
};

// Hook for React components
export const useFeatureFlag = <T = boolean | string | number>(
  flag: FeatureFlag
): T => {
  // In a real implementation, this would be a React hook with state
  // For now, it's just a wrapper around getFeatureFlag
  return getFeatureFlag<T>(flag);
};

// Helper to check multiple flags at once
export const areFeaturesEnabled = (flags: FeatureFlag[]): boolean => {
  return flags.every(flag => isFeatureEnabled(flag));
};

// Helper to get numeric flag value
export const getNumericFlag = (flag: FeatureFlag, defaultValue: number = 0): number => {
  const value = getFeatureFlag(flag);
  return typeof value === 'number' ? value : defaultValue;
};