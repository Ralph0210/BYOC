# Path AI Companion — Product Requirements Document

**Version:** 1.0  
**Author:** Ralph  
**Date:** December 2025  
**Status:** Draft

---

## 1. Overview

### 1.1 What We're Building

Path currently tracks challenges and tasks. This PRD describes adding an **AI Companion layer** that transforms Path from a tracker into a supportive presence—someone who understands your journey, notices patterns, and offers encouragement without judgment.

### 1.2 Core Philosophy

The companion is not a coach, assistant, or chatbot. It's closer to a **caring older sibling** who:

- Sees your whole picture, not just today
- Notices when you're struggling before you ask for help
- Celebrates wins without being performative
- Never shames, guilts, or uses manipulative motivation tactics

### 1.3 Key Differentiators

| Traditional Productivity AI       | Path Companion                 |
| --------------------------------- | ------------------------------ |
| Transactional ("How can I help?") | Relational ("I've noticed...") |
| Responds when asked               | Contextually present           |
| Generic encouragement             | Personalized to your data      |
| Lives in a chat window            | Woven through the interface    |

---

## 2. User Stories

### 2.1 Primary User Stories

**As a user, I want to...**

1. **Configure my own AI** so I control costs and privacy
2. **Choose a companion personality** that resonates with how I want to be supported
3. **See contextual encouragement** without opening a separate chat
4. **Have deeper conversations** when I need guidance or want to reflect
5. **Receive insights about my patterns** that I wouldn't notice myself

### 2.2 Anti-Stories (What We're NOT Building)

- ❌ An AI that nags or sends push notifications
- ❌ Gamification mechanics (streaks as punishment, leaderboards)
- ❌ Generic motivational quotes
- ❌ An AI that makes you feel bad for missing tasks

---

## 3. Feature Specification

### 3.1 BYOK (Bring Your Own Key) Configuration

#### 3.1.1 Supported Providers (MVP)

| Provider  | Models                                              | Pricing (per 1M tokens)              | Notes                          |
| --------- | --------------------------------------------------- | ------------------------------------ | ------------------------------ |
| OpenAI    | gpt-4o, gpt-4o-mini                                 | $5/$15 (4o), $0.15/$0.60 (mini)      | Most familiar to users         |
| Anthropic | claude-sonnet-4-20250514, claude-haiku-4-5-20251001 | $3/$15 (Sonnet), $0.25/$1.25 (Haiku) | Better at nuanced conversation |
| xAI       | grok-4, grok-4-fast                                 | $3/$15 (4), $0.20/$0.50 (fast)       | OpenAI-compatible API format   |
| Google    | gemini-2.0-flash                                    | $0.075/$0.30                         | Most cost-effective            |

**Note on xAI/Grok:** The Grok API is compatible with OpenAI's API format, making integration straightforward. Simply change the base URL to `https://api.x.ai/v1`. Grok also includes built-in prompt caching—cached input tokens cost only $0.75/1M (75% discount).

#### 3.1.2 Configuration UI

Location: Settings → AI Companion

**Fields:**

- Provider dropdown (OpenAI / Anthropic / Google)
- API Key (password field, stored encrypted in Supabase)
- Model selector (filtered by provider)
- "Test Connection" button
- Estimated cost indicator (rough $/month based on typical usage)

**Validation:**

- On save, make a minimal test call to verify key works
- Show clear error if key is invalid or rate-limited
- Never send API key to any server except the chosen provider

#### 3.1.3 Data Sent to AI

The following data is included in AI context:

```javascript
{
  // Challenge context
  challenges: [{
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
    daysElapsed: number,
    daysRemaining: number,
    overallCompletionRate: number,
    reward: string
  }],

  // Task details with history
  tasks: [{
    name: string,
    icon: string,
    color: string,
    frequencyType: 'daily' | 'weekly' | 'specific_days',
    frequencyTarget: number,
    completionRate7d: number,
    completionRate30d: number,
    currentStreak: number,
    bestStreak: number,
    lastCompletedAt: Date
  }],

  // Recent activity (last 14 days)
  recentCompletions: [{
    taskName: string,
    date: Date,
    completedCount: number,
    targetCount: number
  }],

  // Computed insights
  insights: {
    strongestDay: string,      // "Tuesday"
    weakestDay: string,        // "Sunday"
    averageTasksPerDay: number,
    perfectDaysThisWeek: number,
    trendsUp: string[],        // ["Morning Routine", "Reading"]
    trendsDown: string[]       // ["Exercise"]
  }
}
```

---

### 3.2 Companion Personality System

#### 3.2.1 Preset Personalities

Users select from presets, then optionally customize.

