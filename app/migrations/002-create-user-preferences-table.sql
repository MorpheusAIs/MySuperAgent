-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  wallet_address VARCHAR(42) PRIMARY KEY REFERENCES users(wallet_address) ON DELETE CASCADE,
  auto_schedule_jobs BOOLEAN DEFAULT FALSE,
  default_schedule_type VARCHAR(20) DEFAULT 'daily',
  default_schedule_time TIME DEFAULT '09:00:00',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();