-- Backfill parent_job_id for existing jobs to enable proper threading
-- This migration is IDEMPOTENT - it can be run multiple times safely
-- It only updates jobs where parent_job_id IS NULL

-- Step 1: For each wallet_address + name combination, find the oldest scheduled job
-- and set it as the parent for all non-scheduled jobs with the same name
-- Using DISTINCT ON with created_at ordering since UUID doesn't support MIN()

DO $$
BEGIN
  -- Step 1: Link non-scheduled jobs to their scheduled parent (if exists)
  WITH parent_jobs AS (
    SELECT DISTINCT ON (wallet_address, name)
      wallet_address,
      name,
      id as parent_id
    FROM jobs
    WHERE is_scheduled = TRUE
    ORDER BY wallet_address, name, created_at ASC
  )
  UPDATE jobs j
  SET parent_job_id = p.parent_id
  FROM parent_jobs p
  WHERE j.wallet_address = p.wallet_address
    AND j.name = p.name
    AND j.is_scheduled = FALSE
    AND j.parent_job_id IS NULL  -- Idempotent: only update if not already set
    AND j.id != p.parent_id;

  -- Step 2: For jobs without a scheduled parent, group by exact name match
  -- and use the oldest job in each group as the parent
  WITH name_groups AS (
    SELECT
      wallet_address,
      name,
      MIN(created_at) as oldest_created_at
    FROM jobs
    WHERE parent_job_id IS NULL
      AND is_scheduled = FALSE
    GROUP BY wallet_address, name
    HAVING COUNT(*) > 1  -- Only group if there are multiple jobs with same name
  ),
  oldest_jobs AS (
    SELECT DISTINCT ON (j.wallet_address, j.name)
      j.id as parent_id,
      j.wallet_address,
      j.name
    FROM jobs j
    INNER JOIN name_groups ng
      ON j.wallet_address = ng.wallet_address
      AND j.name = ng.name
      AND j.created_at = ng.oldest_created_at
    WHERE j.parent_job_id IS NULL
    ORDER BY j.wallet_address, j.name, j.created_at ASC
  )
  UPDATE jobs j
  SET parent_job_id = o.parent_id
  FROM oldest_jobs o
  WHERE j.wallet_address = o.wallet_address
    AND j.name = o.name
    AND j.parent_job_id IS NULL  -- Idempotent: only update if not already set
    AND j.id != o.parent_id;

END $$;

-- Add a comment explaining the threading logic
COMMENT ON COLUMN jobs.parent_job_id IS 'Links job instances to their parent job for threading. Scheduled jobs spawn instances with this field set. For regular jobs with the same exact name, groups them under the oldest job.';