| Preset              | Tone                    | Style                                    | Example Voice                                                                 |
| ------------------- | ----------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| **Warm Encourager** | Gentle, affirming       | Celebrates small wins, reframes setbacks | "Hey, three days in a row—that's real momentum building."                     |
| **Direct Coach**    | Honest, action-oriented | Focuses on what's next, minimal fluff    | "You missed yesterday. Today's a new day. What's the first task?"             |
| **Curious Friend**  | Inquisitive, reflective | Asks questions, helps you think          | "I noticed you've been skipping evenings. What's happening around that time?" |
| **Quiet Supporter** | Minimal, present        | Speaks only when meaningful              | "Good day." / "Rough week. Still here."                                       |

#### 3.2.2 Customization Options

After selecting a preset, users can adjust:

- **Name** (default: none, users can name their companion)
- **Tone slider**: Gentle ←→ Direct
- **Verbosity slider**: Brief ←→ Detailed
- **Focus areas**: What to comment on (streaks, patterns, specific tasks)
- **Custom instructions**: Freeform text ("Never mention my weight loss challenge in a negative way")

#### 3.2.3 System Prompt Architecture

```
[Base instructions - non-editable]
You are a supportive companion in Path, a challenge-based habit tracker.
Your role is to notice, encourage, and occasionally guide—never to judge, shame, or use guilt as motivation.

[Personality layer - from preset + customization]
{personality_prompt}

[User context - computed from data]
{user_data_context}

[Custom instructions - user-provided]
{custom_instructions}
```

---

### 3.3 Ambient Presence (Primary Interface)

The companion's voice appears throughout the UI, not confined to a chat.

#### 3.3.1 Presence Locations

| Location                 | Trigger                 | Example Content                                                                   |
| ------------------------ | ----------------------- | --------------------------------------------------------------------------------- |
| **Challenge Header**     | Always visible          | "Day 12 of 30. You've found your groove this week."                               |
| **Task List**            | Contextual              | Below a long-untouched task: "This one's been waiting. Still the right priority?" |
| **Daily Summary**        | End of day (or on open) | "4 of 5 today. The one you skipped was the hard one—that's human."                |
| **Calendar View**        | On perfect day          | Small note: "Tuesday was a perfect day ✓"                                         |
| **Empty State**          | No tasks today          | "Rest day, or ready to add something?"                                            |
| **Return After Absence** | 3+ days away            | "Welcome back. No judgment—want to pick up or start fresh?"                       |

#### 3.3.2 Ambient UI Component

```jsx
// Conceptual structure
<AmbientNote
  context="challenge-header"
  challengeId={currentChallenge.id}
  className="text-sm text-tertiary italic mt-2"
/>
```

**Rendering rules:**

- Max 1-2 sentences
- Subtle typography (smaller, muted color, italic optional)
- Never blocks interaction
- Can be dismissed (remembers dismissal for that context)
- Refreshes on meaningful state change (completion, new day)

#### 3.3.3 Generation Strategy

Ambient notes are **not** generated on every render. Strategy:

1. **Cache aggressively**: Generate once per context per session
2. **Batch generation**: On app open, generate all ambient notes for current view
3. **Invalidate on action**: Re-generate relevant note after task completion
4. **Fallback gracefully**: If API fails, show nothing (not an error)

---

### 3.4 Deep Conversation Mode

For longer interactions, users can open a full conversation.

#### 3.4.1 Entry Points

- Tap any ambient note → expands to conversation
- Dedicated "Talk to [Companion]" button in challenge view
- Swipe gesture on mobile (TBD)

#### 3.4.2 Conversation UI

- Slide-up panel (mobile) / side panel (desktop)
- Maintains context from ambient note that triggered it
- Shows recent conversation history (last 5 exchanges, stored locally)
- Typing indicator while generating

#### 3.4.3 Suggested Prompts

Based on context, surface 2-3 tappable suggestions:

| Context               | Suggestions                                                     |
| --------------------- | --------------------------------------------------------------- |
| Low completion week   | "Why is this week harder?" / "What would make tomorrow easier?" |
| Streak broken         | "What happened?" / "Should we adjust the goal?"                 |
| Challenge ending soon | "How do I feel about this challenge?" / "What's next?"          |
| Perfect week          | "What's working?" / "Ready for a harder challenge?"             |

#### 3.4.4 Conversation Memory

**Design goal:** The companion should feel like someone who genuinely knows you—across challenges, across time.

**Memory tiers:**

| Tier          | Scope                 | Persists           | Example                                                     |
| ------------- | --------------------- | ------------------ | ----------------------------------------------------------- |
| Session       | Current conversation  | Until close        | "You just said you're tired"                                |
| Challenge     | Current challenge     | Challenge lifetime | "You struggled with mornings last week"                     |
| **Long-term** | Across all challenges | Forever            | "You're a night owl", "You respond well to direct feedback" |

