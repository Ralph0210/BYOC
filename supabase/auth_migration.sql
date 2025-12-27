-- Path App Database Schema Update for Authentication
-- Run this in Supabase SQL Editor to add user authentication support

-- ===========================================
-- ADD USER_ID TO CHALLENGES TABLE
-- ===========================================

-- Add user_id column (nullable for guest data)
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);

-- ===========================================
-- UPDATE RLS POLICIES FOR CHALLENGES
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on challenges" ON challenges;

-- Users can view their own challenges OR anonymous challenges they created
CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT
  USING (
    user_id IS NULL OR  -- Guest data (no user)
    user_id = auth.uid() OR  -- User's own data
    auth.uid() IS NULL  -- Anonymous access
  );

-- Users can insert challenges
CREATE POLICY "Users can insert challenges" ON challenges
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own challenges
CREATE POLICY "Users can update own challenges" ON challenges
  FOR UPDATE
  USING (
    user_id IS NULL OR
    user_id = auth.uid() OR
    auth.uid() IS NULL
  );

-- Users can delete their own challenges
CREATE POLICY "Users can delete own challenges" ON challenges
  FOR DELETE
  USING (
    user_id IS NULL OR
    user_id = auth.uid() OR
    auth.uid() IS NULL
  );

-- ===========================================
-- UPDATE RLS POLICIES FOR TASKS
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;

-- Tasks inherit access from their challenge
CREATE POLICY "Users can view tasks of their challenges" ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND (c.user_id IS NULL OR c.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can insert tasks" ON tasks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update tasks of their challenges" ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND (c.user_id IS NULL OR c.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can delete tasks of their challenges" ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND (c.user_id IS NULL OR c.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- ===========================================
-- UPDATE RLS POLICIES FOR TASK_COMPLETIONS
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on task_completions" ON task_completions;

-- Completions inherit access from their task's challenge
CREATE POLICY "Users can view their completions" ON task_completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN challenges c ON c.id = t.challenge_id
      WHERE t.id = task_completions.task_id 
      AND (c.user_id IS NULL OR c.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can insert completions" ON task_completions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their completions" ON task_completions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN challenges c ON c.id = t.challenge_id
      WHERE t.id = task_completions.task_id 
      AND (c.user_id IS NULL OR c.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );
