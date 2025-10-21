-- Add metadata field to jobs table for storing multi-item data and other job-specific metadata
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create an index on metadata for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_metadata ON jobs USING gin (metadata);

-- Comment explaining the metadata field
COMMENT ON COLUMN jobs.metadata IS 'Stores job-specific metadata including multi-item storage for scheduled jobs';