**Long-term memory includes:**

- Learned preferences ("prefers encouragement over accountability")
- Patterns that span challenges ("always struggles in week 2")
- Personal context shared in conversations ("works night shifts", "has two kids")
- Communication style observations ("responds well to questions")
- Explicit user statements ("I'm training for a marathon")

**Memory sources:**

1. **Explicit:** User tells companion something ("I work nights")
2. **Inferred:** Companion notices patterns ("You're more consistent on weekdays")
3. **Behavioral:** Derived from app usage data (not conversation)

---

### 3.5 Proactive Insights (Phase 2)

After MVP, add computed insights the AI can reference:

#### 3.5.1 Pattern Detection

| Pattern              | How Detected                    | AI Use                                    |
| -------------------- | ------------------------------- | ----------------------------------------- |
| Day-of-week trends   | Aggregate completion by weekday | "Sundays are your rest days—intentional?" |
| Time-of-day patterns | If timestamps available         | "You're a morning person for this task"   |
| Task correlations    | Co-completion analysis          | "When you do X, you usually do Y too"     |
| Declining trends     | 7-day rolling average drops     | "Exercise has been slipping—what's up?"   |

#### 3.5.2 Insight Delivery

Insights appear as ambient notes, not notifications. User must open app to see them.

---

## 4. Technical Architecture

### 4.1 Database Schema Additions

```sql
-- User AI configuration
CREATE TABLE ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai', -- 'openai', 'anthropic', 'google'
  api_key_encrypted TEXT, -- encrypted with app secret
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  personality_preset TEXT DEFAULT 'warm_encourager',
  personality_customizations JSONB DEFAULT '{}',
  custom_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Conversation history (per challenge)
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]', -- [{role, content, timestamp}]
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cached ambient notes
CREATE TABLE ai_ambient_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL, -- 'challenge_header', 'task_note', etc.
  context_id UUID, -- challenge_id or task_id
  content TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- cache invalidation
  UNIQUE(user_id, context_type, context_id)
);

-- RLS policies
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_ambient_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI config" ON ai_config
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cache" ON ai_ambient_cache
  FOR ALL USING (auth.uid() = user_id);
```

### 4.2 API Key Security

**Critical**: API keys are user secrets.

1. **Encryption at rest**: Use Supabase Vault or app-level encryption
2. **Never log keys**: Ensure no server logs capture keys
3. **Client-side calls**: API calls go directly from client to provider (not through your server)
4. **Key validation**: On save, make minimal test call to verify

```javascript
// Client-side API call (no server intermediary)
const callAI = async (messages, config) => {
  const endpoint = {
    openai: "https://api.openai.com/v1/chat/completions",
    anthropic: "https://api.anthropic.com/v1/messages",
    google: "https://generativelanguage.googleapis.com/v1beta/models",
  }[config.provider]

  // Direct call with user's key
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model, messages }),
  })

  return response.json()
}
```

### 4.3 Context Assembly

```javascript
// hooks/useAIContext.js
const useAIContext = (challengeId) => {
  const { challenges } = useChallenges()
  const { tasks } = useTasks(challengeId)
  const { completions } = useCompletions(challengeId)

  return useMemo(
    () => ({
      challenge: formatChallengeContext(
        challenges.find((c) => c.id === challengeId)
      ),
      tasks: tasks.map(formatTaskContext),
      recentActivity: computeRecentActivity(completions, 14),
      insights: computeInsights(completions, tasks),
    }),
    [challenges, tasks, completions]
  )
}
```

### 4.4 Component Architecture

```
src/
├── components/
│   └── ai/
│       ├── AmbientNote.jsx        # Inline companion text
│       ├── ConversationPanel.jsx  # Full chat interface
│       ├── PersonalityPicker.jsx  # Preset + customization
│       └── AIConfigForm.jsx       # API key + model setup
├── hooks/
│   ├── useAI.js                   # Core AI call logic
│   ├── useAIContext.js            # Context assembly
│   ├── useAmbientNotes.js         # Cached ambient generation
│   └── useConversation.js         # Chat state management
├── lib/
│   ├── ai/
│   │   ├── providers.js           # Provider-specific formatting
│   │   ├── prompts.js             # System prompt templates
│   │   └── personalities.js       # Preset definitions
│   └── encryption.js              # API key encryption
```

---

## 5. UX Flows

### 5.1 First-Time Setup

```
[User enables AI Companion in Settings]
    ↓
[Select Provider] → OpenAI / Anthropic / Google
    ↓
[Enter API Key] → Validate with test call
    ↓
[Choose Personality] → Show presets with example quotes
    ↓
[Optional: Customize] → Name, tone, instructions
    ↓
[Done] → Return to app, ambient notes now appear
```

