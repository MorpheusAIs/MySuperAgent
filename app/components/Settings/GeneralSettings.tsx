import { useWalletAddress } from '@/services/wallet/utils';
import {
  Button,
  FormControl,
  FormLabel,
  Spinner,
  Text,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import styles from './GeneralSettings.module.css';

interface GeneralSettingsProps {
  onSave: () => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ onSave }) => {
  const [settings, setSettings] = useState({
    aiPersonality: '',
    bio: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  // Load existing settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const walletAddress = getAddress();
      if (!walletAddress) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/v1/user-preferences', {
          headers: {
            'x-wallet-address': walletAddress,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSettings({
            aiPersonality: data.ai_personality || '',
            bio: data.user_bio || '',
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your settings',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [getAddress, toast]);

  const handleSave = async () => {
    const walletAddress = getAddress();
    if (!walletAddress) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to save settings',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          ai_personality: settings.aiPersonality,
          user_bio: settings.bio,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Settings Saved',
          description: 'Your settings have been successfully saved',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onSave();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your settings. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <VStack spacing={6} align="center" py={8}>
        <Spinner size="lg" color="blue.400" />
        <Text color="white">Loading settings...</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel className={styles.label}>
          Give your Superagent a personality
        </FormLabel>
        <Textarea
          value={settings.aiPersonality}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, aiPersonality: e.target.value }))
          }
          placeholder="Describe how you want your AI assistant to behave"
          rows={4}
          className={styles.textarea}
          disabled={isSaving}
        />
      </FormControl>

      <FormControl>
        <FormLabel className={styles.label}>Tell us about yourself</FormLabel>
        <Textarea
          value={settings.bio}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, bio: e.target.value }))
          }
          placeholder="Share a bit about yourself"
          rows={4}
          className={styles.textarea}
          disabled={isSaving}
        />
      </FormControl>

      <Button
        onClick={handleSave}
        className={styles.saveButton}
        isLoading={isSaving}
        loadingText="Saving..."
        disabled={isSaving}
      >
        Save Settings
      </Button>
    </VStack>
  );
};
