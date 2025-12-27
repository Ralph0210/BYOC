-- Migration: Add user_details column to ai_config
-- Enables storing user context/bio for personalization

ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS user_details TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ai_config.user_details IS 'Short bio or context about the user for personalization';
