import axios from 'axios';
import { UserPreferences } from '@/services/database/db';
import BASE_URL from '@/services/config/constants';
import { BaseAPIClient } from './BaseAPIClient';

export interface UpdateUserPreferencesRequest {
  auto_schedule_jobs?: boolean;
  default_schedule_type?: string;
  default_schedule_time?: string;
  timezone?: string;
}

class UserPreferencesAPI extends BaseAPIClient {

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
      this.handleApiError(error, 'fetch user preferences');
    }
  }

  async updateUserPreferences(walletAddress: string, preferences: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    try {
      const response = await axios.put(`${BASE_URL}/api/v1/user-preferences`, preferences, {
        headers: this.getHeaders(walletAddress)
      });
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'update user preferences');
    }
  }

  async createUserPreferences(walletAddress: string, preferences: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/user-preferences`, preferences, {
        headers: this.getHeaders(walletAddress)
      });
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'create user preferences');
    }
  }

  async deleteUserPreferences(walletAddress: string): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/api/v1/user-preferences`, {
        headers: this.getHeaders(walletAddress)
      });
    } catch (error) {
      this.handleApiError(error, 'delete user preferences');
    }
  }
}

export default new UserPreferencesAPI();