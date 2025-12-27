-- Path App Database Schema
-- Run this in Supabase SQL Editor to set up or update the database

-- ===========================================
-- CHALLENGES TABLE
-- ===========================================
-- Drop existing table if recreating from scratch (comment out if updating)
-- DROP TABLE IF EXISTS challenges CASCADE;

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER,
  reward_text TEXT DEFAULT '',
  reward_link TEXT DEFAULT '',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_challenges_is_archived ON challenges(is_archived);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at DESC);

-- ===========================================
-- TASKS TABLE
-- ===========================================
-- DROP TABLE IF EXISTS tasks CASCADE;

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'circle',
  color TEXT DEFAULT '#007AFF',
  frequency_type TEXT DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'specific_days', 'weekly')),
  frequency_count INTEGER DEFAULT 1,
  frequency_days INTEGER[] DEFAULT '{}',  -- Array of day numbers (0=Sun, 1=Mon, etc.)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_challenge_id ON tasks(challenge_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);

-- ===========================================
-- TASK COMPLETIONS TABLE
-- ===========================================
-- DROP TABLE IF EXISTS task_completions CASCADE;

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_date ON task_completions(task_id, date);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
-- Enable RLS on all tables
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for simplicity (no auth required)
-- In production, you should add proper user-based policies

-- Challenges: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on challenges" ON challenges;
CREATE POLICY "Allow all operations on challenges" ON challenges
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tasks: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Task Completions: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on task_completions" ON task_completions;
CREATE POLICY "Allow all operations on task_completions" ON task_completions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- HELPFUL VIEWS (Optional)
-- ===========================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS challenge_progress;

-- View for challenge progress with SECURITY INVOKER (respects RLS)
CREATE VIEW challenge_progress
WITH (security_invoker = true)
AS
SELECT 
  c.id AS challenge_id,
  c.name AS challenge_name,
  c.start_date,
  c.end_date,
  COUNT(DISTINCT t.id) AS total_tasks,
  COUNT(tc.id) AS total_completions
FROM challenges c
LEFT JOIN tasks t ON t.challenge_id = c.id
LEFT JOIN task_completions tc ON tc.task_id = t.id
WHERE c.is_archived = false
GROUP BY c.id, c.name, c.start_date, c.end_date;

-- ===========================================
-- SAMPLE DATA (Optional - uncomment to add)
-- ===========================================
/*
-- Insert sample challenge
INSERT INTO challenges (name, description, start_date, end_date, duration_days, reward_text)
VALUES (
  'Morning Routine',
  'Build a healthy morning routine',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  30,
  'Treat yourself to a nice breakfast!'
);

-- Insert sample tasks
INSERT INTO tasks (challenge_id, name, description, icon, color, frequency_type, frequency_count)
SELECT 
  c.id,
  'Drink water',
  'Drink 8 glasses of water',
  'droplet',
  '#0EA5E9',
  'daily',
  8
FROM challenges c WHERE c.name = 'Morning Routine';

INSERT INTO tasks (challenge_id, name, description, icon, color, frequency_type, frequency_count)
SELECT 
  c.id,
  'Exercise',
  '30 minutes of exercise',
  'dumbbell',
  '#F97316',
  'daily',
  1
FROM challenges c WHERE c.name = 'Morning Routine';
*/
