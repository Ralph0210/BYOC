-- Migration: Add custom personality prompt column to ai_config
-- Enables storing full custom persona descriptions

ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS custom_personality_prompt TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ai_config.custom_personality_prompt IS 'Full text prompt for custom personality types';
