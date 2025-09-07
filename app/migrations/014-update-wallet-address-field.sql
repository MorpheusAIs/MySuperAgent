-- Update wallet_address field to support non-wallet users
-- Change wallet_address from VARCHAR(42) to VARCHAR(100) to support user_ID format
ALTER TABLE users ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Update jobs table as well
ALTER TABLE jobs ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Update user_preferences table
ALTER TABLE user_preferences ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Messages table doesn't have wallet_address column, skip it

-- Update other related tables
ALTER TABLE user_available_tools ALTER COLUMN wallet_address TYPE VARCHAR(100);
ALTER TABLE user_a2a_agents ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Update any other tables that reference wallet_address
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE column_name = 'wallet_address' AND table_schema = 'public'
        AND table_name NOT IN ('users', 'jobs', 'user_preferences', 'messages', 'user_available_tools', 'user_a2a_agents')
    LOOP
        EXECUTE 'ALTER TABLE ' || table_record.table_name || ' ALTER COLUMN wallet_address TYPE VARCHAR(100)';
    END LOOP;
END $$;