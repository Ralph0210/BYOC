# Path - Challenge Tracker Implementation Plan

A React + Tailwind webapp for managing time-bound challenges with customizable tasks, calendar visualization, and rewards.

## Technology Stack

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Framework | Vite + React 18               |
| Styling   | TailwindCSS 3.4               |
| Icons     | Lucide React                  |
| Database  | Supabase (PostgreSQL)         |
| State     | React Context + custom hooks  |
| Theme     | System preference with toggle |

---

## Supabase Database Schema

### [NEW] SQL Migration

```sql
-- Challenges table
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  duration_days INTEGER,
  reward_text TEXT,
  reward_link TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#007AFF',
  frequency_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'specific_days'
  frequency_count INTEGER DEFAULT 1, -- times per day/week
  frequency_days INTEGER[] DEFAULT '{}', -- [0,1,2,3,4,5,6] for specific days (0=Sun)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task completions table
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Index for fast calendar queries
CREATE INDEX idx_completions_date ON task_completions(date);
CREATE INDEX idx_completions_task_date ON task_completions(task_id, date);

-- RLS Policies (single user, anon access)
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for challenges" ON challenges FOR ALL USING (true);
CREATE POLICY "Allow all for tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for task_completions" ON task_completions FOR ALL USING (true);
```

---

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI primitives
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── IconPicker.jsx
│   │   ├── ColorPicker.jsx
│   │   ├── Modal.jsx
│   │   └── Toggle.jsx
│   ├── challenge/             # Challenge-related components
│   │   ├── ChallengeCard.jsx
│   │   ├── ChallengeForm.jsx
│   │   ├── ChallengeSummary.jsx
│   │   └── RewardDisplay.jsx
│   ├── task/                  # Task-related components
│   │   ├── TaskItem.jsx
│   │   ├── TaskForm.jsx
│   │   ├── TaskProgress.jsx
│   │   └── FrequencySelector.jsx
│   ├── calendar/              # Calendar visualization
│   │   ├── CalendarGrid.jsx
│   │   ├── CalendarCell.jsx
│   │   └── CalendarTooltip.jsx
│   └── layout/                # Layout components
│       ├── Header.jsx
│       ├── ThemeToggle.jsx
│       └── Container.jsx
├── hooks/                     # Custom React hooks
│   ├── useChallenges.js
│   ├── useTasks.js
│   ├── useCompletions.js
│   └── useTheme.js
├── lib/                       # Utilities
│   ├── supabase.js
│   ├── constants.js           # Colors, icons list
│   └── utils.js               # Date helpers, etc.
├── context/
│   └── AppContext.jsx
├── App.jsx
├── main.jsx
└── index.css                  # Tailwind + custom styles
```

---

## Proposed Changes

### Core Setup

#### [NEW] [package.json](file:///Users/ralph/Desktop/todolist/package.json)

Vite React project with dependencies: `react`, `react-dom`, `@supabase/supabase-js`, `lucide-react`, `tailwindcss`

#### [NEW] [vite.config.js](file:///Users/ralph/Desktop/todolist/vite.config.js)

Standard Vite React configuration

#### [NEW] [tailwind.config.js](file:///Users/ralph/Desktop/todolist/tailwind.config.js)

Custom theme with Apple-like design tokens

#### [NEW] [src/index.css](file:///Users/ralph/Desktop/todolist/src/index.css)

Tailwind base + custom CSS variables for theming

---

### Database & API Layer

#### [NEW] [src/lib/supabase.js](file:///Users/ralph/Desktop/todolist/src/lib/supabase.js)

Supabase client initialization with environment variables

#### [NEW] [src/lib/constants.js](file:///Users/ralph/Desktop/todolist/src/lib/constants.js)

- 12 curated Apple-like colors with hex values
- 24 commonly-used Lucide icon names for task icons
- Frequency type definitions

---

### Custom Hooks

#### [NEW] [src/hooks/useChallenges.js](file:///Users/ralph/Desktop/todolist/src/hooks/useChallenges.js)

- `fetchChallenges()` - Get all active/archived challenges
- `createChallenge(data)` - Create new challenge
- `updateChallenge(id, data)` - Update challenge details
- `deleteChallenge(id)` - Delete challenge and cascade tasks
- `archiveChallenge(id)` - Mark as archived
- `extendChallenge(id, days)` - Extend end date

#### [NEW] [src/hooks/useTasks.js](file:///Users/ralph/Desktop/todolist/src/hooks/useTasks.js)

- `fetchTasks(challengeId)` - Get tasks for a challenge
- `createTask(data)` - Create new task
- `updateTask(id, data)` - Update task details
- `deleteTask(id)` - Delete task and completions
- `reorderTasks(orderedIds)` - Update sort order

#### [NEW] [src/hooks/useCompletions.js](file:///Users/ralph/Desktop/todolist/src/hooks/useCompletions.js)

- `fetchCompletions(taskId, startDate, endDate)` - Get completions
- `addCompletion(taskId, date)` - Mark task complete
- `removeCompletion(taskId, date)` - Undo completion
- `getCompletionsByDate(date)` - All completions for a day

---

### UI Components

#### [NEW] [src/components/ui/Button.jsx](file:///Users/ralph/Desktop/todolist/src/components/ui/Button.jsx)

Variants: `primary`, `secondary`, `ghost`, `danger`

#### [NEW] [src/components/ui/Card.jsx](file:///Users/ralph/Desktop/todolist/src/components/ui/Card.jsx)

Elevated surface with rounded corners, hover states

#### [NEW] [src/components/ui/Modal.jsx](file:///Users/ralph/Desktop/todolist/src/components/ui/Modal.jsx)

Bottom sheet on mobile, centered modal on desktop

#### [NEW] [src/components/ui/IconPicker.jsx](file:///Users/ralph/Desktop/todolist/src/components/ui/IconPicker.jsx)

Grid of Lucide icons with search

#### [NEW] [src/components/ui/ColorPicker.jsx](file:///Users/ralph/Desktop/todolist/src/components/ui/ColorPicker.jsx)

Grid of 12 curated colors with selection indicator

---

### Challenge Components

#### [NEW] [src/components/challenge/ChallengeCard.jsx](file:///Users/ralph/Desktop/todolist/src/components/challenge/ChallengeCard.jsx)

- Challenge name, description preview
- Progress bar (days elapsed)
- Reward preview badge
- Edit/delete actions

#### [NEW] [src/components/challenge/ChallengeForm.jsx](file:///Users/ralph/Desktop/todolist/src/components/challenge/ChallengeForm.jsx)

- Name, description inputs
- Duration selector (date range OR days count)
- Reward text + optional link
- Create/update/cancel buttons

#### [NEW] [src/components/challenge/ChallengeSummary.jsx](file:///Users/ralph/Desktop/todolist/src/components/challenge/ChallengeSummary.jsx)

- Completion statistics per task
- Calendar heat map for the challenge period
- Reward display with link button
- Archive/Extend actions

---

### Task Components

#### [NEW] [src/components/task/TaskItem.jsx](file:///Users/ralph/Desktop/todolist/src/components/task/TaskItem.jsx)

- Icon + colored indicator
- Task name
- Completion ring (for multi-count)
- Tap to complete with animation

#### [NEW] [src/components/task/TaskForm.jsx](file:///Users/ralph/Desktop/todolist/src/components/task/TaskForm.jsx)

- Name, description
- Icon picker
- Color picker
- Frequency selector

#### [NEW] [src/components/task/FrequencySelector.jsx](file:///Users/ralph/Desktop/todolist/src/components/task/FrequencySelector.jsx)

- Daily / Weekly / Specific days tabs
- Count picker for multi-times
- Day pills (M T W T F S S)

---

### Calendar Components

#### [NEW] [src/components/calendar/CalendarGrid.jsx](file:///Users/ralph/Desktop/todolist/src/components/calendar/CalendarGrid.jsx)

- GitHub-style scrollable grid
- Weeks as rows, days as columns
- Month labels on scroll

#### [NEW] [src/components/calendar/CalendarCell.jsx](file:///Users/ralph/Desktop/todolist/src/components/calendar/CalendarCell.jsx)

- Colored dots for each completed task
- Intensity based on completion percentage
- Click to view day detail

---

### Main App

#### [NEW] [src/App.jsx](file:///Users/ralph/Desktop/todolist/src/App.jsx)

- Router: Home (today view), Challenge detail, Calendar
- Theme provider
- App context provider

#### [NEW] [src/main.jsx](file:///Users/ralph/Desktop/todolist/src/main.jsx)

React entry point

---

## Design System

### Colors

```javascript
const COLORS = {
  blue: "#007AFF", // Primary
  green: "#34C759",
  orange: "#FF9500",
  red: "#FF3B30",
  purple: "#AF52DE",
  pink: "#FF2D55",
  teal: "#5AC8FA",
  indigo: "#5856D6",
  yellow: "#FFCC00",
  mint: "#00C7BE",
  brown: "#A2845E",
  gray: "#8E8E93",
}
```

### Typography

```css
font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
```

### Spacing Scale

```javascript
// Tailwind defaults: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

