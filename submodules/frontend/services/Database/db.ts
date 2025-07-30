import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Types
export interface User {
  wallet_address: string;
  created_at: Date;
  updated_at: Date;
  last_active: Date;
}

export interface UserPreferences {
  wallet_address: string;
  auto_schedule_jobs: boolean;
  default_schedule_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  default_schedule_time: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface Job {
  id: string;
  wallet_address: string;
  name: string;
  description: string | null;
  initial_message: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  is_scheduled: boolean;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  has_uploaded_file: boolean;
}

export interface Message {
  id: string;
  job_id: string;
  role: 'user' | 'assistant' | 'system';
  content: any;
  response_type?: string;
  agent_name?: string;
  error_message?: string;
  metadata: Record<string, any>;
  requires_action: boolean;
  action_type?: string;
  is_streaming: boolean;
  created_at: Date;
  order_index: number;
}

export interface ScheduledJob {
  id: number;
  job_id: string;
  wallet_address: string;
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

// Database service classes
export class UserDB {
  static async createOrUpdateUser(walletAddress: string): Promise<User> {
    const query = `
      INSERT INTO users (wallet_address, last_active)
      VALUES ($1, CURRENT_TIMESTAMP)
      ON CONFLICT (wallet_address)
      DO UPDATE SET last_active = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows[0];
  }

  static async getUser(walletAddress: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE wallet_address = $1;';
    const result = await pool.query(query, [walletAddress]);
    return result.rows[0] || null;
  }
}

export class UserPreferencesDB {
  static async getPreferences(walletAddress: string): Promise<UserPreferences> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(walletAddress);
    
    const query = 'SELECT * FROM user_preferences WHERE wallet_address = $1;';
    const result = await pool.query(query, [walletAddress]);
    return result.rows[0];
  }

  static async updatePreferences(walletAddress: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(walletAddress);

    const allowedFields = ['auto_schedule_jobs', 'default_schedule_type', 'default_schedule_time', 'timezone'];
    const updateFields = Object.keys(preferences)
      .filter(key => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.keys(preferences)
      .filter(key => allowedFields.includes(key))
      .map(key => preferences[key as keyof UserPreferences]);
    
    const query = `
      UPDATE user_preferences 
      SET ${updateFields}
      WHERE wallet_address = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [walletAddress, ...values]);
    return result.rows[0];
  }
}

export class JobDB {
  static async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<Job> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(job.wallet_address);

    const query = `
      INSERT INTO jobs (
        wallet_address, name, description, initial_message, 
        status, is_scheduled, has_uploaded_file
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const values = [
      job.wallet_address,
      job.name,
      job.description,
      job.initial_message,
      job.status || 'pending',
      job.is_scheduled || false,
      job.has_uploaded_file || false
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getJobsByWallet(walletAddress: string): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE wallet_address = $1 
      ORDER BY created_at DESC;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async getJob(jobId: string): Promise<Job | null> {
    const query = 'SELECT * FROM jobs WHERE id = $1;';
    const result = await pool.query(query, [jobId]);
    return result.rows[0] || null;
  }

  static async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
    const allowedFields = ['name', 'description', 'status', 'is_scheduled', 'completed_at', 'has_uploaded_file'];
    const updateFields = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => updates[key as keyof Job]);
    
    const query = `
      UPDATE jobs 
      SET ${updateFields}
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [jobId, ...values]);
    return result.rows[0];
  }

  static async deleteJob(jobId: string): Promise<void> {
    const query = 'DELETE FROM jobs WHERE id = $1;';
    await pool.query(query, [jobId]);
  }
}

