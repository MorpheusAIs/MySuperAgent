-- Create A2A (Agent-to-Agent) related tables

-- Table for user's A2A agent connections
CREATE TABLE IF NOT EXISTS user_a2a_agents (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    agent_url VARCHAR(500) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    connection_status VARCHAR(50) DEFAULT 'pending',
    last_ping TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address, agent_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_a2a_agents_wallet ON user_a2a_agents(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_a2a_agents_enabled ON user_a2a_agents(wallet_address, enabled);
CREATE INDEX IF NOT EXISTS idx_user_a2a_agents_status ON user_a2a_agents(connection_status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_a2a_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_a2a_agents_updated_at
    BEFORE UPDATE ON user_a2a_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_a2a_agents_updated_at();