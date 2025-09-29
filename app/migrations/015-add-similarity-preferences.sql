-- Add similarity preferences to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN similarity_enabled BOOLEAN DEFAULT true,
ADD COLUMN similarity_threshold DECIMAL(3,2) DEFAULT 0.70,
ADD COLUMN max_similar_prompts INTEGER DEFAULT 3,
ADD COLUMN similarity_context_enabled BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.similarity_enabled IS 'Whether similarity detection is enabled for this user';
COMMENT ON COLUMN user_preferences.similarity_threshold IS 'Minimum similarity score threshold (0.00-1.00)';
COMMENT ON COLUMN user_preferences.max_similar_prompts IS 'Maximum number of similar prompts to include in context';
COMMENT ON COLUMN user_preferences.similarity_context_enabled IS 'Whether to inject similarity context into responses';