export class MessageDB {
  static async createMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const query = `
      INSERT INTO messages (
        job_id, role, content, response_type, agent_name, 
        error_message, metadata, requires_action, action_type, 
        is_streaming, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    
    const values = [
      message.job_id,
      message.role,
      JSON.stringify(message.content),
      message.response_type,
      message.agent_name,
      message.error_message,
      JSON.stringify(message.metadata || {}),
      message.requires_action || false,
      message.action_type,
      message.is_streaming || false,
      message.order_index
    ];
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      content: JSON.parse(row.content),
      metadata: JSON.parse(row.metadata)
    };
  }

  static async getMessagesByJob(jobId: string): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE job_id = $1 
      ORDER BY order_index ASC;
    `;
    
    const result = await pool.query(query, [jobId]);
    return result.rows.map(row => ({
      ...row,
      content: JSON.parse(row.content),
      metadata: JSON.parse(row.metadata)
    }));
  }

  static async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    const allowedFields = ['content', 'response_type', 'agent_name', 'error_message', 'metadata', 'requires_action', 'action_type', 'is_streaming'];
    const updateFields = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map((key, index) => {
        if (key === 'content' || key === 'metadata') {
          return `${key} = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
      })
      .join(', ');
    
    const values = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => {
        if (key === 'content' || key === 'metadata') {
          return JSON.stringify(updates[key as keyof Message]);
        }
        return updates[key as keyof Message];
      });
    
    const query = `
      UPDATE messages 
      SET ${updateFields}
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [messageId, ...values]);
    const row = result.rows[0];
    return {
      ...row,
      content: JSON.parse(row.content),
      metadata: JSON.parse(row.metadata)
    };
  }
}

export class ScheduledJobDB {
  static async createScheduledJob(scheduledJob: Omit<ScheduledJob, 'id' | 'created_at' | 'updated_at' | 'last_run_at' | 'run_count'>): Promise<ScheduledJob> {
    const query = `
      INSERT INTO scheduled_jobs (
        job_id, wallet_address, schedule_type, schedule_time, next_run_time,
        interval_days, is_active, max_runs, timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    
    const values = [
      scheduledJob.job_id,
      scheduledJob.wallet_address,
      scheduledJob.schedule_type,
      scheduledJob.schedule_time,
      scheduledJob.next_run_time,
      scheduledJob.interval_days,
      scheduledJob.is_active ?? true,
      scheduledJob.max_runs,
      scheduledJob.timezone || 'UTC'
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getScheduledJobsByWallet(walletAddress: string): Promise<ScheduledJob[]> {
    const query = `
      SELECT * FROM scheduled_jobs 
      WHERE wallet_address = $1 
      ORDER BY next_run_time ASC;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async getJobsToRun(): Promise<ScheduledJob[]> {
    const query = `
      SELECT * FROM scheduled_jobs 
      WHERE is_active = true 
        AND next_run_time <= NOW()
        AND (max_runs IS NULL OR run_count < max_runs)
      ORDER BY next_run_time ASC
      LIMIT 50;
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateScheduledJobAfterRun(scheduledJobId: number, nextRunTime: Date | null): Promise<void> {
    if (nextRunTime) {
      const query = `
        UPDATE scheduled_jobs 
        SET last_run_at = NOW(), 
            run_count = run_count + 1,
            next_run_time = $2
        WHERE id = $1;
      `;
      await pool.query(query, [scheduledJobId, nextRunTime]);
    } else {
      // Deactivate job if no next run time
      const query = `
        UPDATE scheduled_jobs 
        SET last_run_at = NOW(), 
            run_count = run_count + 1,
            is_active = false
        WHERE id = $1;
      `;
      await pool.query(query, [scheduledJobId]);
    }
  }

  static async updateScheduledJob(scheduledJobId: number, updates: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const allowedFields = [
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
      UPDATE scheduled_jobs 
      SET ${updateFields}
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [scheduledJobId, ...values]);
    return result.rows[0];
  }

  static async deleteScheduledJob(scheduledJobId: number): Promise<void> {
    const query = 'DELETE FROM scheduled_jobs WHERE id = $1;';
    await pool.query(query, [scheduledJobId]);
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

export default {
  UserDB,
  UserPreferencesDB,
  JobDB,
  MessageDB,
  ScheduledJobDB
};