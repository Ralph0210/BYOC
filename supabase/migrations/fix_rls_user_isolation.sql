-- BYOC Database RLS Fix
-- Run this in Supabase SQL Editor to properly enforce user isolation
-- ⚠️ CRITICAL: This will make existing challenges without user_id invisible to authenticated users

-- ===========================================
-- STEP 1: DROP ALL EXISTING PERMISSIVE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can insert challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can delete own challenges" ON challenges;
DROP POLICY IF EXISTS "Allow all operations on challenges" ON challenges;

DROP POLICY IF EXISTS "Users can view tasks of their challenges" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks of their challenges" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their challenges" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their completions" ON task_completions;
DROP POLICY IF EXISTS "Users can insert completions" ON task_completions;
DROP POLICY IF EXISTS "Users can delete their completions" ON task_completions;
DROP POLICY IF EXISTS "Allow all operations on task_completions" ON task_completions;

-- ===========================================
-- STEP 2: CREATE STRICT RLS POLICIES FOR CHALLENGES
-- Each user can ONLY see their own challenges
-- ===========================================

-- SELECT: Users can only view challenges where user_id matches their auth.uid()
CREATE POLICY "challenges_select_own" ON challenges
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can only insert challenges with their own user_id
CREATE POLICY "challenges_insert_own" ON challenges
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own challenges
CREATE POLICY "challenges_update_own" ON challenges
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can only delete their own challenges
CREATE POLICY "challenges_delete_own" ON challenges
  FOR DELETE
  USING (user_id = auth.uid());

-- ===========================================
-- STEP 3: CREATE STRICT RLS POLICIES FOR TASKS
-- Tasks inherit access from their parent challenge
-- ===========================================

-- SELECT: Users can only view tasks of their own challenges
CREATE POLICY "tasks_select_own" ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND c.user_id = auth.uid()
    )
  );

-- INSERT: Users can only insert tasks into their own challenges
CREATE POLICY "tasks_insert_own" ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND c.user_id = auth.uid()
    )
  );

-- UPDATE: Users can only update tasks of their own challenges
CREATE POLICY "tasks_update_own" ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND c.user_id = auth.uid()
    )
  );

-- DELETE: Users can only delete tasks of their own challenges
CREATE POLICY "tasks_delete_own" ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM challenges c 
      WHERE c.id = tasks.challenge_id 
      AND c.user_id = auth.uid()
    )
  );

-- ===========================================
-- STEP 4: CREATE STRICT RLS POLICIES FOR TASK_COMPLETIONS
-- Completions inherit access from their parent task's challenge
-- ===========================================

-- SELECT: Users can only view completions of their own challenges' tasks
CREATE POLICY "completions_select_own" ON task_completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN challenges c ON c.id = t.challenge_id
      WHERE t.id = task_completions.task_id 
      AND c.user_id = auth.uid()
    )
  );

-- INSERT: Users can only insert completions for their own challenges' tasks
CREATE POLICY "completions_insert_own" ON task_completions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN challenges c ON c.id = t.challenge_id
      WHERE t.id = task_completions.task_id 
      AND c.user_id = auth.uid()
    )
  );

-- DELETE: Users can only delete completions of their own challenges' tasks
CREATE POLICY "completions_delete_own" ON task_completions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN challenges c ON c.id = t.challenge_id
      WHERE t.id = task_completions.task_id 
      AND c.user_id = auth.uid()
    )
  );

-- ===========================================
-- VERIFICATION: Check that policies are applied
-- ===========================================
-- Run this to verify:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies 
-- WHERE tablename IN ('challenges', 'tasks', 'task_completions');