---

## User Review Required

> [!IMPORTANT]
> The Supabase connection requires your project URL and anon key. Please provide these before implementation begins:
>
> - `VITE_SUPABASE_URL`
> - `VITE_SUPABASE_ANON_KEY`

> [!NOTE]
> This is a single-user app without authentication. All data is accessible to anyone with the anon key. If you need multi-user support in the future, we'll add Supabase Auth.

---

## Phase 2: PRD Alignment & Refinement (Current)

### Local Testing Fix

- [ ] **Action Required (User)**: Add `http://localhost:5173` (or your port) to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs.
- [ ] Verify `useAuth` uses `window.location.origin` (Confirmed).

### Component Architecture Alignment

Refactor codebase to strictly match PRD Section 4.4 structure:

#### 1. Component Renaming & Extraction

- [ ] **Rename** `ChatPanel.jsx` → `ConversationPanel.jsx`
- [ ] **Rename** `useAmbientNote.js` → `useAmbientNotes.js`
- [ ] **Extract** `PersonalityPicker.jsx` from `AIConfigForm.jsx`
- [ ] **Create** `lib/ai/providers.js` and move provider constants/logic there.
- [ ] **Create** `lib/encryption.js` (Stub/Basic implementation for future security).

#### 2. Hook Separation

- [ ] **Split** `useAI.js` logic:
  - `useAI.js`: Core API calling primitive.
  - `useConversation.js`: State management, persistence, history.

