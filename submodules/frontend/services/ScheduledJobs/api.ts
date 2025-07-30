import axios from 'axios';
import BASE_URL from '@/services/constants';
import { ScheduledJob } from '@/services/Database/db';

export class ScheduledJobsAPI {
  private static getHeaders(walletAddress: string) {
    return {
      'x-wallet-address': walletAddress,
      'Content-Type': 'application/json'
    };
  }

  static async getScheduledJobs(walletAddress: string): Promise<ScheduledJob[]> {
    const response = await axios.get(`${BASE_URL}/api/v1/scheduled-jobs`, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.jobs;
  }

  static async createScheduledJob(walletAddress: string, job: {
    job_name: string;
    job_description?: string;
    message_content: string;
    schedule_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
    schedule_time: string;
    interval_days?: number;
    max_runs?: number;
    timezone?: string;
  }): Promise<ScheduledJob> {
    const response = await axios.post(`${BASE_URL}/api/v1/scheduled-jobs`, job, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.job;
  }

  static async updateScheduledJob(walletAddress: string, id: number, updates: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const response = await axios.put(`${BASE_URL}/api/v1/scheduled-jobs`, { id, ...updates }, {
      headers: this.getHeaders(walletAddress)
    });
    return response.data.job;
  }

  static async deleteScheduledJob(walletAddress: string, id: number): Promise<void> {
    await axios.delete(`${BASE_URL}/api/v1/scheduled-jobs`, {
      data: { id },
      headers: this.getHeaders(walletAddress)
    });
  }

  static async deactivateScheduledJob(walletAddress: string, id: number): Promise<ScheduledJob> {
    return this.updateScheduledJob(walletAddress, id, { is_active: false });
  }

  static formatScheduleDescription(job: ScheduledJob): string {
    const scheduleTime = new Date(job.schedule_time).toLocaleString();
    
    switch (job.schedule_type) {
      case 'once':
        return `Once at ${scheduleTime}`;
      case 'daily':
        return `Daily at ${new Date(job.schedule_time).toLocaleTimeString()}`;
      case 'weekly':
        return `Weekly on ${new Date(job.schedule_time).toLocaleDateString()} at ${new Date(job.schedule_time).toLocaleTimeString()}`;
      case 'monthly':
        return `Monthly on day ${new Date(job.schedule_time).getDate()} at ${new Date(job.schedule_time).toLocaleTimeString()}`;
      case 'custom':
        return `Every ${job.interval_days} days at ${new Date(job.schedule_time).toLocaleTimeString()}`;
      default:
        return scheduleTime;
    }
  }
}

export default ScheduledJobsAPI;