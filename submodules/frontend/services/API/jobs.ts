import axios from 'axios';
import BASE_URL from '@/services/constants';
import { Job, Message } from '@/services/Database/db';

export class JobsAPI {
  private static getHeaders(walletAddress: string) {
    return {
      'x-wallet-address': walletAddress,
      'Content-Type': 'application/json'
    };
  }

  static async getJobs(walletAddress: string): Promise<Job[]> {
    const response = await axios.get(`${BASE_URL}/api/v1/jobs`, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.jobs;
  }

  static async createJob(walletAddress: string, job: {
    name?: string;
    description?: string;
    initial_message: string;
    is_scheduled?: boolean;
    has_uploaded_file?: boolean;
  }): Promise<Job> {
    const response = await axios.post(`${BASE_URL}/api/v1/jobs`, job, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.job;
  }

  static async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
    // Extract wallet address from updates or use a default approach
    const walletAddress = updates.wallet_address || 'temp';
    const response = await axios.put(`${BASE_URL}/api/v1/jobs`, { id: jobId, ...updates }, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.job;
  }

  static async deleteJob(walletAddress: string, jobId: string): Promise<void> {
    await axios.delete(`${BASE_URL}/api/v1/jobs`, {
      data: { id: jobId },
      headers: this.getHeaders(walletAddress)
    });
  }

  static async getMessages(walletAddress: string, jobId: string): Promise<Message[]> {
    const response = await axios.get(`${BASE_URL}/api/v1/jobs/${jobId}/messages`, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.messages;
  }

  static async createMessage(walletAddress: string, jobId: string, message: {
    role: 'user' | 'assistant' | 'system';
    content: any;
    response_type?: string;
    agent_name?: string;
    error_message?: string;
    metadata?: Record<string, any>;
    requires_action?: boolean;
    action_type?: string;
    is_streaming?: boolean;
    order_index?: number;
  }): Promise<Message> {
    const response = await axios.post(`${BASE_URL}/api/v1/jobs/${jobId}/messages`, message, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.message;
  }

  // Helper method to generate a readable job name from initial message
  static generateJobName(initialMessage: string): string {
    const cleanMessage = initialMessage.trim().replace(/\n/g, ' ');
    if (cleanMessage.length <= 50) {
      return cleanMessage;
    }
    return cleanMessage.substring(0, 47) + '...';
  }

  // Helper method to determine job status from messages
  static determineJobStatus(messages: Message[]): 'pending' | 'running' | 'completed' | 'failed' {
    if (messages.length === 0) return 'pending';
    
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    if (userMessages.length === 0) return 'pending';
    if (assistantMessages.length === 0) return 'running';
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.error_message) return 'failed';
    if (lastMessage.role === 'assistant') return 'completed';
    
    return 'running';
  }

  static calculateNextRunTime(
    scheduleType: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom',
    currentTime: Date,
    intervalDays?: number
  ): Date | null {
    const nextRun = new Date(currentTime);

    switch (scheduleType) {
      case 'once':
        return null; // No next run for one-time jobs
      
      case 'hourly':
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      
      case 'custom':
        if (intervalDays) {
          nextRun.setDate(nextRun.getDate() + intervalDays);
        } else {
          return null;
        }
        break;
    }

    return nextRun;
  }

  static async getScheduledJobs(walletAddress: string): Promise<Job[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/jobs/scheduled`, {
        headers: this.getHeaders(walletAddress)
      });
      
      return response.data.jobs || [];
    } catch (error: any) {
      console.error('Error fetching scheduled jobs:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch scheduled jobs');
    }
  }

  static async runJob(walletAddress: string, jobId: string): Promise<{ newJob: Job; scheduledJob: Job }> {
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/jobs/run`, { jobId }, {
        headers: this.getHeaders(walletAddress)
      });
      
      return { newJob: response.data.newJob, scheduledJob: response.data.scheduledJob };
    } catch (error: any) {
      console.error('Error running scheduled job:', error);
      throw new Error(error.response?.data?.error || 'Failed to run scheduled job');
    }
  }
}

export default JobsAPI;