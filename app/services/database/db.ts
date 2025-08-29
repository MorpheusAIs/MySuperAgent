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
        default_schedule_time, timezone
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const insertValues = [
      walletAddress,
      preferences.auto_schedule_jobs || false,
      preferences.default_schedule_type || 'daily',
      preferences.default_schedule_time || '09:00:00',
      preferences.timezone || 'UTC',
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
        default_schedule_time, timezone
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [
      walletAddress,
      preferences.auto_schedule_jobs || false,
      preferences.default_schedule_type || 'daily',
      preferences.default_schedule_time || '09:00:00',
      preferences.timezone || 'UTC',
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
      job.timezone || 'UTC',
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

  static async getTotalCompletedJobsCount(): Promise<number> {
    const query = `SELECT COUNT(*) as total FROM jobs WHERE status = 'completed';`;
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
    return Math.round((totalCompleted * 0.5) * 100) / 100; // 0.5 hours per job, rounded to 2 decimals
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
  static async storeCredential(credential: Omit<UserCredential, 'id' | 'created_at' | 'updated_at'>): Promise<UserCredential> {
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
      credential.is_active
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getCredential(walletAddress: string, serviceName: string, credentialName: string): Promise<UserCredential | null> {
    const query = `
      SELECT * FROM user_credentials 
      WHERE wallet_address = $1 AND service_name = $2 AND credential_name = $3 AND is_active = TRUE;
    `;
    
    const result = await pool.query(query, [walletAddress, serviceName, credentialName]);
    return result.rows[0] || null;
  }

  static async getServiceCredentials(walletAddress: string, serviceName: string): Promise<UserCredential[]> {
    const query = `
      SELECT * FROM user_credentials 
      WHERE wallet_address = $1 AND service_name = $2 AND is_active = TRUE
      ORDER BY credential_name;
    `;
    
    const result = await pool.query(query, [walletAddress, serviceName]);
    return result.rows;
  }

  static async getAllUserCredentials(walletAddress: string): Promise<UserCredential[]> {
    const query = `
      SELECT * FROM user_credentials 
      WHERE wallet_address = $1 AND is_active = TRUE
      ORDER BY service_name, credential_name;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows;
  }

  static async updateLastUsed(walletAddress: string, serviceName: string, credentialName: string): Promise<void> {
    const query = `
      UPDATE user_credentials 
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1 AND service_name = $2 AND credential_name = $3;
    `;
    
    await pool.query(query, [walletAddress, serviceName, credentialName]);
  }

  static async deleteCredential(walletAddress: string, serviceName: string, credentialName: string): Promise<void> {
    const query = `
      DELETE FROM user_credentials 
      WHERE wallet_address = $1 AND service_name = $2 AND credential_name = $3;
    `;
    
    await pool.query(query, [walletAddress, serviceName, credentialName]);
  }

  static async deleteAllServiceCredentials(walletAddress: string, serviceName: string): Promise<void> {
    const query = `
      DELETE FROM user_credentials 
      WHERE wallet_address = $1 AND service_name = $2;
    `;
    
    await pool.query(query, [walletAddress, serviceName]);
  }
}

export class UserEncryptionKeyDB {
  static async storeEncryptionKey(walletAddress: string, keyHash: string, salt: string): Promise<UserEncryptionKey> {
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

  static async getEncryptionKey(walletAddress: string): Promise<UserEncryptionKey | null> {
    const query = 'SELECT * FROM user_encryption_keys WHERE wallet_address = $1;';
    const result = await pool.query(query, [walletAddress]);
    return result.rows[0] || null;
  }

  static async deleteEncryptionKey(walletAddress: string): Promise<void> {
    const query = 'DELETE FROM user_encryption_keys WHERE wallet_address = $1;';
    await pool.query(query, [walletAddress]);
  }
}

export class UserMCPServerDB {
  static async addMCPServer(server: Omit<UserMCPServer, 'id' | 'created_at' | 'updated_at'>): Promise<UserMCPServer> {
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
      server.health_status
    ];
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      connection_config: typeof row.connection_config === 'string' 
        ? JSON.parse(row.connection_config) 
        : row.connection_config
    };
  }

  static async getUserMCPServers(walletAddress: string): Promise<UserMCPServer[]> {
    const query = `
      SELECT * FROM user_mcp_servers 
      WHERE wallet_address = $1 
      ORDER BY server_name;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows.map(row => ({
      ...row,
      connection_config: typeof row.connection_config === 'string' 
        ? JSON.parse(row.connection_config) 
        : row.connection_config
    }));
  }

  static async getMCPServer(walletAddress: string, serverName: string): Promise<UserMCPServer | null> {
    const query = `
      SELECT * FROM user_mcp_servers 
      WHERE wallet_address = $1 AND server_name = $2;
    `;
    
    const result = await pool.query(query, [walletAddress, serverName]);
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      connection_config: typeof row.connection_config === 'string' 
        ? JSON.parse(row.connection_config) 
        : row.connection_config
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

  static async enableMCPServer(walletAddress: string, serverName: string, enabled: boolean): Promise<void> {
    const query = `
      UPDATE user_mcp_servers 
      SET is_enabled = $3, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1 AND server_name = $2;
    `;
    
    await pool.query(query, [walletAddress, serverName, enabled]);
  }

  static async deleteMCPServer(walletAddress: string, serverName: string): Promise<void> {
    const query = `
      DELETE FROM user_mcp_servers 
      WHERE wallet_address = $1 AND server_name = $2;
    `;
    
    await pool.query(query, [walletAddress, serverName]);
  }
}

export class UserA2AAgentDB {
  static async addA2AAgent(agent: Omit<UserA2AAgent, 'id' | 'created_at' | 'updated_at'>): Promise<UserA2AAgent> {
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
      agent.connection_status
    ];
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      capabilities: typeof row.capabilities === 'string' 
        ? JSON.parse(row.capabilities) 
        : row.capabilities
    };
  }

  static async getUserA2AAgents(walletAddress: string): Promise<UserA2AAgent[]> {
    const query = `
      SELECT * FROM user_a2a_agents 
      WHERE wallet_address = $1 
      ORDER BY agent_name;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows.map(row => ({
      ...row,
      capabilities: typeof row.capabilities === 'string' 
        ? JSON.parse(row.capabilities) 
        : row.capabilities
    }));
  }

  static async getA2AAgent(walletAddress: string, agentId: string): Promise<UserA2AAgent | null> {
    const query = `
      SELECT * FROM user_a2a_agents 
      WHERE wallet_address = $1 AND agent_id = $2;
    `;
    
    const result = await pool.query(query, [walletAddress, agentId]);
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      capabilities: typeof row.capabilities === 'string' 
        ? JSON.parse(row.capabilities) 
        : row.capabilities
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

  static async enableA2AAgent(walletAddress: string, agentId: string, enabled: boolean): Promise<void> {
    const query = `
      UPDATE user_a2a_agents 
      SET is_enabled = $3, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1 AND agent_id = $2;
    `;
    
    await pool.query(query, [walletAddress, agentId, enabled]);
  }

  static async deleteA2AAgent(walletAddress: string, agentId: string): Promise<void> {
    const query = `
      DELETE FROM user_a2a_agents 
      WHERE wallet_address = $1 AND agent_id = $2;
    `;
    
    await pool.query(query, [walletAddress, agentId]);
  }
}

export class UserAvailableToolDB {
  static async storeTool(tool: Omit<UserAvailableTool, 'id'>): Promise<UserAvailableTool> {
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
      tool.is_available
    ];
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      tool_schema: typeof row.tool_schema === 'string' 
        ? JSON.parse(row.tool_schema) 
        : row.tool_schema
    };
  }

  static async getUserTools(walletAddress: string): Promise<UserAvailableTool[]> {
    const query = `
      SELECT t.*, s.server_name 
      FROM user_available_tools t
      JOIN user_mcp_servers s ON t.mcp_server_id = s.id
      WHERE t.wallet_address = $1 AND t.is_available = TRUE
      ORDER BY s.server_name, t.tool_name;
    `;
    
    const result = await pool.query(query, [walletAddress]);
    return result.rows.map(row => ({
      ...row,
      tool_schema: typeof row.tool_schema === 'string' 
        ? JSON.parse(row.tool_schema) 
        : row.tool_schema
    }));
  }

  static async getServerTools(walletAddress: string, mcpServerId: string): Promise<UserAvailableTool[]> {
    const query = `
      SELECT * FROM user_available_tools 
      WHERE wallet_address = $1 AND mcp_server_id = $2 AND is_available = TRUE
      ORDER BY tool_name;
    `;
    
    const result = await pool.query(query, [walletAddress, mcpServerId]);
    return result.rows.map(row => ({
      ...row,
      tool_schema: typeof row.tool_schema === 'string' 
        ? JSON.parse(row.tool_schema) 
        : row.tool_schema
    }));
  }

  static async deleteServerTools(walletAddress: string, mcpServerId: string): Promise<void> {
    const query = `
      DELETE FROM user_available_tools 
      WHERE wallet_address = $1 AND mcp_server_id = $2;
    `;
    
    await pool.query(query, [walletAddress, mcpServerId]);
  }
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
  UserAvailableToolDB
};
