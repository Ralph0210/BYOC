-- AI Companion Tables Migration

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. AI Configuration Table
-- stores API keys and preferences per user
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai', -- 'openai', 'anthropic', 'grok'
  api_key TEXT, -- Stored with RLS protection. Ideally encrypted if Supabase Vault is available.
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  personality_preset TEXT DEFAULT 'warm_encourager',
  personality_customizations JSONB DEFAULT '{}',
  custom_instructions TEXT,
  companion_name TEXT, -- User-defined name for the companion
  companion_photo_url TEXT, -- URL for companion avatar image
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. AI Conversations Table
-- stores chat history per challenge
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]', -- Array of {role, content, timestamp}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ambient Cache Table (Optional for now, but good for future)
CREATE TABLE IF NOT EXISTS ai_ambient_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
  context_id UUID,
  content TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, context_type, context_id)
);

-- Enable RLS
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_ambient_cache ENABLE ROW LEVEL SECURITY;

-- Policies for ai_config
CREATE POLICY "Users can view own ai_config" ON ai_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_config" ON ai_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_config" ON ai_config
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_config" ON ai_config
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for ai_conversations
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- Policies for ai_ambient_cache
CREATE POLICY "Users can manage own cache" ON ai_ambient_cache
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_ai_config_modtime
  BEFORE UPDATE ON ai_config
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ai_conversations_modtime
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
