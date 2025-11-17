-- Create failure_metrics table to track failed requests and what the platform couldn't accomplish
CREATE TABLE IF NOT EXISTS failure_metrics (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255),
  user_id VARCHAR(255),
  wallet_address VARCHAR(255),
  agent_name VARCHAR(255),
  
  -- Request details
  user_prompt TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  
  -- Failure analysis
  is_failure BOOLEAN DEFAULT false,
  failure_type VARCHAR(100), -- e.g., 'agent_not_found', 'capability_limitation', 'error', 'could_not_answer'
  failure_reason TEXT, -- Extracted reason from response
  failure_summary TEXT, -- Generated summary of what couldn't be done
  
  -- Tagging and themes
  detected_tags TEXT[], -- Array of tags/themes detected in the request
  request_theme VARCHAR(255), -- Main theme/category of the request
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_failure_metrics_job_id ON failure_metrics(job_id);
CREATE INDEX IF NOT EXISTS idx_failure_metrics_user_id ON failure_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_failure_metrics_wallet_address ON failure_metrics(wallet_address);
CREATE INDEX IF NOT EXISTS idx_failure_metrics_is_failure ON failure_metrics(is_failure);
CREATE INDEX IF NOT EXISTS idx_failure_metrics_failure_type ON failure_metrics(failure_type);
CREATE INDEX IF NOT EXISTS idx_failure_metrics_created_at ON failure_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_failure_metrics_request_theme ON failure_metrics(request_theme);

-- Create GIN index for array searches on tags
CREATE INDEX IF NOT EXISTS idx_failure_metrics_tags ON failure_metrics USING GIN(detected_tags);

