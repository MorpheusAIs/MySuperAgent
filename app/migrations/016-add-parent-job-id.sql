-- Add parent_job_id field to link job instances to their scheduled job template
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS parent_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;

-- Create index for efficient querying of job threads
CREATE INDEX IF NOT EXISTS idx_jobs_parent_job_id ON jobs (parent_job_id) WHERE parent_job_id IS NOT NULL;

-- Create index for efficient querying of job threads by name (for grouping similar jobs)
CREATE INDEX IF NOT EXISTS idx_jobs_name_wallet ON jobs (wallet_address, name) WHERE is_scheduled = FALSE;
