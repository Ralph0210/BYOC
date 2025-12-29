-- ===========================================
-- DELETE ACCOUNT FUNCTION
-- ===========================================
-- Run this in Supabase SQL Editor to enable account deletion

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Security best practice
AS $$
BEGIN
  -- Because all tables have ON DELETE CASCADE references to auth.users,
  -- deleting the user record will automatically wipe all their data.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
