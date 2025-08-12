import axios from 'axios';
import BASE_URL from '@/services/constants';
import { UserPreferences } from '@/services/Database/db';

export class PreferencesAPI {
  private static getHeaders(walletAddress: string) {
    return {
      'x-wallet-address': walletAddress,
      'Content-Type': 'application/json'
    };
  }

  static async getPreferences(walletAddress: string): Promise<UserPreferences> {
    const response = await axios.get(`${BASE_URL}/api/v1/user/preferences`, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.preferences;
  }

  static async updatePreferences(walletAddress: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await axios.put(`${BASE_URL}/api/v1/user/preferences`, preferences, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.preferences;
  }

  static async shouldAutoScheduleJobs(walletAddress: string): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(walletAddress);
      return preferences.auto_schedule_jobs;
    } catch (error) {
      console.error('Error checking auto-schedule preference:', error);
      return false; // Default to false if can't determine
    }
  }

  static async getDefaultScheduleSettings(walletAddress: string): Promise<{
    schedule_type: string;
    schedule_time: string;
    timezone: string;
  }> {
    try {
      const preferences = await this.getPreferences(walletAddress);
      return {
        schedule_type: preferences.default_schedule_type,
        schedule_time: preferences.default_schedule_time,
        timezone: preferences.timezone
      };
    } catch (error) {
      console.error('Error getting default schedule settings:', error);
      return {
        schedule_type: 'daily',
        schedule_time: '09:00:00',
        timezone: 'UTC'
      };
    }
  }
}

export default PreferencesAPI;