### 5.2 Daily Usage Flow

```
[User opens app]
    ↓
[Challenge header shows ambient note]
    "Day 8. Yesterday was strong—3 tasks including the hard one."
    ↓
[User completes a task]
    ↓
[Ambient note updates if relevant]
    "That's 2 of 3 for today. Evening routine left."
    ↓
[User taps note to expand]
    ↓
[Conversation panel opens with context]
    ↓
[Suggested prompts appear]
    "What's making evening routine hard?" / "Tell me about this challenge"
```

### 5.3 Return After Absence

```
[User opens app after 5 days away]
    ↓
[Special ambient note at top]
    "Hey, you're back. No pressure—want to pick up where you left off, or adjust the challenge?"
    ↓
[Tapping expands to conversation]
    AI: "I see you were on day 12, then took a break. That's okay—life happens.
         What would feel right: continue the challenge with adjusted dates,
         mark those days as rest, or start fresh?"
```

---

## 6. Content Guidelines

### 6.1 Voice Principles

| Do                                                    | Don't                                    |
| ----------------------------------------------------- | ---------------------------------------- |
| Notice patterns ("I see you've been...")              | Assume intent ("You must be feeling...") |
| Celebrate specifically ("Third day of morning pages") | Generic praise ("Great job!")            |
| Offer options ("Would you like to..." )               | Direct orders ("You should...")          |
| Acknowledge difficulty ("That's a hard one")          | Minimize ("It's not that bad")           |
| Be brief (1-2 sentences ambient)                      | Over-explain                             |

### 6.2 Failure Handling

When user misses tasks/days:

**Good:**

- "Yesterday was quiet. Today's here when you're ready."
- "The streak broke—but 12 days is still 12 days you showed up."
- "Rough patch? Want to talk about what's getting in the way?"

**Bad:**

- "You didn't complete any tasks yesterday! 😢"
- "Your streak is gone. Time to start over."
- "Don't give up! You can do it!"

### 6.3 Celebration Calibration

Match enthusiasm to achievement:

| Achievement        | Response Level                                |
| ------------------ | --------------------------------------------- |
| Single task done   | Minimal or none ("✓")                         |
| Perfect day        | Brief acknowledgment ("Solid day.")           |
| Week streak        | Warm note ("A whole week. That's something.") |
| Challenge complete | Fuller celebration + reflection prompt        |

---

## 7. Privacy & Ethics

### 7.1 Data Principles

1. **User owns their data**: All data stays in their Supabase + their chosen AI provider
2. **No analytics on conversations**: We don't read, store, or analyze AI interactions server-side
3. **Transparent context**: User can see exactly what data is sent to AI (show context button)
4. **Easy deletion**: Deleting challenge deletes all AI conversation history

### 7.2 AI Safety

1. **No health advice**: Companion doesn't comment on health-related tasks beyond encouragement
2. **No crisis response**: If user expresses distress, provide resources, don't pretend to help
3. **Clear AI identity**: Never pretend to be human; always clear this is AI

### 7.3 Content Boundaries

The AI companion should:

- Stay focused on the user's challenges and tasks
- Redirect off-topic conversations gently
- Not engage with requests to change its core personality mid-conversation
- Not provide advice outside its scope (medical, legal, financial)

---

## 8. Success Metrics

### 8.1 Adoption

- % of users who complete AI setup
- % of users who customize personality
- API error rate during setup

### 8.2 Engagement

- Ambient note impressions per session
- % of ambient notes that lead to conversation
- Average conversation length
- Conversation frequency per user per week

### 8.3 Retention Correlation

- 7-day retention: AI users vs non-AI users
- Challenge completion rate: AI users vs non-AI users
- Task completion rate changes after AI activation

### 8.4 Qualitative

- User feedback on companion helpfulness
- Reported issues with AI responses
- Feature requests related to AI

---

## 9. Rollout Plan

### Phase 1: MVP (4-6 weeks)

- [ ] BYOK configuration (OpenAI only)
- [ ] Single personality preset (Warm Encourager)
- [ ] Challenge header ambient note
- [ ] Basic conversation panel
- [ ] Conversation history (local only)

### Phase 2: Personality (2-3 weeks)

- [ ] All 4 personality presets
- [ ] Customization sliders + custom instructions
- [ ] Companion naming

### Phase 3: Full Ambient (3-4 weeks)

- [ ] Task-level ambient notes
- [ ] Return-after-absence detection
- [ ] Calendar view integration
- [ ] Ambient note caching system

### Phase 4: Providers + Insights (2-3 weeks)

