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
    <Box p={6} bg="gray.800" borderRadius="lg" color="white" maxWidth="500px">
      <VStack spacing={6} align="stretch">
        <HStack spacing={3}>
          <SettingsIcon w={5} h={5} color="blue.400" />
          <Text fontSize="lg" fontWeight="semibold">
            User Preferences
          </Text>
        </HStack>

        <Divider borderColor="gray.600" />

        {/* Auto-scheduling preferences */}
        <VStack spacing={4} align="stretch">
          <Text fontSize="md" fontWeight="medium" color="gray.200">
            Job Scheduling
          </Text>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0" fontSize="sm" color="gray.300">
              Auto-schedule all jobs
            </FormLabel>
            <Switch
              isChecked={preferences.auto_schedule_jobs}
              onChange={(e) => handlePreferenceChange('auto_schedule_jobs', e.target.checked)}
              colorScheme="blue"
            />
          </FormControl>

          <Text fontSize="xs" color="gray.500">
            When enabled, all new jobs will be automatically scheduled using your default settings
          </Text>

          {preferences.auto_schedule_jobs && (
            <VStack spacing={3} align="stretch" pl={4} borderLeft="2px solid" borderColor="blue.500">
              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">
                  Default Schedule Type
                </FormLabel>
                <Select
                  value={preferences.default_schedule_type}
                  onChange={(e) => handlePreferenceChange('default_schedule_type', e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  _hover={{ borderColor: "gray.500" }}
                  _focus={{ borderColor: "blue.400" }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">
                  Default Schedule Time
                </FormLabel>
                <Select
                  value={preferences.default_schedule_time}
                  onChange={(e) => handlePreferenceChange('default_schedule_time', e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  _hover={{ borderColor: "gray.500" }}
                  _focus={{ borderColor: "blue.400" }}
                >
                  <option value="06:00:00">6:00 AM</option>
                  <option value="07:00:00">7:00 AM</option>
                  <option value="08:00:00">8:00 AM</option>
                  <option value="09:00:00">9:00 AM</option>
                  <option value="10:00:00">10:00 AM</option>
                  <option value="11:00:00">11:00 AM</option>
                  <option value="12:00:00">12:00 PM</option>
                  <option value="13:00:00">1:00 PM</option>
                  <option value="14:00:00">2:00 PM</option>
                  <option value="15:00:00">3:00 PM</option>
                  <option value="16:00:00">4:00 PM</option>
                  <option value="17:00:00">5:00 PM</option>
                  <option value="18:00:00">6:00 PM</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.300">
                  Timezone
                </FormLabel>
                <Text
                  fontSize="sm"
                  color="gray.400"
                  bg="gray.700"
                  p={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.600"
                >
                  {preferences.timezone}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Timezone is automatically detected from your browser
                </Text>
              </FormControl>
            </VStack>
          )}
        </VStack>

        <Divider borderColor="gray.600" />

        {/* Save button */}
        <HStack justify="flex-end" spacing={3}>
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={isSaving}
            >
              Cancel
            </Button>
          )}
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save Preferences
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};