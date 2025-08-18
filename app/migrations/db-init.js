const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Drop old tables if they exist
    console.log('🗑️  Dropping old tables if they exist...');
    await client.query('DROP TABLE IF EXISTS recurring_jobs CASCADE;');
    await client.query('DROP TABLE IF EXISTS scheduled_jobs CASCADE;');
    await client.query('DROP TABLE IF EXISTS messages CASCADE;');
    await client.query('DROP TABLE IF EXISTS jobs CASCADE;');
    await client.query('DROP TABLE IF EXISTS teams CASCADE;');
    await client.query('DROP TABLE IF EXISTS user_preferences CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');
    
    // Create users table
    console.log('👤 Creating users table...');
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        wallet_address VARCHAR(42) PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUsersTable);
    console.log('✅ users table created successfully');

    // Create user_preferences table
    console.log('⚙️  Creating user_preferences table...');
    const createUserPreferencesTable = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        wallet_address VARCHAR(42) PRIMARY KEY REFERENCES users(wallet_address) ON DELETE CASCADE,
        auto_schedule_jobs BOOLEAN DEFAULT FALSE,
        default_schedule_type VARCHAR(20) DEFAULT 'daily',
        default_schedule_time TIME DEFAULT '09:00:00',
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUserPreferencesTable);
    console.log('✅ user_preferences table created successfully');

    // Create jobs table with optional scheduling fields
    console.log('💼 Creating jobs table...');
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL DEFAULT 'New Job',
        description TEXT,
        initial_message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        has_uploaded_file BOOLEAN DEFAULT FALSE,
        
        -- Optional scheduling fields
        is_scheduled BOOLEAN DEFAULT FALSE,
        schedule_type VARCHAR(20) DEFAULT NULL CHECK (schedule_type IS NULL OR schedule_type IN ('once', 'hourly', 'daily', 'weekly', 'custom')),
        schedule_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        next_run_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        interval_days INTEGER DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_run_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        run_count INTEGER DEFAULT 0,
        max_runs INTEGER DEFAULT NULL,
        timezone VARCHAR(50) DEFAULT 'UTC'
      );
    `;
    await client.query(createJobsTable);
    console.log('✅ jobs table created successfully');

    // Create messages table
    console.log('💬 Creating messages table...');
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content JSONB NOT NULL,
        response_type VARCHAR(50),
        agent_name VARCHAR(100),
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        requires_action BOOLEAN DEFAULT FALSE,
        action_type VARCHAR(50),
        is_streaming BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        order_index INTEGER NOT NULL DEFAULT 0
      );
    `;
    await client.query(createMessagesTable);
    console.log('✅ messages table created successfully');

    // Create teams table
    console.log('👥 Creating teams table...');
    const createTeamsTable = `
      CREATE TABLE IF NOT EXISTS teams (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        agents TEXT[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
      );
    `;
    await client.query(createTeamsTable);
    console.log('✅ teams table created successfully');

    // Create credential management tables
    console.log('🔐 Creating credential management tables...');
    
    // User credentials table
    const createUserCredentialsTable = `
      CREATE TABLE IF NOT EXISTS user_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        service_type VARCHAR(50) NOT NULL,
        service_name VARCHAR(100) NOT NULL,
        credential_name VARCHAR(100) NOT NULL,
        encrypted_value TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP DEFAULT NULL,
        UNIQUE(wallet_address, service_name, credential_name)
      );
    `;
    await client.query(createUserCredentialsTable);
    console.log('✅ user_credentials table created successfully');

    // User MCP servers table
    const createUserMCPServersTable = `
      CREATE TABLE IF NOT EXISTS user_mcp_servers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        server_name VARCHAR(100) NOT NULL,
        server_url TEXT NOT NULL,
        connection_config JSONB DEFAULT '{}',
        is_enabled BOOLEAN DEFAULT TRUE,
        health_status VARCHAR(20) DEFAULT 'unknown',
        last_health_check TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wallet_address, server_name)
      );
    `;
    await client.query(createUserMCPServersTable);
    console.log('✅ user_mcp_servers table created successfully');

    // User A2A agents table
    const createUserA2AAgentsTable = `
      CREATE TABLE IF NOT EXISTS user_a2a_agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        agent_id VARCHAR(100) NOT NULL,
        agent_name VARCHAR(200) NOT NULL,
        agent_description TEXT,
        endpoint_url TEXT NOT NULL,
        capabilities JSONB DEFAULT '[]',
        is_enabled BOOLEAN DEFAULT TRUE,
        connection_status VARCHAR(20) DEFAULT 'unknown',
        last_ping TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wallet_address, agent_id)
      );
    `;
    await client.query(createUserA2AAgentsTable);
    console.log('✅ user_a2a_agents table created successfully');

    // User available tools table
    const createUserAvailableToolsTable = `
      CREATE TABLE IF NOT EXISTS user_available_tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        mcp_server_id UUID REFERENCES user_mcp_servers(id) ON DELETE CASCADE,
        tool_name VARCHAR(100) NOT NULL,
        tool_description TEXT,
        tool_schema JSONB DEFAULT '{}',
        is_available BOOLEAN DEFAULT TRUE,
        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wallet_address, mcp_server_id, tool_name)
      );
    `;
    await client.query(createUserAvailableToolsTable);
    console.log('✅ user_available_tools table created successfully');

    // User encryption keys table
    const createUserEncryptionKeysTable = `
      CREATE TABLE IF NOT EXISTS user_encryption_keys (
        wallet_address VARCHAR(42) PRIMARY KEY REFERENCES users(wallet_address) ON DELETE CASCADE,
        key_hash VARCHAR(128) NOT NULL,
        salt VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUserEncryptionKeysTable);
    console.log('✅ user_encryption_keys table created successfully');

    // Create indexes for efficient querying
    console.log('🔍 Creating indexes...');
    const createIndexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_jobs_wallet_address ON jobs (wallet_address);',
      'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);',
      'CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON jobs (is_scheduled, is_active, next_run_time) WHERE is_scheduled = TRUE;',
      'CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages (job_id);',
      'CREATE INDEX IF NOT EXISTS idx_messages_order ON messages (job_id, order_index);',
      'CREATE INDEX IF NOT EXISTS idx_teams_wallet ON teams(wallet_address);',
      // Credential management indexes
      'CREATE INDEX IF NOT EXISTS idx_user_credentials_wallet ON user_credentials(wallet_address);',
      'CREATE INDEX IF NOT EXISTS idx_user_credentials_service ON user_credentials(wallet_address, service_name);',
      'CREATE INDEX IF NOT EXISTS idx_user_mcp_servers_wallet ON user_mcp_servers(wallet_address);',
      'CREATE INDEX IF NOT EXISTS idx_user_mcp_servers_enabled ON user_mcp_servers(wallet_address, is_enabled);',
      'CREATE INDEX IF NOT EXISTS idx_user_a2a_agents_wallet ON user_a2a_agents(wallet_address);',
      'CREATE INDEX IF NOT EXISTS idx_user_a2a_agents_enabled ON user_a2a_agents(wallet_address, is_enabled);',
      'CREATE INDEX IF NOT EXISTS idx_user_available_tools_wallet ON user_available_tools(wallet_address);',
      'CREATE INDEX IF NOT EXISTS idx_user_available_tools_server ON user_available_tools(mcp_server_id);'
    ];

    for (const query of createIndexQueries) {
      await client.query(query);
    }
    console.log('✅ Indexes created successfully');

    // Create update trigger for updated_at
    console.log('🔄 Creating update triggers...');
    const createTriggerQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
      CREATE TRIGGER update_user_preferences_updated_at
        BEFORE UPDATE ON user_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
      CREATE TRIGGER update_jobs_updated_at
        BEFORE UPDATE ON jobs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
      CREATE TRIGGER update_teams_updated_at
        BEFORE UPDATE ON teams
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Triggers for credential management tables
      DROP TRIGGER IF EXISTS update_user_credentials_updated_at ON user_credentials;
      CREATE TRIGGER update_user_credentials_updated_at
        BEFORE UPDATE ON user_credentials
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_mcp_servers_updated_at ON user_mcp_servers;
      CREATE TRIGGER update_user_mcp_servers_updated_at
        BEFORE UPDATE ON user_mcp_servers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_a2a_agents_updated_at ON user_a2a_agents;
      CREATE TRIGGER update_user_a2a_agents_updated_at
        BEFORE UPDATE ON user_a2a_agents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await client.query(createTriggerQuery);
    console.log('✅ Update triggers created successfully');

    console.log('🎉 Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();