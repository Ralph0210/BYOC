-- Long-Term Memory System for AI Companion
-- This creates persistent memories that span all challenges and conversations

-- Create ai_memories table
CREATE TABLE IF NOT EXISTS ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Memory content
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'pattern', 'fact', 'style', 'conversation')),
  content TEXT NOT NULL,
  context TEXT, -- Where/how this was learned
  
  -- Memory management
  confidence DECIMAL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL CHECK (source IN ('explicit', 'inferred', 'behavioral', 'conversation')),
  last_referenced TIMESTAMPTZ,
  times_referenced INT DEFAULT 0,
  
  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiry for time-sensitive facts
  
  UNIQUE(user_id, content) -- Prevent duplicate memories
);

-- Indexes for efficient retrieval
CREATE INDEX IF NOT EXISTS idx_memories_user ON ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON ai_memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_referenced ON ai_memories(user_id, times_referenced DESC);

-- Enable RLS
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own memories" ON ai_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON ai_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON ai_memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON ai_memories
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_memories_modtime
  BEFORE UPDATE ON ai_memories
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE ai_memories IS 'Stores long-term memories about the user across all challenges and conversations';
COMMENT ON COLUMN ai_memories.memory_type IS 'preference=user preferences, pattern=behavioral patterns, fact=explicit facts, style=communication style, conversation=from chat';
COMMENT ON COLUMN ai_memories.source IS 'explicit=user told us, inferred=we noticed, behavioral=from usage data, conversation=extracted from chat';
