-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content JSONB NOT NULL,
  response_type VARCHAR(50),
  agent_name VARCHAR(100),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  requires_action BOOLEAN DEFAULT FALSE,
  action_type VARCHAR(50),
  is_streaming BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages (job_id);
CREATE INDEX IF NOT EXISTS idx_messages_order ON messages (job_id, order_index);