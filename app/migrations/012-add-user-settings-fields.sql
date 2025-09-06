-- Add user settings fields to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS ai_personality TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS user_bio TEXT DEFAULT '';