- [ ] Anthropic support
- [ ] Google support
- [ ] Pattern detection + insights
- [ ] "Show AI context" transparency feature

---

## 10. Open Questions

1. **Onboarding timing**: When do we introduce AI setup? First launch? After first challenge? After first completion?

2. **Free tier**: Should there be any AI functionality without BYOK? (e.g., pre-generated generic encouragement)

3. **Mobile notifications**: Should the companion ever send push notifications? Current stance: No, but open to reconsideration.

4. **Voice/audio**: Is voice input/output on the roadmap? Would significantly change the relationship feel.

5. **Multi-challenge context**: When viewing overall dashboard, does companion see all challenges or just the active one?

6. **Companion persistence**: If user switches providers/models, does personality feel consistent? How do we handle this?

---

## 11. Cost Optimization Strategies

Based on industry research, here are the strategies to minimize API costs while maximizing UX quality.

### 11.1 The Cost Problem

Without optimization, a habit tracking app could easily burn through user API budgets:

- Each ambient note generation: ~500-1000 tokens
- Each conversation turn: ~2000-5000 tokens
- Active user generating 10+ calls/day = $5-15/month on GPT-4

**Target: Reduce to <$1/month for typical usage**

### 11.2 Multi-Tier Caching Strategy

#### Tier 1: Semantic Caching (Highest Impact)

Semantic caching identifies and stores similar or related queries, rather than relying on exact matches. This increases the likelihood of a cache hit, even when queries aren't identical.

**Implementation for Path:**

```javascript
// Example: These should return the same cached response
"How am I doing on my challenge?"
"What's my progress?"
"Am I on track?"

// Use embedding similarity (cosine > 0.85) to match
```

**Where to apply:**

- Common questions about progress
- Requests for encouragement
- Pattern queries ("what day am I strongest?")

**Expected savings:** Semantic caching reduced API calls by up to 68.8% across various query categories.

#### Tier 2: Provider Prompt Caching (For Conversations)

Both Anthropic and OpenAI offer native prompt caching that dramatically reduces costs for repeated context.

**Anthropic's approach:**
With prompt caching, customers can provide Claude with more background knowledge and example outputs—all while reducing costs by up to 90% and latency by up to 85% for long prompts.

**How it works:**

```javascript
// Mark static content for caching
{
  "type": "text",
  "text": systemPrompt + personalityPrompt + userContextData,
  "cache_control": {"type": "ephemeral"}  // Cache for 5 min
}
```

Cached prompts are priced based on the number of input tokens you cache and how frequently you use that content. Writing to the cache costs 25% more than the base input token price, while using cached content costs only 10% of the base input token price.

**Path implementation:**

1. Cache the system prompt + personality (stable across session)
2. Cache user context data (stable within session)
3. Only the user's actual message is "new" tokens

#### Tier 3: Response Caching by Context Hash

For ambient notes specifically:

```javascript
const cacheKey = hash({
  context: "challenge_header",
  challengeId: challenge.id,
  completionRate: Math.round(stats.completionRate * 10) / 10, // Round to avoid cache misses
  daysElapsed: stats.daysElapsed,
  lastActivityDate: stats.lastActivity.toDateString(),
})

// Only regenerate if context meaningfully changed
```

### 11.3 Model Routing (Smart Model Selection)

Not all LLMs cost the same. Smaller models often perform well on focused tasks, so if your use case doesn't require deep analysis or creative reasoning, starting small makes sense.

**Path's routing strategy:**

| Task                | Model               | Rationale                    |
| ------------------- | ------------------- | ---------------------------- |
| Ambient notes       | GPT-4o-mini / Haiku | Short, formulaic output      |
| Quick encouragement | GPT-4o-mini / Haiku | Simple emotional response    |
| Pattern analysis    | GPT-4o / Sonnet     | Needs reasoning over data    |
| Deep conversation   | GPT-4o / Sonnet     | Nuanced, contextual dialogue |
| Reflection prompts  | GPT-4o / Sonnet     | Creative, personalized       |

**Cost difference:**

- GPT-4o: ~$5/1M input tokens
- GPT-4o-mini: ~$0.15/1M input tokens (33x cheaper)

**Implementation:**

```javascript
const selectModel = (taskType, userPreference) => {
  const routing = {
    ambient_note: "gpt-4o-mini",
    encouragement: "gpt-4o-mini",
    pattern_analysis: "gpt-4o",
    conversation: userPreference || "gpt-4o",
  }
  return routing[taskType]
}
```

### 11.4 Batching & Pre-generation

Batching requests is a smart way to optimize your LLM usage and save on costs. Instead of sending individual requests every time you need to process text, you can group multiple requests together and send them as a single batch.

**Path's batching strategy:**

