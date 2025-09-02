-- Create shared_jobs table for shareable job links
-- This allows users to create public links to their completed jobs

CREATE TABLE IF NOT EXISTS shared_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255),
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT unique_job_share UNIQUE(job_id, wallet_address)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_shared_jobs_token ON shared_jobs(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_jobs_wallet ON shared_jobs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_shared_jobs_public ON shared_jobs(is_public);
CREATE INDEX IF NOT EXISTS idx_shared_jobs_expires ON shared_jobs(expires_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shared_jobs_updated_at
    BEFORE UPDATE ON shared_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_jobs_updated_at();