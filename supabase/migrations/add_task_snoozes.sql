-- Migration: Add task_snoozes table
-- Run this in Supabase SQL Editor

-- Create the task_snoozes table
CREATE TABLE IF NOT EXISTS task_snoozes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_snoozes_task_date ON task_snoozes(task_id, date);

-- Enable Row Level Security
ALTER TABLE task_snoozes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access snoozes for tasks they own
-- (tasks are linked to challenges which are linked to users)
CREATE POLICY "Users can view own snoozes" ON task_snoozes
  FOR SELECT USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN challenges c ON t.challenge_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own snoozes" ON task_snoozes
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN challenges c ON t.challenge_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own snoozes" ON task_snoozes
  FOR DELETE USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN challenges c ON t.challenge_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