#### 3. Verification

- [ ] Verify all PRD components exist and are implemented.

## Verification Plan

### Automated Tests

No existing tests in this new project. Once implementation is complete, I will:

1. **Browser Testing via Subagent**:
   - Create a challenge with tasks
   - Complete tasks and verify calendar updates
   - Edit/delete challenges and tasks
   - Test theme toggle
   - Test challenge completion flow

### Manual Verification

1. **Run dev server**: `npm run dev`
2. **Test CRUD operations**:
   - Create a new challenge
   - Add tasks with different frequencies
   - Mark tasks complete
   - Edit task icon/color
   - Delete a task
3. **Test calendar**:
   - Complete tasks on different days
   - Scroll through calendar history
   - Verify colored dots appear correctly
4. **Test challenge lifecycle**:
   - Complete a challenge
   - View summary screen
   - Archive or extend the challenge
5. **Test theme**:
   - Toggle light/dark mode
   - Verify system preference

---

## AI Companion Phase 1 (MVP) Implementation Plan

### 1. Database Schema (Supabase)

#### [NEW] `supabase/migrations/timestamp_ai_companion.sql`

```sql
-- User AI configuration
CREATE TABLE ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai',
  api_key TEXT, -- Encrypted via code before storage, or plain with RLS if no key management key available
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  personality_preset TEXT DEFAULT 'warm_encourager',
  personality_customizations JSONB DEFAULT '{}',
  custom_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Conversation history
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI config" ON ai_config
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Core Logic

#### [NEW] `src/lib/ai/client.js`

- `callAI(messages, config)`: Abstraction for API calls. Supports OpenAI SDK (and Grok via baseURL).

#### [NEW] `src/lib/ai/prompts.js`

- `buildSystemPrompt(config, context)`: Assembles the personality and context.

#### [NEW] `src/hooks/useAI.js`

- `useAI(challengeId)`: Hook to manage chat state, sending messages, and loading states.
- `useAmbientNote(context)`: Hook to generating one-off ambient notes.

#### [NEW] `src/hooks/useAIConfig.js`

- CRUD for `ai_config` table.

### 3. UI Components

#### [NEW] `src/components/ai/AIConfigForm.jsx`

- Form for "Bring Your Own Key".
- Fields: Provider (OpenAI/Grok), API Key, Model.
- "Test Connection" button.

#### [NEW] `src/components/ai/AmbientNote.jsx`

- Component to render small, contextual text in the header.
- Uses `useAmbientNote` to fetch content.

#### [NEW] `src/components/ai/ChatPanel.jsx`

- Slide-over or modal for the full conversation.
- Displays message history and input.

### 4. Integration Points

#### `src/App.jsx`

- Add `<ChatPanel />` (globally or per challenge).
- Add `<AmbientNote />` to Challenge Header.

#### `src/components/layout/Header.jsx`

- Add "Settings" or "AI" button to open Config.

### 5. Future AI Phases (Roadmap)

#### Phase 2: Personality & Customization

- [ ] **Extract PersonalityPicker**: Separate component for selection.
- [ ] Implement all 4 personality presets (Warm Encourager, Direct Coach, Curious Friend, Quiet Supporter).
- [ ] Add Customization Sliders (Tone, Verbosity).
- [ ] Add "Companion Naming".

#### Phase 3: Full Ambient Presence

- [ ] **Presence Locations (PRD 3.3.1)**:
  - [ ] **Task List**: Contextual note below specific tasks.
  - [ ] **Daily Summary**: End-of-day reflection.
  - [ ] **Calendar View**: "Perfect day" annotation.
  - [ ] **Empty State**: Encouragement when no tasks exist.
  - [ ] **Return After Absence**: "Welcome back" logic (3+ days inactivity).
- [ ] **Caching Layer**: `ai_ambient_cache` table usage.
- [ ] **Batch Generation**: Generate all context notes on app open.

#### Phase 4: Providers & Insights

- [ ] Add Anthropic (Claude) & Google (Gemini) providers.
- [ ] Implement Pattern Detection (Trends, correlations).
- [ ] "Show AI Context" transparency modal.