1. **On app open**: Generate all ambient notes for current view in one batch call
2. **On challenge change**: Pre-generate notes for likely next views
3. **Daily digest**: Generate once per day, cache for 24 hours

```javascript
// Batch request example
const batchPrompt = `
Generate brief ambient notes for the following contexts. 
Return as JSON array.

Contexts:
1. Challenge header (day ${day} of ${total}, ${rate}% completion)
2. Task "Morning Routine" (3-day streak, usually done by 9am)
3. Task "Exercise" (missed 4 of last 7 days)
4. Return after 2 days away

Format: [{"context": "...", "note": "..."}]
`
```

### 11.5 Local Inference Option (Future)

For privacy-conscious users or those wanting zero API costs:

- Integrate with local models via Ollama
- Use smaller models (Llama 3.2 3B, Phi-3) for ambient notes
- Keep full conversations optional/cloud-only

### 11.6 Cost Monitoring & Budgets

**User-facing:**

- Show estimated monthly cost in settings
- Optional budget cap ("pause AI after $X/month")
- Usage breakdown by feature

**Implementation:**

```javascript
// Track in Supabase
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY,
  user_id UUID,
  timestamp TIMESTAMPTZ,
  task_type TEXT,
  model TEXT,
  input_tokens INT,
  output_tokens INT,
  cached_tokens INT,
  estimated_cost DECIMAL
);
```

### 11.7 Expected Cost Profile

With all optimizations applied:

| Usage Pattern                | Calls/Day | Estimated Cost/Month |
| ---------------------------- | --------- | -------------------- |
| Light (view only)            | 2-3       | $0.05-0.15           |
| Moderate (daily check-in)    | 5-10      | $0.20-0.50           |
| Heavy (active conversations) | 15-25     | $0.75-1.50           |

---

## 12. Memory & Persistence Architecture

### 12.1 The Provider Landscape (As of Late 2024)

**OpenAI:**

- The Assistants API is being deprecated with a sunset date of August 26, 2026.
- The Responses API is OpenAI's latest interface, designed as a superset of the Chat Completions API. It adds optional server-side memory: you can store conversation state so you don't have to send the entire history every turn.
- Threads → Conversations migration path exists

**Anthropic:**

- No built-in thread/memory system
- Prompt caching handles context efficiently
- Memory must be managed client-side

**Google:**

- Context caching available
- No persistent thread concept

### 12.2 Recommended Architecture: Client-Side Memory

Given the fragmented provider landscape and Path's BYOK model, **manage memory yourself** rather than depending on provider-specific features.

**Rationale:**

1. Works identically across all providers
2. User controls their data
3. No vendor lock-in
4. Simpler mental model

### 12.3 Memory Tiers

#### Tier 1: Session Memory (In-Memory)

```javascript
// React state or context
const [conversationHistory, setConversationHistory] = useState([])

// Append each exchange
setConversationHistory((prev) => [
  ...prev,
  { role: "user", content: userMessage },
  { role: "assistant", content: aiResponse },
])
```

- Cleared on page refresh
- Used for: Current conversation continuity

#### Tier 2: Challenge Memory (Supabase)

```sql
-- Store conversation history per challenge
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  challenge_id UUID REFERENCES challenges(id),
  messages JSONB DEFAULT '[]',  -- [{role, content, timestamp}]
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- Persists across sessions
- Scoped to challenge
- Used for: "Remember when we talked about your morning struggles..."

#### Tier 3: Long-Term Memory (Supabase) — NEW

This is what makes the companion feel like someone who _knows_ you.

```sql
-- Persistent memories that span all challenges
CREATE TABLE ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Memory content
  memory_type TEXT NOT NULL,  -- 'preference', 'pattern', 'fact', 'style'
  content TEXT NOT NULL,      -- "User is a night owl"
  context TEXT,               -- Where/how this was learned

  -- Memory management
  confidence DECIMAL DEFAULT 0.8,  -- How sure are we? (0-1)
  source TEXT NOT NULL,       -- 'explicit', 'inferred', 'behavioral'
  last_referenced TIMESTAMPTZ,
  times_referenced INT DEFAULT 0,

  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,     -- Optional expiry for time-sensitive facts

  UNIQUE(user_id, content)    -- Prevent duplicate memories
);

-- Index for efficient retrieval
CREATE INDEX idx_memories_user ON ai_memories(user_id);
CREATE INDEX idx_memories_type ON ai_memories(user_id, memory_type);

-- RLS
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their memories" ON ai_memories
  FOR ALL USING (auth.uid() = user_id);
