-- Migration 015: Create Referrals System
-- Creates tables for user referrals, tracking, and rewards

-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    referrer_wallet_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited uses
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Additional metadata
    code_type VARCHAR(20) DEFAULT 'user_generated', -- 'user_generated', 'admin_created', 'promotion'
    description TEXT,
    
    CONSTRAINT fk_referral_codes_wallet FOREIGN KEY (referrer_wallet_address) 
        REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- User referrals tracking table
CREATE TABLE IF NOT EXISTS user_referrals (
    id SERIAL PRIMARY KEY,
    referred_wallet_address VARCHAR(42) NOT NULL,
    referrer_wallet_address VARCHAR(42) NOT NULL,
    referral_code VARCHAR(20) NOT NULL,
    referred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Reward tracking
    referrer_jobs_granted INTEGER DEFAULT 0,
    referred_jobs_granted INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'disabled', 'fraud'
    
    UNIQUE(referred_wallet_address), -- Each user can only be referred once
    CONSTRAINT fk_user_referrals_referred_wallet FOREIGN KEY (referred_wallet_address) 
        REFERENCES users(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_user_referrals_referrer_wallet FOREIGN KEY (referrer_wallet_address) 
        REFERENCES users(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_user_referrals_code FOREIGN KEY (referral_code) 
        REFERENCES referral_codes(code) ON DELETE CASCADE
);

-- User referral stats summary table (for performance)
CREATE TABLE IF NOT EXISTS user_referral_stats (
    wallet_address VARCHAR(42) PRIMARY KEY,
    
    -- As referrer stats
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    total_jobs_earned_from_referrals INTEGER DEFAULT 0,
    
    -- As referred user stats  
    referred_by_wallet VARCHAR(42),
    jobs_earned_from_being_referred INTEGER DEFAULT 0,
    
    -- Timestamps
    first_referral_at TIMESTAMP,
    last_referral_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_referral_stats_wallet FOREIGN KEY (wallet_address) 
        REFERENCES users(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_user_referral_stats_referred_by FOREIGN KEY (referred_by_wallet) 
        REFERENCES users(wallet_address) ON DELETE SET NULL
);

-- Referral rewards/transactions log
CREATE TABLE IF NOT EXISTS referral_rewards (
    id SERIAL PRIMARY KEY,
    recipient_wallet_address VARCHAR(42) NOT NULL,
    referral_id INTEGER NOT NULL,
    
    -- Reward details
    reward_type VARCHAR(20) NOT NULL, -- 'referrer_bonus', 'referred_bonus'
    jobs_granted INTEGER NOT NULL,
    reason VARCHAR(50) NOT NULL, -- 'new_referral', 'referral_milestone', etc.
    
    -- Timestamps
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Optional expiration for bonus jobs
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked'
    
    CONSTRAINT fk_referral_rewards_wallet FOREIGN KEY (recipient_wallet_address) 
        REFERENCES users(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_referral_rewards_referral FOREIGN KEY (referral_id) 
        REFERENCES user_referrals(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer ON referral_codes(referrer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON user_referrals(referred_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_wallet ON referral_rewards(recipient_wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status, expires_at);

-- Triggers to maintain stats table
CREATE OR REPLACE FUNCTION update_referral_stats() RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new referral)
    IF TG_OP = 'INSERT' THEN
        -- Update referrer stats
        INSERT INTO user_referral_stats (wallet_address, total_referrals, active_referrals, first_referral_at, last_referral_at)
        VALUES (NEW.referrer_wallet_address, 1, 1, NEW.referred_at, NEW.referred_at)
        ON CONFLICT (wallet_address) DO UPDATE SET
            total_referrals = user_referral_stats.total_referrals + 1,
            active_referrals = user_referral_stats.active_referrals + 1,
            last_referral_at = NEW.referred_at,
            first_referral_at = CASE 
                WHEN user_referral_stats.first_referral_at IS NULL 
                THEN NEW.referred_at 
                ELSE user_referral_stats.first_referral_at 
            END,
            updated_at = CURRENT_TIMESTAMP;
            
        -- Update referred user stats
        INSERT INTO user_referral_stats (wallet_address, referred_by_wallet)
        VALUES (NEW.referred_wallet_address, NEW.referrer_wallet_address)
        ON CONFLICT (wallet_address) DO UPDATE SET
            referred_by_wallet = NEW.referrer_wallet_address,
            updated_at = CURRENT_TIMESTAMP;
            
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (status changes)
    IF TG_OP = 'UPDATE' THEN
        -- If status changed from active to inactive
        IF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE user_referral_stats 
            SET active_referrals = active_referrals - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE wallet_address = NEW.referrer_wallet_address;
        END IF;
        
        -- If status changed from inactive to active
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE user_referral_stats 
            SET active_referrals = active_referrals + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE wallet_address = NEW.referrer_wallet_address;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_referral_stats ON user_referrals;
CREATE TRIGGER trigger_update_referral_stats
    AFTER INSERT OR UPDATE ON user_referrals
    FOR EACH ROW EXECUTE FUNCTION update_referral_stats();

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code (avoiding confusing characters)
        code := upper(
            substring(
                translate(
                    encode(gen_random_bytes(6), 'base64'),
                    '+/=0O1lI',
                    'ABCDEFGH'
                ), 1, 8
            )
        );
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_count FROM referral_codes WHERE referral_codes.code = generate_referral_code.code;
        
        -- If unique, return the code
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add referral bonus jobs to user settings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'bonus_jobs_from_referrals'
    ) THEN
        ALTER TABLE users ADD COLUMN bonus_jobs_from_referrals INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create view for easy referral dashboard queries
CREATE OR REPLACE VIEW referral_dashboard AS
SELECT 
    u.wallet_address,
    COALESCE(urs.total_referrals, 0) as total_referrals,
    COALESCE(urs.active_referrals, 0) as active_referrals,
    COALESCE(urs.total_jobs_earned_from_referrals, 0) as jobs_earned_as_referrer,
    COALESCE(urs.jobs_earned_from_being_referred, 0) as jobs_earned_as_referred,
    COALESCE(u.bonus_jobs_from_referrals, 0) as current_bonus_jobs,
    urs.referred_by_wallet,
    urs.first_referral_at,
    urs.last_referral_at,
    (
        SELECT COUNT(*) 
        FROM referral_codes rc 
        WHERE rc.referrer_wallet_address = u.wallet_address 
        AND rc.is_active = true
    ) as active_referral_codes
FROM users u
LEFT JOIN user_referral_stats urs ON u.wallet_address = urs.wallet_address;