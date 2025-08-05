import React, { FC, useState, useEffect } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Select,
  Button,
  Text,
  useToast,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { UserPreferences } from '@/services/Database/db';
import UserPreferencesAPI from '@/services/API/userPreferences';
import { useWalletAddress } from '@/services/Wallet/utils';

interface UserPreferencesProps {
  onClose?: () => void;
}

export const UserPreferencesComponent: FC<UserPreferencesProps> = ({ onClose }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    wallet_address: '',
    auto_schedule_jobs: false,
    default_schedule_type: 'daily',
    default_schedule_time: '09:00:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    created_at: new Date(),
    updated_at: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { getAddress } = useWalletAddress();
  const toast = useToast();

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          // No wallet connected, use defaults
          setIsLoading(false);
          return;
        }
        const userPrefs = await UserPreferencesAPI.getUserPreferences(walletAddress);
        if (userPrefs) {
          setPreferences(userPrefs);
        } else {
          // Set wallet address for new preferences
          setPreferences(prev => ({
            ...prev,
            wallet_address: walletAddress,
          }));
        }
      } catch (error: any) {
        console.error('Error loading user preferences:', error);
        // Set wallet address even on error
        setPreferences(prev => ({
          ...prev,
          wallet_address: getAddress(),
        }));
        if (!error.message?.includes('Database service unavailable')) {
          toast({
            title: 'Failed to load preferences',
            description: 'Using default settings',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [getAddress, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const walletAddress = getAddress();
      if (!walletAddress) {
        toast({
          title: 'Wallet not connected',
          description: 'Please connect your wallet to save preferences',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setIsSaving(false);
        return;
      }
      await UserPreferencesAPI.updateUserPreferences(walletAddress, {
        auto_schedule_jobs: preferences.auto_schedule_jobs,
        default_schedule_type: preferences.default_schedule_type,
        default_schedule_time: preferences.default_schedule_time,
        timezone: preferences.timezone,
      });

      toast({
        title: 'Preferences saved',
        description: 'Your settings have been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Failed to save preferences',
        description: error.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <Box p={6}>
        <Text color="gray.500" textAlign="center">
          Loading preferences...
        </Text>
      </Box>
    );
  }

  return (
    <Box p={4} color="white">
      <VStack spacing={4} align="stretch">
        <Text fontSize="16px" fontWeight="500" mb={2}>
          Scheduling Preferences
        </Text>

        <Divider borderColor="rgba(255, 255, 255, 0.1)" />

        {/* Auto-scheduling preferences */}
        <VStack spacing={3} align="stretch">
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <FormLabel mb="0" fontSize="14px" fontWeight="500" color="white">
              Auto-schedule all jobs
            </FormLabel>
            <Switch
              isChecked={preferences.auto_schedule_jobs}
              onChange={(e) => handlePreferenceChange('auto_schedule_jobs', e.target.checked)}
              sx={{
                '.chakra-switch__track': {
                  bg: 'rgba(255, 255, 255, 0.1)',
                  _checked: {
                    bg: 'rgba(255, 255, 255, 0.3)',
                  },
                },
              }}
            />
          </FormControl>

          <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)">
            When enabled, all new jobs will be automatically scheduled using your default settings
          </Text>

          {preferences.auto_schedule_jobs && (
            <VStack spacing={3} align="stretch" pl={4} borderLeft="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
              <FormControl>
                <FormLabel fontSize="14px" fontWeight="500" color="white">
                  Default Schedule Type
                </FormLabel>
                <Select
                  value={preferences.default_schedule_type}
                  onChange={(e) => handlePreferenceChange('default_schedule_type', e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                  _focus={{ borderColor: "rgba(255, 255, 255, 0.3)", boxShadow: "none" }}
                >
                  <option value="daily" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Daily</option>
                  <option value="weekly" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Weekly</option>
                  <option value="monthly" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Monthly</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="14px" fontWeight="500" color="white">
                  Default Schedule Time
                </FormLabel>
                <Select
                  value={preferences.default_schedule_time}
                  onChange={(e) => handlePreferenceChange('default_schedule_time', e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                  _focus={{ borderColor: "rgba(255, 255, 255, 0.3)", boxShadow: "none" }}
                >
                  <option value="06:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>6:00 AM</option>
                  <option value="07:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>7:00 AM</option>
                  <option value="08:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>8:00 AM</option>
                  <option value="09:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>9:00 AM</option>
                  <option value="10:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>10:00 AM</option>
                  <option value="11:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>11:00 AM</option>
                  <option value="12:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>12:00 PM</option>
                  <option value="13:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>1:00 PM</option>
                  <option value="14:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>2:00 PM</option>
                  <option value="15:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>3:00 PM</option>
                  <option value="16:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>4:00 PM</option>
                  <option value="17:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>5:00 PM</option>
                  <option value="18:00:00" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>6:00 PM</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="14px" fontWeight="500" color="white">
                  Timezone
                </FormLabel>
                <Text
                  fontSize="14px"
                  color="rgba(255, 255, 255, 0.8)"
                  bg="rgba(255, 255, 255, 0.05)"
                  p={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                >
                  {preferences.timezone}
                </Text>
                <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)" mt={1}>
                  Timezone is automatically detected from your browser
                </Text>
              </FormControl>
            </VStack>
          )}
        </VStack>

        <Divider borderColor="rgba(255, 255, 255, 0.1)" />

        {/* Save button */}
        <HStack justify="flex-end" spacing={3}>
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={isSaving}
              color="rgba(255, 255, 255, 0.7)"
              _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
            bg="rgba(255, 255, 255, 0.1)"
            color="white"
            _hover={{ bg: "rgba(255, 255, 255, 0.15)" }}
            _active={{ bg: "rgba(255, 255, 255, 0.2)" }}
          >
            Save Preferences
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};