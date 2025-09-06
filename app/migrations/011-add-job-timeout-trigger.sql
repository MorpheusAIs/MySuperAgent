-- Add timeout mechanism for jobs
-- This migration adds a database function and trigger to automatically 
-- mark jobs as failed if they've been running for too long

-- First, add a column to track when a job was last processed
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing running jobs to set last_processed_at = updated_at
UPDATE jobs SET last_processed_at = updated_at WHERE status = 'running' AND last_processed_at IS NULL;

-- Create index for efficient timeout queries
CREATE INDEX IF NOT EXISTS idx_jobs_timeout_check ON jobs(status, last_processed_at) 
WHERE status IN ('running', 'pending');

-- Create function to check and handle job timeouts
CREATE OR REPLACE FUNCTION handle_job_timeouts()
RETURNS void AS $$
DECLARE
    timeout_threshold_running INTERVAL := '10 minutes';
    timeout_threshold_pending INTERVAL := '30 minutes';
    job_record RECORD;
    timeout_count INTEGER := 0;
BEGIN
    -- Handle running jobs that have exceeded timeout
    FOR job_record IN 
        SELECT id, wallet_address, name, created_at, updated_at, last_processed_at
        FROM jobs 
        WHERE status = 'running' 
          AND (
            last_processed_at < NOW() - timeout_threshold_running 
            OR (last_processed_at IS NULL AND updated_at < NOW() - timeout_threshold_running)
          )
        LIMIT 50 -- Process in batches to avoid long-running transactions
    LOOP
        -- Update job status to failed
        UPDATE jobs 
        SET 
            status = 'failed',
            updated_at = NOW(),
            completed_at = NOW()
        WHERE id = job_record.id;
        
        -- Add explanatory message if none exists from assistant
        INSERT INTO messages (job_id, role, content, response_type, error_message, metadata, order_index, created_at)
        SELECT 
            job_record.id,
            'assistant',
            'This job was automatically cancelled due to a system timeout. Please try your request again.',
            'error',
            'Automatic timeout after 10 minutes of processing',
            '{"autoTimeout": true, "timeoutReason": "processing_timeout", "timeoutThresholdMinutes": 10}'::jsonb,
            COALESCE((SELECT MAX(order_index) + 1 FROM messages WHERE job_id = job_record.id), 0),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM messages 
            WHERE job_id = job_record.id AND role = 'assistant'
        );
        
        timeout_count := timeout_count + 1;
    END LOOP;

    -- Handle pending jobs that have exceeded timeout
    FOR job_record IN 
        SELECT id, wallet_address, name, created_at, updated_at
        FROM jobs 
        WHERE status = 'pending' 
          AND created_at < NOW() - timeout_threshold_pending
        LIMIT 50 -- Process in batches
    LOOP
        -- Update job status to failed
        UPDATE jobs 
        SET 
            status = 'failed',
            updated_at = NOW(),
            completed_at = NOW()
        WHERE id = job_record.id;
        
        -- Add explanatory message
        INSERT INTO messages (job_id, role, content, response_type, error_message, metadata, order_index, created_at)
        VALUES (
            job_record.id,
            'assistant',
            'This job was automatically cancelled because it was not processed within the expected timeframe. Please try your request again.',
            'error',
            'Automatic timeout - job pending for more than 30 minutes',
            '{"autoTimeout": true, "timeoutReason": "pending_timeout", "timeoutThresholdMinutes": 30}'::jsonb,
            0,
            NOW()
        );
        
        timeout_count := timeout_count + 1;
    END LOOP;

    -- Log the timeout operation if any jobs were processed
    IF timeout_count > 0 THEN
        RAISE NOTICE 'Automatically timed out % stuck jobs', timeout_count;
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the entire operation
    RAISE WARNING 'Error in handle_job_timeouts: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function that updates last_processed_at when a job status changes
CREATE OR REPLACE FUNCTION update_job_last_processed()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_processed_at when status changes to 'running' or when messages are added
    IF NEW.status = 'running' AND (OLD.status IS NULL OR OLD.status != 'running') THEN
        NEW.last_processed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_processed_at
DROP TRIGGER IF EXISTS trigger_update_job_last_processed ON jobs;
CREATE TRIGGER trigger_update_job_last_processed
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_job_last_processed();

-- Create trigger function for messages table to update job's last_processed_at
CREATE OR REPLACE FUNCTION update_job_last_processed_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new message is added (especially assistant messages), update the job's last_processed_at
    UPDATE jobs 
    SET last_processed_at = NOW() 
    WHERE id = NEW.job_id 
      AND status IN ('running', 'pending');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update job's last_processed_at when messages are added
DROP TRIGGER IF EXISTS trigger_update_job_last_processed_on_message ON messages;
CREATE TRIGGER trigger_update_job_last_processed_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_job_last_processed_on_message();

-- Note: To periodically run the timeout check, you would call:
-- SELECT handle_job_timeouts();
-- This should be called by your application's cleanup service or a cron job