```

**Memory types:**

| Type         | Examples                                                      | Source               |
| ------------ | ------------------------------------------------------------- | -------------------- |
| `preference` | "Prefers direct feedback", "Doesn't like emojis"              | Explicit or inferred |
| `pattern`    | "Strongest on Tuesdays", "Struggles in week 2"                | Behavioral           |
| `fact`       | "Works night shifts", "Has two kids", "Training for marathon" | Explicit             |
| `style`      | "Responds well to questions", "Likes brief messages"          | Inferred             |

**Memory extraction:**

After each conversation, run a lightweight extraction:

```javascript
const extractMemories = async (conversation, existingMemories) => {
  const response = await ai.complete({
    model: "gpt-4o-mini", // Cheap model for extraction
    messages: [
      {
        role: "system",
        content: `You extract memorable facts from conversations.
        
Existing memories: ${JSON.stringify(existingMemories)}

From this conversation, identify:
1. New facts the user shared about themselves
2. Preferences they expressed (communication style, what helps them)
3. Corrections to existing memories

Return JSON: { 
  "new": [{"type": "fact|preference|style", "content": "...", "confidence": 0.9}],
  "update": [{"id": "...", "content": "...", "confidence": 0.9}],
  "invalidate": ["id1", "id2"]
}`,
      },
      ...conversation,
    ],
  })

  return JSON.parse(response)
}
```

**Memory injection into context:**

```javascript
const buildContextWithMemories = async (userId, challengeId) => {
  // Get long-term memories
  const memories = await supabase
    .from("ai_memories")
    .select("*")
    .eq("user_id", userId)
    .order("times_referenced", { ascending: false })
    .limit(20) // Most-referenced memories

  // Get recent challenge conversation
  const recentChat = await supabase
    .from("ai_conversations")
    .select("messages")
    .eq("challenge_id", challengeId)
    .single()

  return {
    longTermMemories: memories.data,
    recentConversation: recentChat?.data?.messages?.slice(-10) || [],
  }
}
```

**Prompt structure with memories:**

```javascript
const systemPrompt = `You are a supportive companion who knows this user well.

## What you know about them:
${memories.map((m) => `- ${m.content} (${m.memory_type})`).join("\n")}

## Recent context:
${recentConversation.map((m) => `${m.role}: ${m.content}`).join("\n")}

Use this knowledge naturally—don't announce that you "remember" things, 
just incorporate what you know into how you respond.`
```

#### Tier 4: User Preferences (Supabase) — Explicit Config

Distinct from inferred memories—these are settings the user explicitly controls:

```sql
CREATE TABLE ai_user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  preferences JSONB DEFAULT '{}'
  -- e.g., {
  --   "never_mention": ["weight", "diet"],
  --   "preferred_name": "Alex",
  --   "communication_style": "direct"
  -- }
);
```

### 12.4 Memory UI: Transparency & Control

Users should be able to see and manage what the companion "knows":

```
Settings → AI Companion → What I Know About You

┌─────────────────────────────────────────────┐
│ Things I've Learned                         │
│                                             │
│ 📋 Facts                                    │
│ • You work night shifts                  ✕  │
│ • You have two kids                      ✕  │
│ • You're training for a marathon         ✕  │
│                                             │
│ 🎯 Patterns I've Noticed                    │
│ • You're strongest on Tuesdays           ✕  │
│ • Week 2 of challenges is usually hard   ✕  │
│                                             │
│ 💬 Communication Preferences                │
│ • You prefer direct feedback             ✕  │
│ • You respond well to questions          ✕  │
│                                             │
│ [Clear All Memories]                        │
└─────────────────────────────────────────────┘
```

**Privacy principle:** User can delete any memory at any time. The companion should never make the user feel surveilled.

### 12.4 System Prompt Configuration

**Where users configure personality:**

```
Settings → AI Companion → Personality

