-- ===========================================
-- PATH APP - COMPLETE DATABASE RESET & SETUP
-- ===========================================
-- This script will completely reset and set up the database
-- Run this in Supabase SQL Editor

-- ===========================================
-- STEP 1: DROP EXISTING TABLES (Clean Slate)
-- ===========================================
DROP VIEW IF EXISTS challenge_progress;
DROP TABLE IF EXISTS task_completions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;

-- ===========================================
-- STEP 2: CREATE CHALLENGES TABLE
-- ===========================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Indexes
CREATE INDEX idx_challenges_user_id ON challenges(user_id);
CREATE INDEX idx_challenges_is_archived ON challenges(is_archived);
CREATE INDEX idx_challenges_created_at ON challenges(created_at DESC);

-- ===========================================
-- STEP 3: CREATE TASKS TABLE
-- ===========================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'circle',
  color TEXT DEFAULT '#007AFF',
  frequency_type TEXT DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'specific_days', 'weekly')),
  frequency_count INTEGER DEFAULT 1,
  frequency_days INTEGER[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_challenge_id ON tasks(challenge_id);
CREATE INDEX idx_tasks_sort_order ON tasks(sort_order);

-- ===========================================
-- STEP 4: CREATE TASK_COMPLETIONS TABLE
-- ===========================================
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX idx_task_completions_date ON task_completions(date);
CREATE INDEX idx_task_completions_task_date ON task_completions(task_id, date);

-- ===========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 6: CREATE RLS POLICIES FOR CHALLENGES
-- ===========================================

-- SELECT: Users can view their own challenges OR guest data OR when anonymous
CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT
  USING (
    user_id IS NULL OR
    user_id = auth.uid() OR
    auth.uid() IS NULL
  );

-- INSERT: Anyone can create challenges
CREATE POLICY "Users can insert challenges" ON challenges
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: Users can update their own or guest challenges
CREATE POLICY "Users can update own challenges" ON challenges
  FOR UPDATE
  USING (
    user_id IS NULL OR
    user_id = auth.uid() OR
    auth.uid() IS NULL
  );

-- DELETE: Users can delete their own or guest challenges
CREATE POLICY "Users can delete own challenges" ON challenges
  FOR DELETE
  USING (
    user_id IS NULL OR
    user_id = auth.uid() OR
    auth.uid() IS NULL
  );

-- ===========================================
-- STEP 7: CREATE RLS POLICIES FOR TASKS
-- ===========================================

-- SELECT: Tasks viewable if parent challenge is accessible
CREATE POLICY "Users can view tasks of their challenges" ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND (c.user_id IS NULL OR c.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- INSERT: Anyone can create tasks
CREATE POLICY "Users can insert tasks" ON tasks
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: Tasks updatable if parent challenge is accessible
CREATE POLICY "Users can update tasks of their challenges" ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND (c.user_id IS NULL OR c.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- DELETE: Tasks deletable if parent challenge is accessible
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
-- STEP 8: CREATE RLS POLICIES FOR TASK_COMPLETIONS
-- ===========================================

-- SELECT: Completions viewable if parent task's challenge is accessible
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

-- INSERT: Anyone can create completions
CREATE POLICY "Users can insert completions" ON task_completions
  FOR INSERT
  WITH CHECK (true);

-- DELETE: Completions deletable if accessible
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

-- ===========================================
-- STEP 9: CREATE HELPER VIEW (Optional)
-- ===========================================
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
-- STEP 10: CREATE AI COMPANION CONFIG TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai',
  api_key TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  personality_preset TEXT DEFAULT 'warm_encourager',
  personality_customizations JSONB DEFAULT '{}',
  custom_instructions TEXT,
  companion_name TEXT,
  companion_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS for ai_config
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Policies for ai_config
CREATE POLICY "Users can view own ai_config" ON ai_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_config" ON ai_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_config" ON ai_config
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_config" ON ai_config
  FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- ✅ DONE! Database is ready.
-- ===========================================
