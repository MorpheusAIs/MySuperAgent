import axios from 'axios';
import BASE_URL from '@/services/constants';
import { ScheduledJob } from './db';

export class ScheduledJobsAPI {
  private static getHeaders() {
    // In production, this would use actual user authentication
    return {
      'x-user-id': 'default-user'
    };
  }

  static async getScheduledJobs(): Promise<ScheduledJob[]> {
    const response = await axios.get(`${BASE_URL}/v1/scheduled-jobs`, {
      headers: this.getHeaders()
    });
    return response.data.jobs;
  }

  static async createScheduledJob(job: Omit<ScheduledJob, 'id' | 'created_at' | 'updated_at' | 'last_run_at' | 'run_count' | 'user_identifier'>): Promise<ScheduledJob> {
    const response = await axios.post(`${BASE_URL}/v1/scheduled-jobs`, job, {
      headers: this.getHeaders()
    });
    return response.data.job;
  }

  static async updateScheduledJob(id: number, updates: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const response = await axios.put(`${BASE_URL}/v1/scheduled-jobs`, { id, ...updates }, {
      headers: this.getHeaders()
    });
    return response.data.job;
  }

  static async deleteScheduledJob(id: number): Promise<void> {
    await axios.delete(`${BASE_URL}/v1/scheduled-jobs`, {
      data: { id },
      headers: this.getHeaders()
    });
  }

  static async deactivateScheduledJob(id: number): Promise<ScheduledJob> {
    return this.updateScheduledJob(id, { is_active: false });
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