import { useRouter } from 'next/router';

export const useSettingsNavigation = () => {
  const router = useRouter();

  const navigateToSettingsTab = (tabId: string) => {
    router.push(`/settings?tab=${tabId}`);
  };

  const navigateToAccountSettings = () => {
    navigateToSettingsTab('account');
  };

  const navigateToGeneralSettings = () => {
    navigateToSettingsTab('general');
  };

  const navigateToRulesSettings = () => {
    navigateToSettingsTab('rules');
  };

  const navigateToCredentialsSettings = () => {
    navigateToSettingsTab('credentials');
  };

  const navigateToMCPSettings = () => {
    navigateToSettingsTab('mcp');
  };

  const navigateToA2ASettings = () => {
    navigateToSettingsTab('a2a');
  };

  return {
    navigateToSettingsTab,
    navigateToAccountSettings,
    navigateToGeneralSettings,
    navigateToRulesSettings,
    navigateToCredentialsSettings,
    navigateToMCPSettings,
    navigateToA2ASettings,
  };
};
