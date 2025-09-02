-- Create MCP (Model Context Protocol) related tables

-- Table for user's available MCP tools
CREATE TABLE IF NOT EXISTS user_available_tools (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    mcp_server_id VARCHAR(255) NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    tool_description TEXT,
    tool_schema JSONB,
    is_available BOOLEAN DEFAULT true,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address, mcp_server_id, tool_name)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_available_tools_wallet ON user_available_tools(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_available_tools_enabled ON user_available_tools(wallet_address, is_available);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_available_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_available_tools_updated_at
    BEFORE UPDATE ON user_available_tools
    FOR EACH ROW
    EXECUTE FUNCTION update_user_available_tools_updated_at();