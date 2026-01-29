-- Add scheduled_time and duration_minutes to tasks for calendar integration
-- Also add is_recurring flag to allow toggling frequency behavior

-- Add scheduled_time column (e.g., "09:00" or null for flexible)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT NULL;

-- Add duration_minutes column for time blocking
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT NULL;

-- Add is_recurring flag (when false, task is a one-time task regardless of frequency settings)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT TRUE;

-- Add comment explaining the fields
COMMENT ON COLUMN tasks.scheduled_time IS 'Optional preferred time for this task (e.g., 09:00)';
COMMENT ON COLUMN tasks.duration_minutes IS 'Estimated duration in minutes for calendar blocking';
COMMENT ON COLUMN tasks.is_recurring IS 'When true, use frequency settings. When false, treat as one-time task.';