┌─────────────────────────────────────────────┐
│ Choose a Companion Style                    │
│                                             │
│ ○ Warm Encourager (default)                 │
│   Gentle, celebrates small wins             │
│                                             │
│ ○ Direct Coach                              │
│   Honest, action-focused                    │
│                                             │
│ ○ Curious Friend                            │
│   Asks questions, reflective                │
│                                             │
│ ○ Quiet Supporter                           │
│   Minimal, speaks when meaningful           │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│ Custom Instructions (optional)              │
│ ┌─────────────────────────────────────────┐ │
│ │ Add any specific guidance for your      │ │
│ │ companion. Examples:                    │ │
│ │ - "Never mention my weight"             │ │
│ │ - "I prefer direct feedback"            │ │
│ │ - "Call me by my nickname: Alex"        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Save Changes]                              │
└─────────────────────────────────────────────┘
```

**How it becomes a system prompt:**

```javascript
const buildSystemPrompt = (config, userContext) => {
  const basePrompt = `You are a supportive companion in Path, a challenge-based habit tracker.
Your role is to notice, encourage, and occasionally guide—never to judge or shame.
Keep responses brief for ambient notes (1-2 sentences) and conversational for chat.`

  const personalityPrompt = PERSONALITY_PRESETS[config.preset]

  const customInstructions = config.customInstructions
    ? `\n\nUser's custom instructions:\n${config.customInstructions}`
    : ""

  const contextPrompt = `\n\nCurrent user context:\n${JSON.stringify(userContext, null, 2)}`

  return basePrompt + personalityPrompt + customInstructions + contextPrompt
}
```

### 12.5 Memory is NOT System Prompt

Important distinction:

| System Prompt               | Memory                             |
| --------------------------- | ---------------------------------- |
| Who the AI is               | What's been discussed              |
| Set once, rarely changes    | Updates every conversation         |
| Personality, rules, context | Past messages, learned preferences |
| Configured in settings      | Built automatically                |

Users configure the **system prompt** (personality).  
The app manages **memory** (conversation history) automatically.

### 12.6 Provider-Specific Optimizations

Even with client-side memory, leverage provider features for efficiency:

**OpenAI (Responses API):**

```javascript
// Use previous_response_id for conversation continuity
const response = await openai.responses.create({
  model: "gpt-4o",
  input: messages,
  previous_response_id: lastResponseId, // Server handles context
})
```

**Anthropic (Prompt Caching):**

```javascript
// Cache system prompt + user context
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  system: [
    {
      type: "text",
      text: systemPrompt + userContext,
      cache_control: { type: "ephemeral" }, // 5-min cache
    },
  ],
  messages: conversationHistory,
})
```

**xAI/Grok (OpenAI-Compatible + Built-in Caching):**

```javascript
// Grok uses OpenAI-compatible format with automatic caching
const response = await fetch("https://api.x.ai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "grok-4-fast", // $0.20/$0.50 per 1M tokens
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ],
  }),
})

// Grok automatically caches repeated prompts at $0.75/1M (75% off)
// Check response.usage.cached_tokens to monitor
```

**Google (Context Caching):**

```javascript
// Similar pattern, 1-hour cache default
```

---

## Appendix A: Personality Preset Prompts

### Warm Encourager

```
You are a warm, supportive presence in the user's habit-tracking journey. Your tone is gentle and affirming. You notice effort, not just results. You celebrate small wins genuinely. When the user struggles, you acknowledge the difficulty without minimizing it, and you never use guilt or shame as motivation. You speak in short, warm sentences. You use "I notice" and "I see" rather than making assumptions about feelings.
```

### Direct Coach

```
You are a straightforward, action-oriented companion. You respect the user's time with brevity. You focus on what's next rather than dwelling on what's past. When the user misses tasks, you acknowledge it simply and redirect to today. You ask focused questions. You don't over-celebrate—a nod of recognition is enough. Your tone is professional but not cold.
```

### Curious Friend

```
You are a thoughtful, inquisitive companion. You ask questions more than you make statements. You're genuinely curious about patterns and what's behind them. You help the user reflect without leading them to conclusions. You notice interesting correlations and wonder aloud about them. You're comfortable with silence and ambiguity.
```

### Quiet Supporter

```
You are a minimal, steady presence. You speak only when something meaningful needs to be said. A simple acknowledgment is often enough. You don't fill silence with words. When you do speak, it matters. You might go days without saying much, and that's fine. Your presence is felt more than heard.
```

---

## Appendix B: Example Ambient Notes by Context

### Challenge Header Examples

**Early in challenge (days 1-7):**

- "Day 3. Still finding your rhythm—that's normal."
- "First week. You've shown up 5 of 7 days so far."

**Mid-challenge (established):**

- "Day 18. Tuesday's your strongest day, and it's Tuesday."
- "Two weeks of morning pages. That's becoming a habit."

**Late challenge (final stretch):**

- "6 days left. You're at 78% overall—the home stretch."
- "Almost there. Whatever happens, you did 24 days."

**Challenge complete:**

- "30 days. You actually did it. How does that feel?"

### Task-Level Examples

**Untouched task:**

- "This one's been sitting for 4 days. Still relevant?"

**Strongest task:**

- "You haven't missed reading once. That one's solid."

**Struggling task:**

- "Exercise: 2 of last 7 days. What's getting in the way?"

### Return After Absence

**3-5 days:**

- "Welcome back. Ready when you are."

**1-2 weeks:**

- "Hey. It's been a while. No judgment—want to adjust the challenge or pick up where you left off?"

**Challenge expired during absence:**

- "The 30-day challenge ended while you were away. You made it to day 19. Want to start a new one, or reflect on what worked?"

---

_End of PRD_
