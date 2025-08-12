import { useState, useEffect } from 'react';
import { type FlagOverridesType } from 'flags';
import { getAllFlagValues, FlagValues } from '@/services/featureFlags';

// Hook to read flag overrides from cookies and combine with runtime flags
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FlagValues>(getAllFlagValues());
  const [overrides, setOverrides] = useState<FlagOverridesType>({});
  
  useEffect(() => {
    const loadOverrides = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const overrideCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('vercel-flag-overrides='))
          ?.split('=')[1];
        
        if (overrideCookie) {
          // In production with server-side rendering, you would decrypt this
          // For client-side, we parse as JSON
          const parsedOverrides = JSON.parse(decodeURIComponent(overrideCookie));
          setOverrides(parsedOverrides);
        }
      } catch (error) {
        console.error('[useFeatureFlags] Error loading overrides:', error);
      }
    };
    
    loadOverrides();
  }, []);
  
  // Combine runtime flags with overrides
  const combinedFlags = { ...flags, ...overrides };
  
  return {
    flags: combinedFlags,
    isFeatureEnabled: (flag: string) => Boolean(combinedFlags[flag]),
    getFlag: <T = any>(flag: string): T => combinedFlags[flag] as T,
  };
}