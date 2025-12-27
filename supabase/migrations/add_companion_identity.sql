-- Migration: Add companion identity columns to ai_config
-- Run this on existing databases to add the new customization fields

ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS companion_name TEXT;
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS companion_photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ai_config.companion_name IS 'User-defined name for the AI companion';
COMMENT ON COLUMN ai_config.companion_photo_url IS 'URL for companion avatar image';
