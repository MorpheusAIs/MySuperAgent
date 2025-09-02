-- Add soft delete column to users table
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index on deleted_at for better query performance
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Add index on active users (where deleted_at IS NULL)
CREATE INDEX idx_users_active ON users(wallet_address) WHERE deleted_at IS NULL;
