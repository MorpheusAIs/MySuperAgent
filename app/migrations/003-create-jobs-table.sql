-- Create jobs table with optional scheduling fields
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
  schedule_type VARCHAR(20) DEFAULT NULL CHECK (schedule_type IS NULL OR schedule_type IN ('once', 'daily', 'weekly', 'custom')),
  schedule_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  next_run_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  interval_days INTEGER DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  run_count INTEGER DEFAULT 0,
  max_runs INTEGER DEFAULT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC'
);

CREATE INDEX IF NOT EXISTS idx_jobs_wallet_address ON jobs (wallet_address);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON jobs (is_scheduled, is_active, next_run_time) WHERE is_scheduled = TRUE;

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();