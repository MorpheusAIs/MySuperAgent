import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface ScheduledJob {
  id: number;
  user_identifier: string;
  job_name: string;
  job_description: string | null;
  message_content: string;
  schedule_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule_time: Date;
  next_run_time: Date;
  interval_days: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_run_at: Date | null;
  run_count: number;
  max_runs: number | null;
  timezone: string;
}

export class ScheduledJobsDB {
  static async createJob(job: Omit<ScheduledJob, 'id' | 'created_at' | 'updated_at' | 'last_run_at' | 'run_count'>): Promise<ScheduledJob> {
    const query = `
      INSERT INTO recurring_jobs (
        user_identifier, job_name, job_description, message_content,
        schedule_type, schedule_time, next_run_time, interval_days,
        is_active, max_runs, timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    
    const values = [
      job.user_identifier,
      job.job_name,
      job.job_description,
      job.message_content,
      job.schedule_type,
      job.schedule_time,
      job.next_run_time,
      job.interval_days,
      job.is_active ?? true,
      job.max_runs,
      job.timezone || 'UTC'
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getJobsByUser(userIdentifier: string): Promise<ScheduledJob[]> {
    const query = `
      SELECT * FROM recurring_jobs 
      WHERE user_identifier = $1 
      ORDER BY next_run_time ASC;
    `;
    
    const result = await pool.query(query, [userIdentifier]);
    return result.rows;
  }

  static async getActiveJobsByUser(userIdentifier: string): Promise<ScheduledJob[]> {
    const query = `
      SELECT * FROM recurring_jobs 
      WHERE user_identifier = $1 AND is_active = true
      ORDER BY next_run_time ASC;
    `;
    
    const result = await pool.query(query, [userIdentifier]);
    return result.rows;
  }

  static async getJobsToRun(): Promise<ScheduledJob[]> {
    const query = `
      SELECT * FROM recurring_jobs 
      WHERE is_active = true 
        AND next_run_time <= NOW()
        AND (max_runs IS NULL OR run_count < max_runs)
      ORDER BY next_run_time ASC
      LIMIT 50;
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateJobAfterRun(jobId: number, nextRunTime: Date | null): Promise<void> {
    if (nextRunTime) {
      const query = `
        UPDATE recurring_jobs 
        SET last_run_at = NOW(), 
            run_count = run_count + 1,
            next_run_time = $2
        WHERE id = $1;
      `;
      await pool.query(query, [jobId, nextRunTime]);
    } else {
      // Deactivate job if no next run time
      const query = `
        UPDATE recurring_jobs 
        SET last_run_at = NOW(), 
            run_count = run_count + 1,
            is_active = false
        WHERE id = $1;
      `;
      await pool.query(query, [jobId]);
    }
  }

  static async updateJob(jobId: number, updates: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const allowedFields = [
      'job_name', 'job_description', 'message_content', 
      'schedule_type', 'schedule_time', 'next_run_time', 
      'interval_days', 'is_active', 'max_runs', 'timezone'
    ];
    
    const updateFields = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => updates[key as keyof ScheduledJob]);
    
    const query = `
      UPDATE recurring_jobs 
      SET ${updateFields}
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [jobId, ...values]);
    return result.rows[0];
  }

  static async deleteJob(jobId: number): Promise<void> {
    const query = 'DELETE FROM recurring_jobs WHERE id = $1;';
    await pool.query(query, [jobId]);
  }

  static async deactivateJob(jobId: number): Promise<void> {
    const query = 'UPDATE recurring_jobs SET is_active = false WHERE id = $1;';
    await pool.query(query, [jobId]);
  }

  static calculateNextRunTime(
    scheduleType: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom',
    currentTime: Date,
    intervalDays?: number
  ): Date | null {
    const nextRun = new Date(currentTime);

    switch (scheduleType) {
      case 'once':
        return null; // No next run for one-time jobs
      
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
}

export default ScheduledJobsDB;