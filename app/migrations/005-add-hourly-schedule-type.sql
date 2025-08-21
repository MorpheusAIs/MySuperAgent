-- Update the jobs table constraint to include 'hourly' schedule type
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS jobs_schedule_type_check;

ALTER TABLE jobs 
ADD CONSTRAINT jobs_schedule_type_check 
CHECK (schedule_type IS NULL OR schedule_type IN ('once', 'hourly', 'daily', 'weekly', 'custom'));