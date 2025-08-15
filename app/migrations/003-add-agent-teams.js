exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE IF NOT EXISTS agent_teams (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      wallet_address VARCHAR(42) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      agents TEXT[] NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
    );

    CREATE INDEX idx_agent_teams_wallet ON agent_teams(wallet_address);
    
    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_agent_teams_updated_at BEFORE UPDATE
      ON agent_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = function(db) {
  return db.runSql(`
    DROP TRIGGER IF EXISTS update_agent_teams_updated_at ON agent_teams;
    DROP FUNCTION IF EXISTS update_updated_at_column();
    DROP TABLE IF EXISTS agent_teams;
  `);
};

exports._meta = {
  version: 1
};