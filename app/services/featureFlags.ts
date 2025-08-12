/**
 * Simple feature flags implementation
 * This is a minimal replacement for the previous feature flags system
 */

// Default feature flags - all disabled for now
const DEFAULT_FLAGS = {
  schedulingV2: false,
  enhancedSecurity: false,
  multiChainSupport: false,
  advancedAnalytics: false,
};

export type FlagValues = typeof DEFAULT_FLAGS;

export const FLAG_DEFINITIONS = DEFAULT_FLAGS;

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureName: string): boolean => {
  // All features are disabled by default in this cleanup version
  return DEFAULT_FLAGS[featureName as keyof typeof DEFAULT_FLAGS] ?? false;
};

/**
 * Get feature flag value
 */
export const getFeatureFlag = (featureName: string): boolean => {
  return isFeatureEnabled(featureName);
};

/**
 * Legacy hooks for backward compatibility
 */
export const useFeatureFlag = (featureName: string): boolean => {
  return isFeatureEnabled(featureName);
};

export const updateRuntimeFlags = () => {
  // No-op in this simplified version
};

export const getAllFlagValues = () => {
  return DEFAULT_FLAGS;
};

export const areFeaturesEnabled = (features: string[]): boolean => {
  return features.every(feature => isFeatureEnabled(feature));
};

export const getNumericFlag = (featureName: string, defaultValue: number = 0): number => {
  return defaultValue; // Always return default in this simplified version
};