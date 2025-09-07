-- Add Privy authentication fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS privy_user_id VARCHAR(255);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_privy_user_id ON users(privy_user_id) WHERE privy_user_id IS NOT NULL;

-- Add unique constraint on privy_user_id (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_privy_user_id'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_privy_user_id UNIQUE (privy_user_id);
    END IF;
END $$;