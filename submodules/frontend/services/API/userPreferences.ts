import axios from 'axios';
import { UserPreferences } from '@/services/Database/db';
import BASE_URL from '@/services/constants';

export interface UpdateUserPreferencesRequest {
  auto_schedule_jobs?: boolean;
  default_schedule_type?: string;
  default_schedule_time?: string;
  timezone?: string;
}

class UserPreferencesAPI {
  private getHeaders(walletAddress: string) {
    return {
      'Content-Type': 'application/json',
      'x-wallet-address': walletAddress,
    };
  }

  async getUserPreferences(walletAddress: string): Promise<UserPreferences | null> {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/user-preferences`, {
        headers: this.getHeaders(walletAddress)
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // User preferences don't exist yet
      }
      console.error('Error fetching user preferences:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch user preferences');
    }
  }

  async updateUserPreferences(walletAddress: string, preferences: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    try {
      const response = await axios.put(`${BASE_URL}/api/v1/user-preferences`, preferences, {
        headers: this.getHeaders(walletAddress)
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating user preferences:', error);
      throw new Error(error.response?.data?.error || 'Failed to update user preferences');
    }
  }

  async createUserPreferences(walletAddress: string, preferences: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/user-preferences`, preferences, {
        headers: this.getHeaders(walletAddress)
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating user preferences:', error);
      throw new Error(error.response?.data?.error || 'Failed to create user preferences');
    }
  }

  async deleteUserPreferences(walletAddress: string): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/api/v1/user-preferences`, {
        headers: this.getHeaders(walletAddress)
      });
    } catch (error: any) {
      console.error('Error deleting user preferences:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete user preferences');
    }
  }
}

export default new UserPreferencesAPI();