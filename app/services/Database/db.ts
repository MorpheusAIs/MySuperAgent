import { Pool } from 'pg';
import { env } from '../config/env';

// Initialize database pool with proper error handling
let pool: Pool;
try {
  const config = env.getConfig();
  pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
} catch (error) {
  console.error('Failed to initialize database pool:', error);
  throw error;
}

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
  default_schedule_type: 'once' | 'daily' | 'weekly' | 'custom';
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
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  has_uploaded_file: boolean;
  
  // Optional scheduling fields
  is_scheduled: boolean;
  schedule_type?: 'once' | 'hourly' | 'daily' | 'weekly' | 'custom' | null;
  schedule_time?: Date | null;
  next_run_time?: Date | null;
  interval_days?: number | null;
  weekly_days?: string | null;
  is_active: boolean;
  last_run_at?: Date | null;
  run_count: number;
  max_runs?: number | null;
  timezone: string;
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

export interface AgentTeam {
  id: string;
  wallet_address: string;
  name: string;
  description: string | null;
  agents: string[];
  created_at: Date;
  updated_at: Date;
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

    // First try to update, if no rows affected, insert
    const allowedFields = ['auto_schedule_jobs', 'default_schedule_type', 'default_schedule_time', 'timezone'];
    const updateFields = Object.keys(preferences)
      .filter(key => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.keys(preferences)
      .filter(key => allowedFields.includes(key))
      .map(key => preferences[key as keyof UserPreferences]);
    
    const updateQuery = `
      UPDATE user_preferences 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1
      RETURNING *;
    `;
    
    const updateResult = await pool.query(updateQuery, [walletAddress, ...values]);
    
    if (updateResult.rows.length > 0) {
      return updateResult.rows[0];
    }
    
    // If no rows were updated, insert new preferences
    const insertQuery = `
      INSERT INTO user_preferences (
        wallet_address, auto_schedule_jobs, default_schedule_type, 
        default_schedule_time, timezone
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const insertValues = [
      walletAddress,
      preferences.auto_schedule_jobs || false,
      preferences.default_schedule_type || 'daily',
      preferences.default_schedule_time || '09:00:00',
      preferences.timezone || 'UTC'
    ];
    
    const insertResult = await pool.query(insertQuery, insertValues);
    return insertResult.rows[0];
  }

  static async createPreferences(walletAddress: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(walletAddress);

    const query = `
      INSERT INTO user_preferences (
        wallet_address, auto_schedule_jobs, default_schedule_type, 
        default_schedule_time, timezone
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const values = [
      walletAddress,
      preferences.auto_schedule_jobs || false,
      preferences.default_schedule_type || 'daily',
      preferences.default_schedule_time || '09:00:00',
      preferences.timezone || 'UTC'
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deletePreferences(walletAddress: string): Promise<void> {
    const query = 'DELETE FROM user_preferences WHERE wallet_address = $1;';
    await pool.query(query, [walletAddress]);
  }
}

export class JobDB {
  static async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<Job> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(job.wallet_address);

    const query = `
      INSERT INTO jobs (
        wallet_address, name, description, initial_message, 
        status, has_uploaded_file, is_scheduled, schedule_type, 
        schedule_time, next_run_time, interval_days, is_active, 
        last_run_at, run_count, max_runs, timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;
    
    const values = [
      job.wallet_address,
      job.name,
      job.description,
      job.initial_message,
      job.status || 'pending',
      job.has_uploaded_file || false,
      job.is_scheduled || false,
      job.schedule_type || null,
      job.schedule_time || null,
      job.next_run_time || null,
      job.interval_days || null,
      job.is_active !== undefined ? job.is_active : true,
      job.last_run_at || null,
      job.run_count || 0,
      job.max_runs || null,
      job.timezone || 'UTC'
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
    const allowedFields = [
      'name', 'description', 'status', 'completed_at', 'has_uploaded_file',
      'is_scheduled', 'schedule_type', 'schedule_time', 'next_run_time', 
      'interval_days', 'is_active', 'last_run_at', 'run_count', 'max_runs', 'timezone'
    ];
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

  static async getScheduledJobs(walletAddress: string): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE wallet_address = $1 AND is_scheduled = TRUE 
      ORDER BY next_run_time ASC;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async getActiveScheduledJobs(): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE is_scheduled = TRUE AND is_active = TRUE 
      AND next_run_time <= CURRENT_TIMESTAMP
      ORDER BY next_run_time ASC;
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static calculateNextRunTime(
    scheduleType: 'once' | 'daily' | 'weekly' | 'custom',
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
    
    // Safely parse content and metadata
    let content, metadata;
    
    try {
      content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    } catch (e) {
      // If parsing fails, treat as plain string
      content = row.content;
    }
    
    try {
      metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    } catch (e) {
      // If parsing fails, use empty object
      metadata = {};
    }
    
    return {
      ...row,
      content,
      metadata
    };
  }

  static async getMessagesByJob(jobId: string): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE job_id = $1 
      ORDER BY order_index ASC;
    `;
    
    const result = await pool.query(query, [jobId]);
    return result.rows.map(row => {
      let content, metadata;
      
      try {
        content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
      } catch (e) {
        // If parsing fails, treat as plain string
        content = row.content;
      }
      
      try {
        metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      } catch (e) {
        // If parsing fails, use empty object
        metadata = {};
      }
      
      return {
        ...row,
        content,
        metadata
      };
    });
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
    
    // Safely parse content and metadata
    let content, metadata;
    
    try {
      content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    } catch (e) {
      // If parsing fails, treat as plain string
      content = row.content;
    }
    
    try {
      metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    } catch (e) {
      // If parsing fails, use empty object
      metadata = {};
    }
    
    return {
      ...row,
      content,
      metadata
    };
  }
}

export class AgentTeamDB {
  static async createTeam(team: Omit<AgentTeam, 'id' | 'created_at' | 'updated_at'>): Promise<AgentTeam> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(team.wallet_address);

    const query = `
      INSERT INTO agent_teams (wallet_address, name, description, agents)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const values = [
      team.wallet_address,
      team.name,
      team.description || null,
      team.agents
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getTeamsByWallet(walletAddress: string): Promise<AgentTeam[]> {
    const query = `
      SELECT * FROM agent_teams 
      WHERE wallet_address = $1 
      ORDER BY created_at DESC;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async getTeam(teamId: string): Promise<AgentTeam | null> {
    const query = 'SELECT * FROM agent_teams WHERE id = $1;';
    const result = await pool.query(query, [teamId]);
    return result.rows[0] || null;
  }

  static async updateTeam(teamId: string, updates: Partial<Omit<AgentTeam, 'id' | 'wallet_address' | 'created_at' | 'updated_at'>>): Promise<AgentTeam> {
    const allowedFields = ['name', 'description', 'agents'];
    const updateFields = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => updates[key as keyof typeof updates]);
    
    const query = `
      UPDATE agent_teams 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [teamId, ...values]);
    return result.rows[0];
  }

  static async deleteTeam(teamId: string): Promise<void> {
    const query = 'DELETE FROM agent_teams WHERE id = $1;';
    await pool.query(query, [teamId]);
  }
}

export default {
  UserDB,
  UserPreferencesDB,
  JobDB,
  MessageDB,
  AgentTeamDB
};