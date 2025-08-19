import { Client } from 'pg';

interface Migration {
  id: string;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    id: '003',
    name: 'add-teams-table',
    sql: `
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

      CREATE INDEX IF NOT EXISTS idx_teams_wallet ON teams(wallet_address);
      
      -- Create trigger for teams updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
      CREATE TRIGGER update_teams_updated_at BEFORE UPDATE
        ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `
  },
  {
    id: '004',
    name: 'add-credential-management-tables',
    sql: `
      -- Store encrypted user API credentials
      CREATE TABLE IF NOT EXISTS user_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        service_type VARCHAR(50) NOT NULL,  -- 'mcp_server', 'a2a_agent', 'api_service'
        service_name VARCHAR(100) NOT NULL, -- 'github', 'slack', 'notion', 'brave_search', etc.
        credential_name VARCHAR(100) NOT NULL, -- 'api_key', 'bot_token', 'access_token', etc.
        encrypted_value TEXT NOT NULL,      -- Encrypted credential value
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP DEFAULT NULL,
        UNIQUE(wallet_address, service_name, credential_name)
      );

      -- Store user's enabled MCP servers and their configurations
      CREATE TABLE IF NOT EXISTS user_mcp_servers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        server_name VARCHAR(100) NOT NULL,  -- 'github', 'slack', 'notion', etc.
        server_url TEXT NOT NULL,           -- MCP server endpoint
        connection_config JSONB DEFAULT '{}', -- Additional connection parameters
        is_enabled BOOLEAN DEFAULT TRUE,
        health_status VARCHAR(20) DEFAULT 'unknown', -- 'healthy', 'error', 'timeout', 'unknown'
        last_health_check TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wallet_address, server_name)
      );

      -- Store user's connected A2A agents (external agents they can communicate with)
      CREATE TABLE IF NOT EXISTS user_a2a_agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        agent_id VARCHAR(100) NOT NULL,     -- External agent identifier
        agent_name VARCHAR(200) NOT NULL,   -- Human-readable agent name
        agent_description TEXT,             -- Agent capabilities description
        endpoint_url TEXT NOT NULL,         -- A2A communication endpoint
        capabilities JSONB DEFAULT '[]',    -- Array of agent capabilities
        is_enabled BOOLEAN DEFAULT TRUE,
        connection_status VARCHAR(20) DEFAULT 'unknown', -- 'connected', 'disconnected', 'error'
        last_ping TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wallet_address, agent_id)
      );

      -- Store available MCP tools for each user based on their enabled servers
      CREATE TABLE IF NOT EXISTS user_available_tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        mcp_server_id UUID REFERENCES user_mcp_servers(id) ON DELETE CASCADE,
        tool_name VARCHAR(100) NOT NULL,
        tool_description TEXT,
        tool_schema JSONB DEFAULT '{}',     -- Tool input/output schema
        is_available BOOLEAN DEFAULT TRUE,
        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wallet_address, mcp_server_id, tool_name)
      );

      -- Store encryption keys for each user (for credential encryption)
      CREATE TABLE IF NOT EXISTS user_encryption_keys (
        wallet_address VARCHAR(42) PRIMARY KEY REFERENCES users(wallet_address) ON DELETE CASCADE,
        key_hash VARCHAR(128) NOT NULL,     -- Hash of the user's derived encryption key
        salt VARCHAR(64) NOT NULL,          -- Salt for key derivation
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for efficient querying
      CREATE INDEX IF NOT EXISTS idx_user_credentials_wallet ON user_credentials(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_user_credentials_service ON user_credentials(wallet_address, service_name);
      CREATE INDEX IF NOT EXISTS idx_user_mcp_servers_wallet ON user_mcp_servers(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_user_mcp_servers_enabled ON user_mcp_servers(wallet_address, is_enabled);
      CREATE INDEX IF NOT EXISTS idx_user_a2a_agents_wallet ON user_a2a_agents(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_user_a2a_agents_enabled ON user_a2a_agents(wallet_address, is_enabled);
      CREATE INDEX IF NOT EXISTS idx_user_available_tools_wallet ON user_available_tools(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_user_available_tools_server ON user_available_tools(mcp_server_id);

      -- Create update triggers for new tables
      DROP TRIGGER IF EXISTS update_user_credentials_updated_at ON user_credentials;
      CREATE TRIGGER update_user_credentials_updated_at BEFORE UPDATE
        ON user_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_mcp_servers_updated_at ON user_mcp_servers;
      CREATE TRIGGER update_user_mcp_servers_updated_at BEFORE UPDATE
        ON user_mcp_servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_a2a_agents_updated_at ON user_a2a_agents;
      CREATE TRIGGER update_user_a2a_agents_updated_at BEFORE UPDATE
        ON user_a2a_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `
  }
];

export async function runMigrations(connectionString: string) {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get already executed migrations
    const { rows } = await client.query('SELECT id FROM migrations');
    const executedMigrations = new Set(rows.map(row => row.id));
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.has(migration.id)) {
        console.log(`Running migration: ${migration.name}`);
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );
        console.log(`✅ Migration ${migration.name} completed`);
      }
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await client.end();
  }
}