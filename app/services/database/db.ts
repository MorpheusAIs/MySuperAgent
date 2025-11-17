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
  id?: number;
  wallet_address: string;
  email?: string | null;
  privy_user_id?: string | null;
  created_at: Date;
  updated_at: Date;
  last_active: Date;
  deleted_at?: Date | null;
}

export interface UserPreferences {
  wallet_address: string;
  auto_schedule_jobs: boolean;
  default_schedule_type: 'once' | 'daily' | 'weekly' | 'custom';
  default_schedule_time: string;
  timezone: string;
  ai_personality?: string;
  user_bio?: string;
  similarity_enabled?: boolean;
  similarity_threshold?: number;
  max_similar_prompts?: number;
  similarity_context_enabled?: boolean;
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
  parent_job_id?: string | null;
  metadata?: Record<string, any> | null;
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

// New interfaces for credential management
export interface UserCredential {
  id: string;
  wallet_address: string;
  service_type: 'mcp_server' | 'a2a_agent' | 'api_service';
  service_name: string;
  credential_name: string;
  encrypted_value: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_used_at: Date | null;
}

export interface UserMCPServer {
  id: string;
  wallet_address: string;
  server_name: string;
  server_url: string;
  connection_config: Record<string, any>;
  is_enabled: boolean;
  health_status: 'healthy' | 'error' | 'timeout' | 'unknown';
  last_health_check: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserA2AAgent {
  id: string;
  wallet_address: string;
  agent_id: string;
  agent_name: string;
  agent_description: string | null;
  endpoint_url: string;
  capabilities: string[];
  is_enabled: boolean;
  connection_status: 'connected' | 'disconnected' | 'error' | 'unknown';
  last_ping: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserAvailableTool {
  id: string;
  wallet_address: string;
  mcp_server_id: string;
  tool_name: string;
  tool_description: string | null;
  tool_schema: Record<string, any>;
  is_available: boolean;
  last_checked: Date;
}

export interface UserEncryptionKey {
  wallet_address: string;
  key_hash: string;
  salt: string;
  created_at: Date;
}

export interface UserRule {
  id: string;
  wallet_address: string;
  title: string;
  content: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserMemory {
  id: string;
  wallet_address: string;
  title: string;
  content: string;
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
    const query =
      'SELECT * FROM users WHERE wallet_address = $1 AND deleted_at IS NULL;';
    const result = await pool.query(query, [walletAddress]);
    return result.rows[0] || null;
  }

  static async softDeleteUser(walletAddress: string): Promise<boolean> {
    const query =
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE wallet_address = $1 AND deleted_at IS NULL;';
    const result = await pool.query(query, [walletAddress]);
    return (result.rowCount || 0) > 0;
  }

  static async restoreUser(walletAddress: string): Promise<boolean> {
    const query =
      'UPDATE users SET deleted_at = NULL WHERE wallet_address = $1;';
    const result = await pool.query(query, [walletAddress]);
    return (result.rowCount || 0) > 0;
  }

  static async getUserByPrivyId(privyUserId: string): Promise<User | null> {
    const query =
      'SELECT * FROM users WHERE privy_user_id = $1 AND deleted_at IS NULL;';
    const result = await pool.query(query, [privyUserId]);
    return result.rows[0] || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const query =
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL;';
    const result = await pool.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  static async getUserByWalletAddress(
    identifier: string
  ): Promise<User | null> {
    return this.getUser(identifier);
  }

  static async createUser(userData: {
    wallet_address?: string | null;
    email?: string | null;
    privy_user_id?: string;
    created_at?: Date;
    updated_at?: Date;
  }): Promise<User> {
    const query = `
      INSERT INTO users (wallet_address, email, privy_user_id, created_at, updated_at, last_active)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      userData.wallet_address || null,
      userData.email ? userData.email.toLowerCase() : null,
      userData.privy_user_id || null,
      userData.created_at || new Date(),
      userData.updated_at || new Date(),
    ]);
    return result.rows[0];
  }

  static async updateUser(
    identifier: string,
    userData: {
      wallet_address?: string | null;
      email?: string | null;
      privy_user_id?: string;
      updated_at?: Date;
    }
  ): Promise<User> {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (userData.wallet_address !== undefined) {
      updateFields.push(`wallet_address = $${paramCount++}`);
      values.push(userData.wallet_address);
    }
    if (userData.email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(userData.email ? userData.email.toLowerCase() : null);
    }
    if (userData.privy_user_id !== undefined) {
      updateFields.push(`privy_user_id = $${paramCount++}`);
      values.push(userData.privy_user_id);
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(userData.updated_at || new Date());

    updateFields.push(`last_active = $${paramCount++}`);
    values.push(new Date());

    values.push(identifier);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE wallet_address = $${paramCount}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
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

  static async updatePreferences(
    walletAddress: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(walletAddress);

    // First try to update, if no rows affected, insert
    const allowedFields = [
      'auto_schedule_jobs',
      'default_schedule_type',
      'default_schedule_time',
      'timezone',
      'ai_personality',
      'user_bio',
      'similarity_enabled',
      'similarity_threshold',
      'max_similar_prompts',
      'similarity_context_enabled',
    ];
    const updateFields = Object.keys(preferences)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.keys(preferences)
      .filter((key) => allowedFields.includes(key))
      .map((key) => preferences[key as keyof UserPreferences]);

    const updateQuery = `
      UPDATE user_preferences 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1
      RETURNING *;
    `;

    const updateResult = await pool.query(updateQuery, [
      walletAddress,
      ...values,
    ]);

    if (updateResult.rows.length > 0) {
      return updateResult.rows[0];
    }

    // If no rows were updated, insert new preferences
    const insertQuery = `
      INSERT INTO user_preferences (
        wallet_address, auto_schedule_jobs, default_schedule_type, 
        default_schedule_time, timezone, ai_personality, user_bio,
        similarity_enabled, similarity_threshold, max_similar_prompts, similarity_context_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const insertValues = [
      walletAddress,
      preferences.auto_schedule_jobs || false,
      preferences.default_schedule_type || 'daily',
      preferences.default_schedule_time || '09:00:00',
      preferences.timezone || 'UTC',
      preferences.ai_personality || '',
      preferences.user_bio || '',
      preferences.similarity_enabled ?? true,
      preferences.similarity_threshold ?? 0.7,
      preferences.max_similar_prompts ?? 3,
      preferences.similarity_context_enabled ?? true,
    ];

    const insertResult = await pool.query(insertQuery, insertValues);
    return insertResult.rows[0];
  }

  static async createPreferences(
    walletAddress: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(walletAddress);

    const query = `
      INSERT INTO user_preferences (
        wallet_address, auto_schedule_jobs, default_schedule_type, 
        default_schedule_time, timezone, ai_personality, user_bio,
        similarity_enabled, similarity_threshold, max_similar_prompts, similarity_context_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const values = [
      walletAddress,
      preferences.auto_schedule_jobs || false,
      preferences.default_schedule_type || 'daily',
      preferences.default_schedule_time || '09:00:00',
      preferences.timezone || 'UTC',
      preferences.ai_personality || '',
      preferences.user_bio || '',
      preferences.similarity_enabled ?? true,
      preferences.similarity_threshold ?? 0.7,
      preferences.max_similar_prompts ?? 3,
      preferences.similarity_context_enabled ?? true,
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
  static async createJob(
    job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'completed_at'>
  ): Promise<Job> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(job.wallet_address);

    const query = `
      INSERT INTO jobs (
        wallet_address, name, description, initial_message,
        status, has_uploaded_file, is_scheduled, schedule_type,
        schedule_time, next_run_time, interval_days, is_active,
        last_run_at, run_count, max_runs, timezone,
        parent_job_id
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17
      )
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
      job.timezone || 'UTC',
      // Persist parent linkage if provided (threaded jobs)
      (job as any).parent_job_id || null,
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

  static async getJobsByWalletSince(
    walletAddress: string,
    since: Date
  ): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE wallet_address = $1 AND created_at >= $2 
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [walletAddress, since]);
    return result.rows;
  }

  static async getMessageCountByWalletSince(
    walletAddress: string,
    since: Date
  ): Promise<number> {
    const query = `
      SELECT COUNT(m.id) as count 
      FROM messages m 
      JOIN jobs j ON m.job_id = j.id 
      WHERE j.wallet_address = $1 AND m.created_at >= $2;
    `;

    const result = await pool.query(query, [walletAddress, since]);
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  static async getJob(jobId: string): Promise<Job | null> {
    const query = 'SELECT * FROM jobs WHERE id = $1;';
    const result = await pool.query(query, [jobId]);
    return result.rows[0] || null;
  }

  static async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
    const allowedFields = [
      'name',
      'description',
      'status',
      'completed_at',
      'has_uploaded_file',
      'is_scheduled',
      'schedule_type',
      'schedule_time',
      'next_run_time',
      'interval_days',
      'is_active',
      'last_run_at',
      'run_count',
      'max_runs',
      'timezone',
    ];
    const updateFields = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updates[key as keyof Job]);

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
      ORDER BY created_at DESC;
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

  static async getTotalCompletedJobsCount(): Promise<number> {
    const query = `SELECT COUNT(*) as total FROM jobs WHERE status = 'completed';`;
    const result = await pool.query(query);
    return parseInt(result.rows[0].total, 10);
  }

  static async getTotalJobsCount(): Promise<number> {
    const query = `SELECT COUNT(*) as total FROM jobs;`;
    const result = await pool.query(query);
    return parseInt(result.rows[0].total, 10);
  }

  static async getRecurringJobsCount(): Promise<number> {
    const query = `SELECT COUNT(*) as total FROM jobs WHERE is_scheduled = true AND schedule_type IS NOT NULL;`;
    const result = await pool.query(query);
    return parseInt(result.rows[0].total, 10);
  }

  static async getActiveScheduledJobsCount(): Promise<number> {
    const query = `SELECT COUNT(*) as total FROM jobs WHERE is_scheduled = true AND is_active = true;`;
    const result = await pool.query(query);
    return parseInt(result.rows[0].total, 10);
  }

  static async getCompletedJobsToday(): Promise<number> {
    const query = `
      SELECT COUNT(*) as total FROM jobs 
      WHERE status = 'completed' 
      AND DATE(completed_at) = CURRENT_DATE;
    `;
    const result = await pool.query(query);
    return parseInt(result.rows[0].total, 10);
  }

  static async calculateTimeSaved(): Promise<number> {
    // Estimate time saved based on completed jobs
    // Assuming each job saves on average 30 minutes
    const totalCompleted = await this.getTotalCompletedJobsCount();
    return Math.round(totalCompleted * 0.5 * 100) / 100; // 0.5 hours per job, rounded to 2 decimals
  }

  /**
   * Get daily job counts for the last N days
   */
  static async getDailyJobCounts(
    days: number = 30
  ): Promise<Array<{ date: string; count: number }>> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM jobs
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC;
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count, 10),
    }));
  }

  /**
   * Get job status distribution
   */
  static async getJobStatusDistribution(): Promise<
    Array<{ status: string; count: number }>
  > {
    const query = `
      SELECT status, COUNT(*) as count
      FROM jobs
      GROUP BY status
      ORDER BY count DESC;
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      status: row.status,
      count: parseInt(row.count, 10),
    }));
  }

  /**
   * Get total jobs count by date range
   */
  static async getTotalJobsCountByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM jobs
      WHERE created_at >= $1 AND created_at <= $2;
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return parseInt(result.rows[0]?.total || '0', 10);
  }

  /**
   * Get jobs created today
   */
  static async getJobsCreatedToday(): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM jobs
      WHERE DATE(created_at) = CURRENT_DATE;
    `;

    const result = await pool.query(query);
    return parseInt(result.rows[0]?.total || '0', 10);
  }

  /**
   * Get unique users count
   */
  static async getUniqueUsersCount(): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT wallet_address) as total
      FROM jobs;
    `;

    const result = await pool.query(query);
    return parseInt(result.rows[0]?.total || '0', 10);
  }
}

export class MessageDB {
  static async createMessage(
    message: Omit<Message, 'id' | 'created_at'>
  ): Promise<Message> {
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
      message.order_index,
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    // Safely parse content and metadata
    let content, metadata;

    try {
      content =
        typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    } catch (e) {
      // If parsing fails, treat as plain string
      content = row.content;
    }

    try {
      metadata =
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata;
    } catch (e) {
      // If parsing fails, use empty object
      metadata = {};
    }

    return {
      ...row,
      content,
      metadata,
    };
  }

  static async getMessagesByJob(jobId: string): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE job_id = $1 
      ORDER BY order_index ASC;
    `;

    const result = await pool.query(query, [jobId]);
    return result.rows.map((row) => {
      let content, metadata;

      try {
        content =
          typeof row.content === 'string'
            ? JSON.parse(row.content)
            : row.content;
      } catch (e) {
        // If parsing fails, treat as plain string
        content = row.content;
      }

      try {
        metadata =
          typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata;
      } catch (e) {
        // If parsing fails, use empty object
        metadata = {};
      }

      return {
        ...row,
        content,
        metadata,
      };
    });
  }

  static async updateMessage(
    messageId: string,
    updates: Partial<Message>
  ): Promise<Message> {
    const allowedFields = [
      'content',
      'response_type',
      'agent_name',
      'error_message',
      'metadata',
      'requires_action',
      'action_type',
      'is_streaming',
    ];
    const updateFields = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => {
        if (key === 'content' || key === 'metadata') {
          return `${key} = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
      })
      .join(', ');

    const values = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key) => {
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
      content =
        typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    } catch (e) {
      // If parsing fails, treat as plain string
      content = row.content;
    }

    try {
      metadata =
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata;
    } catch (e) {
      // If parsing fails, use empty object
      metadata = {};
    }

    return {
      ...row,
      content,
      metadata,
    };
  }

  static async getTotalMessageCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as total FROM messages;';
    const result = await pool.query(query);
    return parseInt(result.rows[0].total, 10);
  }

  static async getMessageCountForUserToday(
    walletAddress: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<number> {
    const query = `
      SELECT COUNT(m.*) as total 
      FROM messages m
      INNER JOIN jobs j ON m.job_id = j.id
      WHERE j.wallet_address = $1 
      AND m.role = 'user'
      AND m.created_at >= $2 
      AND m.created_at < $3;
    `;

    const result = await pool.query(query, [
      walletAddress,
      startOfDay,
      endOfDay,
    ]);
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Get all messages for a user across all their jobs for similarity checking
   */
  static async getAllMessagesForUser(
    walletAddress: string,
    limit: number = 1000
  ): Promise<Message[]> {
    const query = `
      SELECT m.* 
      FROM messages m
      INNER JOIN jobs j ON m.job_id = j.id
      WHERE j.wallet_address = $1 
      ORDER BY m.created_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [walletAddress, limit]);
    return result.rows.map((row) => {
      let content, metadata;

      try {
        content =
          typeof row.content === 'string'
            ? JSON.parse(row.content)
            : row.content;
      } catch (e) {
        // If parsing fails, treat as plain string
        content = row.content;
      }

      try {
        metadata =
          typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata;
      } catch (e) {
        // If parsing fails, use empty object
        metadata = {};
      }

      return {
        ...row,
        content,
        metadata,
      };
    });
  }

  /**
   * Get recent messages for a user (last N days) for similarity checking
   */
  static async getRecentMessagesForUser(
    walletAddress: string,
    daysBack: number = 30,
    limit: number = 500
  ): Promise<Message[]> {
    const query = `
      SELECT m.* 
      FROM messages m
      INNER JOIN jobs j ON m.job_id = j.id
      WHERE j.wallet_address = $1 
      AND m.created_at >= NOW() - INTERVAL '${daysBack} days'
      ORDER BY m.created_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [walletAddress, limit]);
    return result.rows.map((row) => {
      let content, metadata;

      try {
        content =
          typeof row.content === 'string'
            ? JSON.parse(row.content)
            : row.content;
      } catch (e) {
        // If parsing fails, treat as plain string
        content = row.content;
      }

      try {
        metadata =
          typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata;
      } catch (e) {
        // If parsing fails, use empty object
        metadata = {};
      }

      return {
        ...row,
        content,
        metadata,
      };
    });
  }

  /**
   * Get messages for similarity checking with specific filters
   */
  static async getMessagesForSimilarity(
    walletAddress: string,
    options: {
      excludeJobId?: string;
      minPromptLength?: number;
      daysBack?: number;
      limit?: number;
    } = {}
  ): Promise<Message[]> {
    const {
      excludeJobId,
      minPromptLength = 10,
      daysBack = 30,
      limit = 500,
    } = options;

    let query = `
      SELECT m.* 
      FROM messages m
      INNER JOIN jobs j ON m.job_id = j.id
      WHERE j.wallet_address = $1 
      AND m.created_at >= NOW() - INTERVAL '${daysBack} days'
      AND m.role = 'user'
    `;

    const params: any[] = [walletAddress];
    let paramIndex = 2;

    if (excludeJobId) {
      query += ` AND m.job_id != $${paramIndex}`;
      params.push(excludeJobId);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex};`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.map((row) => {
      let content, metadata;

      try {
        content =
          typeof row.content === 'string'
            ? JSON.parse(row.content)
            : row.content;
      } catch (e) {
        // If parsing fails, treat as plain string
        content = row.content;
      }

      try {
        metadata =
          typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata;
      } catch (e) {
        // If parsing fails, use empty object
        metadata = {};
      }

      return {
        ...row,
        content,
        metadata,
      };
    });
  }

  /**
   * Get MCP server usage statistics from message metadata
   */
  static async getMCPServerUsageStats(): Promise<
    Array<{ server_name: string; usage_count: number }>
  > {
    const query = `
      SELECT 
        metadata->>'mcp_server' as server_name,
        COUNT(*) as usage_count
      FROM messages
      WHERE metadata IS NOT NULL 
        AND metadata::text != '{}'
        AND metadata->>'mcp_server' IS NOT NULL
      GROUP BY metadata->>'mcp_server'
      ORDER BY usage_count DESC;
    `;

    const result = await pool.query(query);
    return result.rows
      .filter((row) => row.server_name)
      .map((row) => ({
        server_name: row.server_name,
        usage_count: parseInt(row.usage_count, 10),
      }));
  }

  /**
   * Get MCP tool usage statistics from message metadata
   */
  static async getMCPToolUsageStats(): Promise<
    Array<{ tool_name: string; usage_count: number }>
  > {
    const query = `
      SELECT 
        metadata->>'mcp_tool' as tool_name,
        COUNT(*) as usage_count
      FROM messages
      WHERE metadata IS NOT NULL 
        AND metadata::text != '{}'
        AND metadata->>'mcp_tool' IS NOT NULL
      GROUP BY metadata->>'mcp_tool'
      ORDER BY usage_count DESC;
    `;

    const result = await pool.query(query);
    return result.rows
      .filter((row) => row.tool_name)
      .map((row) => ({
        tool_name: row.tool_name,
        usage_count: parseInt(row.usage_count, 10),
      }));
  }

  /**
   * Get agent usage statistics from messages
   */
  static async getAgentUsageStats(): Promise<
    Array<{ agent_name: string; usage_count: number }>
  > {
    const query = `
      SELECT 
        agent_name,
        COUNT(*) as usage_count
      FROM messages
      WHERE agent_name IS NOT NULL
      GROUP BY agent_name
      ORDER BY usage_count DESC;
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      agent_name: row.agent_name,
      usage_count: parseInt(row.usage_count, 10),
    }));
  }

  /**
   * Get messages with MCP usage in date range
   */
  static async getMCPUsageByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM messages
      WHERE created_at >= $1 AND created_at <= $2
        AND metadata IS NOT NULL 
        AND metadata::text != '{}'
        AND (metadata->>'mcp_server' IS NOT NULL OR metadata->>'mcp_tool' IS NOT NULL);
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return parseInt(result.rows[0]?.total || '0', 10);
  }
}

export class AgentTeamDB {
  static async createTeam(
    team: Omit<AgentTeam, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AgentTeam> {
    // Ensure user exists first
    await UserDB.createOrUpdateUser(team.wallet_address);

    const query = `
      INSERT INTO teams (wallet_address, name, description, agents)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [
      team.wallet_address,
      team.name,
      team.description || null,
      team.agents,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getTeamsByWallet(walletAddress: string): Promise<AgentTeam[]> {
    const query = `
      SELECT * FROM teams 
      WHERE wallet_address = $1 
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async getTeam(teamId: string): Promise<AgentTeam | null> {
    const query = 'SELECT * FROM teams WHERE id = $1;';
    const result = await pool.query(query, [teamId]);
    return result.rows[0] || null;
  }

  static async updateTeam(
    teamId: string,
    updates: Partial<
      Omit<AgentTeam, 'id' | 'wallet_address' | 'created_at' | 'updated_at'>
    >
  ): Promise<AgentTeam> {
    const allowedFields = ['name', 'description', 'agents'];
    const updateFields = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updates[key as keyof typeof updates]);

    const query = `
      UPDATE teams 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [teamId, ...values]);
    return result.rows[0];
  }

  static async deleteTeam(teamId: string): Promise<void> {
    const query = 'DELETE FROM teams WHERE id = $1;';
    await pool.query(query, [teamId]);
  }
}

// Database service classes for credential management
export class UserCredentialDB {
  static async storeCredential(
    credential: Omit<UserCredential, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserCredential> {
    const query = `
      INSERT INTO user_credentials (
        wallet_address, service_type, service_name, credential_name, 
        encrypted_value, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (wallet_address, service_name, credential_name)
      DO UPDATE SET 
        encrypted_value = EXCLUDED.encrypted_value,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      credential.wallet_address,
      credential.service_type,
      credential.service_name,
      credential.credential_name,
      credential.encrypted_value,
      credential.is_active,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getCredential(
    walletAddress: string,
    serviceName: string,
    credentialName: string
  ): Promise<UserCredential | null> {
    const query = `
      SELECT * FROM user_credentials 
      WHERE wallet_address = $1 AND service_name = $2 AND credential_name = $3 AND is_active = TRUE;
    `;

    const result = await pool.query(query, [
      walletAddress,
      serviceName,
      credentialName,
    ]);
    return result.rows[0] || null;
  }

  static async getServiceCredentials(
    walletAddress: string,
    serviceName: string
  ): Promise<UserCredential[]> {
    const query = `
      SELECT * FROM user_credentials 
      WHERE wallet_address = $1 AND service_name = $2 AND is_active = TRUE
      ORDER BY credential_name;
    `;

    const result = await pool.query(query, [walletAddress, serviceName]);
    return result.rows;
  }

  static async getAllUserCredentials(
    walletAddress: string
  ): Promise<UserCredential[]> {
    const query = `
      SELECT * FROM user_credentials 
      WHERE wallet_address = $1 AND is_active = TRUE
      ORDER BY service_name, credential_name;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async updateLastUsed(
    walletAddress: string,
    serviceName: string,
    credentialName: string
  ): Promise<void> {
    const query = `
      UPDATE user_credentials 
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1 AND service_name = $2 AND credential_name = $3;
    `;

    await pool.query(query, [walletAddress, serviceName, credentialName]);
  }

  static async deleteCredential(
    walletAddress: string,
    serviceName: string,
    credentialName: string
  ): Promise<void> {
    const query = `
      DELETE FROM user_credentials 
      WHERE wallet_address = $1 AND service_name = $2 AND credential_name = $3;
    `;

    await pool.query(query, [walletAddress, serviceName, credentialName]);
  }

  static async deleteAllServiceCredentials(
    walletAddress: string,
    serviceName: string
  ): Promise<void> {
    const query = `
      DELETE FROM user_credentials 
      WHERE wallet_address = $1 AND service_name = $2;
    `;

    await pool.query(query, [walletAddress, serviceName]);
  }
}

export class UserEncryptionKeyDB {
  static async storeEncryptionKey(
    walletAddress: string,
    keyHash: string,
    salt: string
  ): Promise<UserEncryptionKey> {
    const query = `
      INSERT INTO user_encryption_keys (wallet_address, key_hash, salt)
      VALUES ($1, $2, $3)
      ON CONFLICT (wallet_address)
      DO UPDATE SET 
        key_hash = EXCLUDED.key_hash,
        salt = EXCLUDED.salt
      RETURNING *;
    `;

    const result = await pool.query(query, [walletAddress, keyHash, salt]);
    return result.rows[0];
  }

  static async getEncryptionKey(
    walletAddress: string
  ): Promise<UserEncryptionKey | null> {
    const query =
      'SELECT * FROM user_encryption_keys WHERE wallet_address = $1;';
    const result = await pool.query(query, [walletAddress]);
    return result.rows[0] || null;
  }

  static async deleteEncryptionKey(walletAddress: string): Promise<void> {
    const query = 'DELETE FROM user_encryption_keys WHERE wallet_address = $1;';
    await pool.query(query, [walletAddress]);
  }
}

export class UserMCPServerDB {
  static async addMCPServer(
    server: Omit<UserMCPServer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserMCPServer> {
    const query = `
      INSERT INTO user_mcp_servers (
        wallet_address, server_name, server_url, connection_config, 
        is_enabled, health_status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (wallet_address, server_name)
      DO UPDATE SET 
        server_url = EXCLUDED.server_url,
        connection_config = EXCLUDED.connection_config,
        is_enabled = EXCLUDED.is_enabled,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      server.wallet_address,
      server.server_name,
      server.server_url,
      JSON.stringify(server.connection_config),
      server.is_enabled,
      server.health_status,
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      connection_config:
        typeof row.connection_config === 'string'
          ? JSON.parse(row.connection_config)
          : row.connection_config,
    };
  }

  static async getUserMCPServers(
    walletAddress: string
  ): Promise<UserMCPServer[]> {
    const query = `
      SELECT * FROM user_mcp_servers 
      WHERE wallet_address = $1 
      ORDER BY server_name;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows.map((row) => ({
      ...row,
      connection_config:
        typeof row.connection_config === 'string'
          ? JSON.parse(row.connection_config)
          : row.connection_config,
    }));
  }

  static async getMCPServer(
    walletAddress: string,
    serverName: string
  ): Promise<UserMCPServer | null> {
    const query = `
      SELECT * FROM user_mcp_servers 
      WHERE wallet_address = $1 AND server_name = $2;
    `;

    const result = await pool.query(query, [walletAddress, serverName]);
    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return {
      ...row,
      connection_config:
        typeof row.connection_config === 'string'
          ? JSON.parse(row.connection_config)
          : row.connection_config,
    };
  }

  static async updateMCPServerHealth(
    walletAddress: string,
    serverName: string,
    healthStatus: UserMCPServer['health_status']
  ): Promise<void> {
    const query = `
      UPDATE user_mcp_servers 
      SET health_status = $3, last_health_check = CURRENT_TIMESTAMP
      WHERE wallet_address = $1 AND server_name = $2;
    `;

    await pool.query(query, [walletAddress, serverName, healthStatus]);
  }

  static async enableMCPServer(
    walletAddress: string,
    serverName: string,
    enabled: boolean
  ): Promise<void> {
    const query = `
      UPDATE user_mcp_servers 
      SET is_enabled = $3, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1 AND server_name = $2;
    `;

    await pool.query(query, [walletAddress, serverName, enabled]);
  }

  static async deleteMCPServer(
    walletAddress: string,
    serverName: string
  ): Promise<void> {
    const query = `
      DELETE FROM user_mcp_servers 
      WHERE wallet_address = $1 AND server_name = $2;
    `;

    await pool.query(query, [walletAddress, serverName]);
  }
}

export class UserA2AAgentDB {
  static async addA2AAgent(
    agent: Omit<UserA2AAgent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserA2AAgent> {
    const query = `
      INSERT INTO user_a2a_agents (
        wallet_address, agent_id, agent_name, agent_description, 
        endpoint_url, capabilities, is_enabled, connection_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (wallet_address, agent_id)
      DO UPDATE SET 
        agent_name = EXCLUDED.agent_name,
        agent_description = EXCLUDED.agent_description,
        endpoint_url = EXCLUDED.endpoint_url,
        capabilities = EXCLUDED.capabilities,
        is_enabled = EXCLUDED.is_enabled,
        connection_status = EXCLUDED.connection_status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      agent.wallet_address,
      agent.agent_id,
      agent.agent_name,
      agent.agent_description,
      agent.endpoint_url,
      JSON.stringify(agent.capabilities),
      agent.is_enabled,
      agent.connection_status,
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      capabilities:
        typeof row.capabilities === 'string'
          ? JSON.parse(row.capabilities)
          : row.capabilities,
    };
  }

  static async getUserA2AAgents(
    walletAddress: string
  ): Promise<UserA2AAgent[]> {
    const query = `
      SELECT * FROM user_a2a_agents 
      WHERE wallet_address = $1 
      ORDER BY agent_name;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows.map((row) => ({
      ...row,
      capabilities:
        typeof row.capabilities === 'string'
          ? JSON.parse(row.capabilities)
          : row.capabilities,
    }));
  }

  static async getA2AAgent(
    walletAddress: string,
    agentId: string
  ): Promise<UserA2AAgent | null> {
    const query = `
      SELECT * FROM user_a2a_agents 
      WHERE wallet_address = $1 AND agent_id = $2;
    `;

    const result = await pool.query(query, [walletAddress, agentId]);
    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return {
      ...row,
      capabilities:
        typeof row.capabilities === 'string'
          ? JSON.parse(row.capabilities)
          : row.capabilities,
    };
  }

  static async updateA2AAgentStatus(
    walletAddress: string,
    agentId: string,
    connectionStatus: UserA2AAgent['connection_status']
  ): Promise<void> {
    const query = `
      UPDATE user_a2a_agents 
      SET connection_status = $3, last_ping = CURRENT_TIMESTAMP
      WHERE wallet_address = $1 AND agent_id = $2;
    `;

    await pool.query(query, [walletAddress, agentId, connectionStatus]);
  }

  static async enableA2AAgent(
    walletAddress: string,
    agentId: string,
    enabled: boolean
  ): Promise<void> {
    const query = `
      UPDATE user_a2a_agents 
      SET is_enabled = $3, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1 AND agent_id = $2;
    `;

    await pool.query(query, [walletAddress, agentId, enabled]);
  }

  static async deleteA2AAgent(
    walletAddress: string,
    agentId: string
  ): Promise<void> {
    const query = `
      DELETE FROM user_a2a_agents 
      WHERE wallet_address = $1 AND agent_id = $2;
    `;

    await pool.query(query, [walletAddress, agentId]);
  }
}

export interface SharedJob {
  id: string;
  job_id: string;
  wallet_address: string;
  share_token: string;
  title: string | null;
  description: string | null;
  is_public: boolean;
  view_count: number;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateShareParams {
  job_id: string;
  wallet_address: string;
  title?: string;
  description?: string;
  is_public?: boolean;
  expires_at?: Date;
}

export interface SharedJobWithDetails extends SharedJob {
  job: Job;
  messages: Message[];
}

export class SharedJobDB {
  static async createShare(params: CreateShareParams): Promise<SharedJob> {
    // Generate cryptographically secure token
    const crypto = await import('crypto');
    const share_token = crypto.randomBytes(32).toString('hex');

    const query = `
      INSERT INTO shared_jobs (
        job_id, wallet_address, share_token, title, description, 
        is_public, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (job_id, wallet_address)
      DO UPDATE SET 
        share_token = EXCLUDED.share_token,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_public = EXCLUDED.is_public,
        expires_at = EXCLUDED.expires_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      params.job_id,
      params.wallet_address,
      share_token,
      params.title || null,
      params.description || null,
      params.is_public ?? true,
      params.expires_at || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getByToken(token: string): Promise<SharedJobWithDetails | null> {
    // Check if share exists and is not expired
    const shareQuery = `
      SELECT sj.*, j.name as job_name, j.description as job_description,
             j.initial_message, j.status, j.created_at as job_created_at,
             j.completed_at
      FROM shared_jobs sj
      JOIN jobs j ON sj.job_id = j.id
      WHERE sj.share_token = $1 
        AND sj.is_public = true
        AND (sj.expires_at IS NULL OR sj.expires_at > CURRENT_TIMESTAMP);
    `;

    const shareResult = await pool.query(shareQuery, [token]);
    if (!shareResult.rows[0]) return null;

    const sharedJob = shareResult.rows[0];

    // Get job messages
    const messages = await MessageDB.getMessagesByJob(sharedJob.job_id);

    // Increment view count
    await this.incrementViewCount(token);

    return {
      id: sharedJob.id,
      job_id: sharedJob.job_id,
      wallet_address: sharedJob.wallet_address,
      share_token: sharedJob.share_token,
      title: sharedJob.title,
      description: sharedJob.description,
      is_public: sharedJob.is_public,
      view_count: sharedJob.view_count,
      expires_at: sharedJob.expires_at,
      created_at: sharedJob.created_at,
      updated_at: sharedJob.updated_at,
      job: {
        id: sharedJob.job_id,
        wallet_address: sharedJob.wallet_address,
        name: sharedJob.job_name,
        description: sharedJob.job_description,
        initial_message: sharedJob.initial_message,
        status: sharedJob.status,
        created_at: sharedJob.job_created_at,
        updated_at: sharedJob.updated_at,
        completed_at: sharedJob.completed_at,
        has_uploaded_file: false,
      } as Job,
      messages,
    };
  }

  static async getUserShares(walletAddress: string): Promise<SharedJob[]> {
    const query = `
      SELECT sj.*, j.name as job_name
      FROM shared_jobs sj
      JOIN jobs j ON sj.job_id = j.id
      WHERE sj.wallet_address = $1
      ORDER BY sj.created_at DESC;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async updateShare(
    job_id: string,
    wallet_address: string,
    updates: Partial<
      Pick<SharedJob, 'title' | 'description' | 'is_public' | 'expires_at'>
    >
  ): Promise<SharedJob> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.is_public !== undefined) {
      fields.push(`is_public = $${paramIndex++}`);
      values.push(updates.is_public);
    }
    if (updates.expires_at !== undefined) {
      fields.push(`expires_at = $${paramIndex++}`);
      values.push(updates.expires_at);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(job_id, wallet_address);

    const query = `
      UPDATE shared_jobs 
      SET ${fields.join(', ')}
      WHERE job_id = $${paramIndex++} AND wallet_address = $${paramIndex++}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteShare(
    job_id: string,
    wallet_address: string
  ): Promise<void> {
    const query = `
      DELETE FROM shared_jobs 
      WHERE job_id = $1 AND wallet_address = $2;
    `;

    await pool.query(query, [job_id, wallet_address]);
  }

  static async incrementViewCount(token: string): Promise<void> {
    const query = `
      UPDATE shared_jobs 
      SET view_count = view_count + 1
      WHERE share_token = $1;
    `;

    await pool.query(query, [token]);
  }

  static async getShareByJobId(
    job_id: string,
    wallet_address: string
  ): Promise<SharedJob | null> {
    const query = `
      SELECT * FROM shared_jobs 
      WHERE job_id = $1 AND wallet_address = $2;
    `;

    const result = await pool.query(query, [job_id, wallet_address]);
    return result.rows[0] || null;
  }
}

export class UserAvailableToolDB {
  static async storeTool(
    tool: Omit<UserAvailableTool, 'id'>
  ): Promise<UserAvailableTool> {
    const query = `
      INSERT INTO user_available_tools (
        wallet_address, mcp_server_id, tool_name, tool_description, 
        tool_schema, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (wallet_address, mcp_server_id, tool_name)
      DO UPDATE SET 
        tool_description = EXCLUDED.tool_description,
        tool_schema = EXCLUDED.tool_schema,
        is_available = EXCLUDED.is_available,
        last_checked = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      tool.wallet_address,
      tool.mcp_server_id,
      tool.tool_name,
      tool.tool_description,
      JSON.stringify(tool.tool_schema),
      tool.is_available,
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      tool_schema:
        typeof row.tool_schema === 'string'
          ? JSON.parse(row.tool_schema)
          : row.tool_schema,
    };
  }

  static async getUserTools(
    walletAddress: string
  ): Promise<UserAvailableTool[]> {
    const query = `
      SELECT *, server_name as mcp_server_id
      FROM user_available_tools
      WHERE wallet_address = $1 AND (is_available = TRUE OR enabled = TRUE)
      ORDER BY server_name, tool_name;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows.map((row) => ({
      ...row,
      mcp_server_id: row.server_name, // Map server_name to mcp_server_id for interface compatibility
      tool_schema:
        typeof row.tool_schema === 'string'
          ? JSON.parse(row.tool_schema)
          : row.tool_schema || {},
    }));
  }

  static async getServerTools(
    walletAddress: string,
    mcpServerId: string
  ): Promise<UserAvailableTool[]> {
    const query = `
      SELECT * FROM user_available_tools 
      WHERE wallet_address = $1 AND mcp_server_id = $2 AND is_available = TRUE
      ORDER BY tool_name;
    `;

    const result = await pool.query(query, [walletAddress, mcpServerId]);
    return result.rows.map((row) => ({
      ...row,
      tool_schema:
        typeof row.tool_schema === 'string'
          ? JSON.parse(row.tool_schema)
          : row.tool_schema,
    }));
  }

  static async deleteServerTools(
    walletAddress: string,
    mcpServerId: string
  ): Promise<void> {
    const query = `
      DELETE FROM user_available_tools 
      WHERE wallet_address = $1 AND mcp_server_id = $2;
    `;

    await pool.query(query, [walletAddress, mcpServerId]);
  }

  /**
   * Get MCP server adoption statistics (how many users have each server)
   */
  static async getMCPServerAdoptionStats(): Promise<
    Array<{ server_name: string; user_count: number; tool_count: number }>
  > {
    const query = `
      SELECT 
        uat.mcp_server_id as server_name,
        COUNT(DISTINCT uat.wallet_address) as user_count,
        COUNT(uat.id) as tool_count
      FROM user_available_tools uat
      WHERE uat.is_available = TRUE
      GROUP BY uat.mcp_server_id
      ORDER BY user_count DESC, tool_count DESC;
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      server_name: row.server_name,
      user_count: parseInt(row.user_count, 10),
      tool_count: parseInt(row.tool_count, 10),
    }));
  }

  /**
   * Get total MCP servers count
   */
  static async getTotalMCPServersCount(): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT mcp_server_id) as total
      FROM user_available_tools
      WHERE is_available = TRUE;
    `;

    const result = await pool.query(query);
    return parseInt(result.rows[0]?.total || '0', 10);
  }

  /**
   * Get total MCP tools count
   */
  static async getTotalMCPToolsCount(): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM user_available_tools
      WHERE is_available = TRUE;
    `;

    const result = await pool.query(query);
    return parseInt(result.rows[0]?.total || '0', 10);
  }
}

export class UserRulesDB {
  static async createRule(
    walletAddress: string,
    title: string,
    content: string
  ): Promise<UserRule> {
    const query = `
      INSERT INTO user_rules (wallet_address, title, content, is_enabled, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      walletAddress,
      title,
      content,
      true,
    ]);
    return result.rows[0];
  }

  static async getUserRules(walletAddress: string): Promise<UserRule[]> {
    const query = `
      SELECT * FROM user_rules 
      WHERE wallet_address = $1 
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async updateRule(
    id: string,
    walletAddress: string,
    updates: Partial<Pick<UserRule, 'title' | 'content' | 'is_enabled'>>
  ): Promise<UserRule> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');
    const query = `
      UPDATE user_rules 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND wallet_address = $2
      RETURNING *;
    `;

    const values = [id, walletAddress, ...Object.values(updates)];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteRule(id: string, walletAddress: string): Promise<void> {
    const query = `
      DELETE FROM user_rules 
      WHERE id = $1 AND wallet_address = $2;
    `;

    await pool.query(query, [id, walletAddress]);
  }

  static async toggleRule(
    id: string,
    walletAddress: string
  ): Promise<UserRule> {
    const query = `
      UPDATE user_rules 
      SET is_enabled = NOT is_enabled, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND wallet_address = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [id, walletAddress]);
    return result.rows[0];
  }
}

export class UserMemoriesDB {
  static async createMemory(
    walletAddress: string,
    title: string,
    content: string
  ): Promise<UserMemory> {
    const query = `
      INSERT INTO user_memories (wallet_address, title, content, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const result = await pool.query(query, [walletAddress, title, content]);
    return result.rows[0];
  }

  static async getUserMemories(walletAddress: string): Promise<UserMemory[]> {
    const query = `
      SELECT * FROM user_memories 
      WHERE wallet_address = $1 
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async updateMemory(
    id: string,
    walletAddress: string,
    updates: Partial<Pick<UserMemory, 'title' | 'content'>>
  ): Promise<UserMemory> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');
    const query = `
      UPDATE user_memories 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND wallet_address = $2
      RETURNING *;
    `;

    const values = [id, walletAddress, ...Object.values(updates)];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteMemory(id: string, walletAddress: string): Promise<void> {
    const query = `
      DELETE FROM user_memories 
      WHERE id = $1 AND wallet_address = $2;
    `;

    await pool.query(query, [id, walletAddress]);
  }

  static async deleteAllMemories(walletAddress: string): Promise<void> {
    const query = `
      DELETE FROM user_memories 
      WHERE wallet_address = $1;
    `;

    await pool.query(query, [walletAddress]);
  }
}

// Referral System Types
export interface ReferralCode {
  id: number;
  code: string;
  referrer_wallet_address: string;
  created_at: Date;
  expires_at: Date | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  code_type: string;
  description: string | null;
}

export interface UserReferral {
  id: number;
  referred_wallet_address: string;
  referrer_wallet_address: string;
  referral_code: string;
  referred_at: Date;
  referrer_jobs_granted: number;
  referred_jobs_granted: number;
  status: string;
}

export interface ReferralStats {
  wallet_address: string;
  total_referrals: number;
  active_referrals: number;
  total_jobs_earned_from_referrals: number;
  referred_by_wallet: string | null;
  jobs_earned_from_being_referred: number;
  first_referral_at: Date | null;
  last_referral_at: Date | null;
}

export interface ReferralDashboard {
  wallet_address: string;
  total_referrals: number;
  active_referrals: number;
  jobs_earned_as_referrer: number;
  jobs_earned_as_referred: number;
  current_bonus_jobs: number;
  referred_by_wallet: string | null;
  first_referral_at: Date | null;
  last_referral_at: Date | null;
  active_referral_codes: number;
}

export class ReferralDB {
  static async getReferralDashboard(
    walletAddress: string
  ): Promise<ReferralDashboard> {
    const query = `
      SELECT * FROM referral_dashboard 
      WHERE wallet_address = $1;
    `;

    const result = await pool.query(query, [walletAddress]);
    if (result.rows.length === 0) {
      // Return default dashboard for new users
      return {
        wallet_address: walletAddress,
        total_referrals: 0,
        active_referrals: 0,
        jobs_earned_as_referrer: 0,
        jobs_earned_as_referred: 0,
        current_bonus_jobs: 0,
        referred_by_wallet: null,
        first_referral_at: null,
        last_referral_at: null,
        active_referral_codes: 0,
      };
    }

    return result.rows[0];
  }

  static async generateReferralCode(
    walletAddress: string,
    options: {
      description?: string;
      maxUses?: number;
      expiresAt?: Date;
    } = {}
  ): Promise<ReferralCode> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate unique code
      const codeResult = await client.query(
        'SELECT generate_referral_code() as code'
      );
      const code = codeResult.rows[0].code;

      // Insert referral code
      const insertQuery = `
        INSERT INTO referral_codes (
          code, referrer_wallet_address, description, max_uses, expires_at
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;

      const result = await client.query(insertQuery, [
        code,
        walletAddress,
        options.description || null,
        options.maxUses || null,
        options.expiresAt || null,
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async useReferralCode(
    walletAddress: string,
    referralCode: string
  ): Promise<{
    referrer: string;
    referrerJobsGranted: number;
    referredJobsGranted: number;
  }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if code exists and is valid
      const codeQuery = `
        SELECT * FROM referral_codes 
        WHERE code = $1 AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses);
      `;

      const codeResult = await client.query(codeQuery, [referralCode]);
      if (codeResult.rows.length === 0) {
        throw new Error('Referral code not found, expired, or inactive');
      }

      const code = codeResult.rows[0];

      // Check if user is trying to use their own code
      if (code.referrer_wallet_address === walletAddress) {
        throw new Error('Cannot use your own referral code');
      }

      // Check if user has already been referred
      const existingReferralQuery = `
        SELECT id FROM user_referrals WHERE referred_wallet_address = $1;
      `;

      const existingResult = await client.query(existingReferralQuery, [
        walletAddress,
      ]);
      if (existingResult.rows.length > 0) {
        throw new Error('User has already been referred');
      }

      // Define reward amounts
      const REFERRER_BONUS = 10; // Jobs granted to referrer
      const REFERRED_BONUS = 5; // Jobs granted to referred user

      // Create referral record
      const referralQuery = `
        INSERT INTO user_referrals (
          referred_wallet_address, referrer_wallet_address, referral_code,
          referrer_jobs_granted, referred_jobs_granted
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;

      const referralResult = await client.query(referralQuery, [
        walletAddress,
        code.referrer_wallet_address,
        referralCode,
        REFERRER_BONUS,
        REFERRED_BONUS,
      ]);

      const referralId = referralResult.rows[0].id;

      // Update referral code usage count
      await client.query(
        `
        UPDATE referral_codes 
        SET current_uses = current_uses + 1 
        WHERE id = $1;
      `,
        [code.id]
      );

      // Grant bonus jobs to referrer
      await client.query(
        `
        UPDATE users 
        SET bonus_jobs_from_referrals = COALESCE(bonus_jobs_from_referrals, 0) + $2
        WHERE wallet_address = $1;
      `,
        [code.referrer_wallet_address, REFERRER_BONUS]
      );

      // Grant bonus jobs to referred user
      await client.query(
        `
        UPDATE users 
        SET bonus_jobs_from_referrals = COALESCE(bonus_jobs_from_referrals, 0) + $2
        WHERE wallet_address = $1;
      `,
        [walletAddress, REFERRED_BONUS]
      );

      // Create reward records
      await client.query(
        `
        INSERT INTO referral_rewards (
          recipient_wallet_address, referral_id, reward_type, jobs_granted, reason
        ) VALUES 
        ($1, $2, 'referrer_bonus', $3, 'new_referral'),
        ($4, $2, 'referred_bonus', $5, 'new_referral');
      `,
        [
          code.referrer_wallet_address,
          referralId,
          REFERRER_BONUS,
          walletAddress,
          REFERRED_BONUS,
        ]
      );

      await client.query('COMMIT');

      return {
        referrer: code.referrer_wallet_address,
        referrerJobsGranted: REFERRER_BONUS,
        referredJobsGranted: REFERRED_BONUS,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUserReferralCodes(
    walletAddress: string
  ): Promise<ReferralCode[]> {
    const query = `
      SELECT * FROM referral_codes 
      WHERE referrer_wallet_address = $1 
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async updateReferralCode(
    walletAddress: string,
    codeId: number,
    updates: {
      isActive?: boolean;
      description?: string;
      maxUses?: number;
    }
  ): Promise<ReferralCode> {
    const setClause = [];
    const values: any[] = [codeId, walletAddress];
    let paramCount = 2;

    if (updates.isActive !== undefined) {
      setClause.push(`is_active = $${++paramCount}`);
      values.push(updates.isActive);
    }

    if (updates.description !== undefined) {
      setClause.push(`description = $${++paramCount}`);
      values.push(updates.description);
    }

    if (updates.maxUses !== undefined) {
      setClause.push(`max_uses = $${++paramCount}`);
      values.push(updates.maxUses);
    }

    if (setClause.length === 0) {
      throw new Error('No updates provided');
    }

    const query = `
      UPDATE referral_codes 
      SET ${setClause.join(', ')}
      WHERE id = $1 AND referrer_wallet_address = $2
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Referral code not found or not owned by user');
    }

    return result.rows[0];
  }

  static async deleteReferralCode(
    walletAddress: string,
    codeId: number
  ): Promise<void> {
    const query = `
      DELETE FROM referral_codes 
      WHERE id = $1 AND referrer_wallet_address = $2;
    `;

    const result = await pool.query(query, [codeId, walletAddress]);
    if (result.rowCount === 0) {
      throw new Error('Referral code not found or not owned by user');
    }
  }

  static async getReferralStats(
    walletAddress: string
  ): Promise<ReferralStats | null> {
    const query = `
      SELECT * FROM user_referral_stats 
      WHERE wallet_address = $1;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows[0] || null;
  }

  static async getReferralHistory(
    walletAddress: string
  ): Promise<UserReferral[]> {
    const query = `
      SELECT * FROM user_referrals 
      WHERE referrer_wallet_address = $1 
      ORDER BY referred_at DESC;
    `;

    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async getRecentReferrals(
    walletAddress: string,
    limit: number = 10
  ): Promise<UserReferral[]> {
    const query = `
      SELECT * FROM user_referrals 
      WHERE referrer_wallet_address = $1 
      ORDER BY referred_at DESC 
      LIMIT $2;
    `;

    const result = await pool.query(query, [walletAddress, limit]);
    return result.rows;
  }
}

export interface FailureMetric {
  id: number;
  job_id: string;
  message_id?: string;
  user_id?: string;
  wallet_address?: string;
  agent_name?: string;
  user_prompt: string;
  assistant_response: string;
  is_failure: boolean;
  failure_type?: string;
  failure_reason?: string;
  failure_summary?: string;
  detected_tags?: string[];
  request_theme?: string;
  created_at: Date;
  updated_at: Date;
}

export class FailureMetricsDB {
  static async createFailureMetric(
    metric: Omit<FailureMetric, 'id' | 'created_at' | 'updated_at'>
  ): Promise<FailureMetric> {
    const query = `
      INSERT INTO failure_metrics (
        job_id, message_id, user_id, wallet_address, agent_name,
        user_prompt, assistant_response, is_failure, failure_type,
        failure_reason, failure_summary, detected_tags, request_theme
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      metric.job_id,
      metric.message_id ?? null,
      metric.user_id ?? null,
      metric.wallet_address ?? null,
      metric.agent_name ?? null,
      metric.user_prompt,
      metric.assistant_response,
      metric.is_failure,
      metric.failure_type ?? null,
      metric.failure_reason ?? null,
      metric.failure_summary ?? null,
      metric.detected_tags ?? null,
      metric.request_theme ?? null,
    ]);

    return result.rows[0];
  }

  static async getFailureMetrics(filters?: {
    walletAddress?: string;
    isFailure?: boolean;
    failureType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<FailureMetric[]> {
    let query = 'SELECT * FROM failure_metrics WHERE 1=1';
    const values: any[] = [];
    let paramCount = 0;

    if (filters?.walletAddress) {
      paramCount++;
      query += ` AND wallet_address = $${paramCount}`;
      values.push(filters.walletAddress);
    }

    if (filters?.isFailure !== undefined) {
      paramCount++;
      query += ` AND is_failure = $${paramCount}`;
      values.push(filters.isFailure);
    }

    if (filters?.failureType) {
      paramCount++;
      query += ` AND failure_type = $${paramCount}`;
      values.push(filters.failureType);
    }

    if (filters?.startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      values.push(filters.startDate);
    }

    if (filters?.endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      values.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getFailureStats(): Promise<{
    totalFailures: number;
    failuresByType: Array<{ type: string; count: number }>;
    failuresByTheme: Array<{ theme: string; count: number }>;
    topFailureReasons: Array<{ reason: string; count: number }>;
  }> {
    const totalQuery = `
      SELECT COUNT(*) as count 
      FROM failure_metrics 
      WHERE is_failure = true;
    `;
    const totalResult = await pool.query(totalQuery);

    const typeQuery = `
      SELECT failure_type as type, COUNT(*) as count
      FROM failure_metrics
      WHERE is_failure = true AND failure_type IS NOT NULL
      GROUP BY failure_type
      ORDER BY count DESC;
    `;
    const typeResult = await pool.query(typeQuery);

    const themeQuery = `
      SELECT request_theme as theme, COUNT(*) as count
      FROM failure_metrics
      WHERE is_failure = true AND request_theme IS NOT NULL
      GROUP BY request_theme
      ORDER BY count DESC
      LIMIT 20;
    `;
    const themeResult = await pool.query(themeQuery);

    const reasonQuery = `
      SELECT failure_reason as reason, COUNT(*) as count
      FROM failure_metrics
      WHERE is_failure = true AND failure_reason IS NOT NULL
      GROUP BY failure_reason
      ORDER BY count DESC
      LIMIT 10;
    `;
    const reasonResult = await pool.query(reasonQuery);

    return {
      totalFailures: parseInt(totalResult.rows[0]?.count || '0'),
      failuresByType: typeResult.rows.map((r) => ({
        type: r.type,
        count: parseInt(r.count),
      })),
      failuresByTheme: themeResult.rows.map((r) => ({
        theme: r.theme,
        count: parseInt(r.count),
      })),
      topFailureReasons: reasonResult.rows.map((r) => ({
        reason: r.reason,
        count: parseInt(r.count),
      })),
    };
  }
}

// Export pool for direct database access
export { pool };

// Export Database class with common methods
export class Database {
  static query = pool.query.bind(pool);
  static JobDB = JobDB;
  static MessageDB = MessageDB;
  static UserDB = UserDB;
  static SharedJobDB = SharedJobDB;
  static ReferralDB = ReferralDB;
  static FailureMetricsDB = FailureMetricsDB;
}

export default {
  UserDB,
  UserPreferencesDB,
  JobDB,
  MessageDB,
  AgentTeamDB,
  UserCredentialDB,
  UserEncryptionKeyDB,
  UserMCPServerDB,
  UserA2AAgentDB,
  UserAvailableToolDB,
  UserRulesDB,
  UserMemoriesDB,
  SharedJobDB,
  ReferralDB,
  FailureMetricsDB,
};
