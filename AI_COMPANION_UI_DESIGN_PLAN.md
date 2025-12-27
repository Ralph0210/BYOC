# AI Companion UI Design Plan (High Priority)

Refining the AI Companion integration to feel premium, ambient, and deeply integrated into the todo list experience.

---

## Executive Summary

This design plan focuses on making the AI companion **visually prominent** when enabled. The goal is a simple UI update that transforms the companion from a hidden feature to a visible, accessible presence.

**Core Goal:** When AI is enabled, the companion should be immediately visible and accessible throughout the interface.

### Key Principle: Enhance, Don't Duplicate

After reviewing the codebase, this plan focuses on **enhancing existing features** rather than creating duplicates:

- ✅ **Memory Viewer** exists → Keep as-is (already accessible)
- ✅ **Suggested Prompts** exist → Keep as-is (already working)
- ✅ **Conversation Panel** exists → Keep as-is (already functional)
- 🆕 **New features**: Companion Insight Cards (Ambient Focus)

### Implementation Principles

**Act as a Principal Frontend Developer** - Focus on:

1.  **Simplicity**: Minimal code changes, reuse existing components, avoid over-engineering
2.  **Refactorability**: Clean component structure, easy to modify/extend later
3.  **Consistency**: Follow existing design system, match current patterns
4.  **Quality**: Type-safe, performant, accessible, well-tested

### Priority Summary

**🔴 High Priority (Phase 1 - Implement First):**

- Companion Insight Cards (Primary Focus)
- Enhanced Ambient Notes
- Native Contextual Interactions

**🟡 Medium Priority (Phase 2 - Can Add Later):**

- Disclosure Badges
- Conversation Panel Enhancements
- Collapse/Dismiss Functionality

**🟢 Low Priority (Future - Nice to Have):**

- Example Gallery
- Inline Actions
- Footprint Viewer
- Welcome Screen

---

## Design Philosophy

### Core Principles

1.  **Presence, Not Intrusion**: The companion should feel present and accessible, but never block or interrupt core workflows
2.  **Visual Prominence**: When AI is enabled, companion is immediately visible and accessible
3.  **Simplicity**: Minimal changes, maximum impact - focus on visibility, not complexity
4.  **Consistency**: Follow existing design system and patterns
5.  **Progressive Enhancement**: Build on what exists, don't rebuild

### Design Metaphor

Think of the companion as a **co-pilot** rather than a chatbot:

- Always visible in the corner of your eye
- Ready to help when you need it
- Observes and comments, but doesn't control
- Has a "face" and personality, not just text

---

## Current State Analysis

### What Works

- ✅ Ambient notes provide contextual encouragement
- ✅ Conversation panel is functional when accessed
- ✅ Clean, minimal aesthetic
- ✅ Non-intrusive for users without AI
- ✅ **Memory Viewer** already implemented (in AIConfigForm)
- ✅ **Suggested Prompts** already implemented (context-aware)
- ✅ **Personality Picker** already implemented
- ✅ **AI Context system** already implemented (useAIContext hook)
- ✅ **Conversation history** already persists

### 2. Contextual Interaction

- **No Floating Button**: Interaction should feel native and part of the flow, not a floating overlay.
- **Task Notes**: Keep existing task notes as-is. The AI companion should not overwrite or interfere with user-written notes.

### What's Missing (High Priority)

- ❌ No persistent companion presence in main UI
- ❌ Companion feels hidden (buried in menu)
- ❌ No visual identity/avatar in main UI
- ❌ Ambient notes are too subtle
- ❌ No quick access to conversation
- ❌ Companion feels like a feature, not a presence

---

## Proposed Design System

### Mode Detection

```javascript
// Pseudo-code
const hasAICompanion = config?.api_key && config?.personality_preset
const companionMode = hasAICompanion ? "prominent" : "minimal"
```

**Two distinct layouts:**

- **Minimal Mode** (no AI): Current clean interface
- **Companion Mode** (AI enabled): Enhanced with companion presence

---

## Design System Compliance

All new components must follow Path's existing design system:

### Color System

- **Primary**: `#007AFF` (primary-500)
- **Surface**: `bg-white dark:bg-surface-dark` (light: #FFFFFF, dark: #1C1C1E)
- **Text Hierarchy**:
  - Primary: `text-primary` (black/white 0.87)
  - Secondary: `text-secondary` (gray/white 0.6)
  - Tertiary: `text-tertiary` (gray/white 0.38)
- **Gradients**: Use `from-primary/5 to-purple-500/5` for subtle overlays
- **Borders**: `border-app` (light: #E5E5EA, dark: #38383A)

### Typography

- **Font**: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", sans-serif`
- **Sizes**: `text-xs` (10px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px)
- **Weights**: `font-medium`, `font-semibold`, `font-bold`

### Spacing

- **Padding**: `p-3` (sm), `p-4` (md), `p-6` (lg)
- **Gaps**: `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)
- **Margins**: Follow Tailwind scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

### Border Radius

- **Buttons**: `rounded-xl` (12px)
- **Cards**: `rounded-2xl` (16px)
- **Modals**: `rounded-t-3xl sm:rounded-2xl` (24px mobile, 16px desktop)
- **Avatars**: `rounded-full`

### Shadows

- **Cards**: `shadow-card` (0 2px 8px rgba(0, 0, 0, 0.08))
- **Hover**: `shadow-card-hover` (0 4px 16px rgba(0, 0, 0, 0.12))
- **Modals**: `shadow-modal` (0 8px 32px rgba(0, 0, 0, 0.16))

### Animations

- **Entrance**: `animate-scale-in` (0.15s), `animate-fade-in` (0.2s), `animate-slide-up` (0.3s)
- **Transitions**: `transition-all duration-150` (default), `duration-200`, `duration-300`
- **Hover**: `hover:bg-gray-100 dark:hover:bg-gray-800`

### Component Patterns

- **Buttons**: Use existing `Button` component with variants (primary, secondary, ghost, danger)
- **Cards**: Use existing `Card` component with padding prop (none, sm, md, lg)
- **Modals**: Use existing `Modal` component with size prop (sm, md, lg, xl, full)

---

### 1. Ambient Companion Insights (Primary Focus)

Instead of a separate chat interface or floating elements, the companion "speaks" through ambient insight cards.

- **Companion Insight Cards**:

  - Placed strategically (e.g., top of active list or sidebar).
  - Contains richer context, roughly 2-3 sentences based on the user's personality settings and current task load.
  - Examples: "You've been crushing your morning routine! Maybe save the heavy coding for when your energy peaks at 2 PM?" or "I noticed you usually clear these admin tasks faster with some Lo-Fi—should I set the mood?"
  - Style: Subtle glassmorphism, soft gradients matching the companion's "vibe".

- **No Floating Button**: Interaction should feel native and part of the flow, not a floating overlay.
- **Task Notes**: Keep existing task notes as-is. The AI companion should not overwrite or interfere with user-written notes.

**Goal**: Make companion immediately visible and helpful when AI is enabled

### 🟡 Medium Priority (Phase 2 - Enhance Interactions)

5. **Disclosure Badges** - Mark AI content clearly
6. **Improved Conversation Panel** - Better empty state, more prominent suggestions
7. **Collapse/Dismiss Functionality** - User control over visibility

**Goal**: Improve discoverability and user control

### 🟢 Low Priority (Future Enhancements)

8. **Example Gallery** - Show sample conversations (nice-to-have)
9. **Inline Actions** - Contextual AI menus (can add later)
10. **Footprint Viewer** - Show what AI sees (advanced feature)
11. **Welcome Screen** - First-time onboarding (can be simple tooltip)

**Goal**: Advanced features that can be added incrementally

---

## Component-Level Changes

---

---

### 2. Challenge Card Redesign

**Current:** Ambient note is small italic text below challenge name

**Proposed:** Companion insight card above challenge content

```
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ │
│ │ ✨ Alex                                    │ │
│ │ "Day 12. You've found your groove this     │ │
│ │  week. Three perfect days in a row."       │ │
│ │ [Tap to chat about this challenge]         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Morning Routine Challenge                       │
│ 3 tasks • Dec 1 → Dec 31 • 12d left            │
│ 78% complete                                 │
└─────────────────────────────────────────────────┘
```

**Design Specs (Following Design System):**

- **Card Style**: Use existing `Card` component with `padding="md"` (p-4)
- **Background**: `bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10`
- **Border Radius**: `rounded-2xl` (16px) to match Card component
- **Spacing**: `p-4 gap-3` (16px padding, 12px gap between avatar and text)
- **Avatar**: `w-8 h-8 rounded-full` (32px circle, smaller than header)
- **Text** (Design System):
  - Name: `text-xs font-semibold text-primary` (12px semibold)
  - Note: `text-sm text-secondary` (14px regular), 2-3 lines max with `line-clamp-3`
  - CTA: `text-xs text-primary hover:underline` (12px link text) or icon
- **Shadow**: `shadow-card` (matches Card component)
- **Interaction**:
  - Tap card → Open conversation panel with challenge context
  - Swipe left → Dismiss for this session (doesn't affect other challenges)
- **Position**: Above challenge header, before expandable content

**Collapsed State** (optional):

- If user dismisses, show minimal version: just avatar + 1-line note
- Can re-expand by tapping

---

---

---

### 4. Enhanced Ambient Notes

**Current:** Small italic text, easy to miss

**Proposed:** Card-based notes with visual weight

**In Challenge Cards (Design System Compliant):**

- Use `Card` component with `padding="md"`
- Background: `bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10`
- Avatar: `w-8 h-8 rounded-full` (32px)
- Text: `text-sm text-secondary` (14px), 2-3 lines with `line-clamp-3`
- CTA: Use `Button` component `variant="ghost" size="sm"`

**In Task Lists (Design System Compliant):**

- Keep current subtle style: `text-xs text-tertiary italic` (12px)
- Add companion avatar icon: `w-4 h-4` (16px) next to sparkle
- Slightly larger text: `text-sm` (14px) instead of `text-xs` (12px)
- Spacing: `gap-1.5` (6px) between icon and text

**Empty States (Design System Compliant):**

- Use `Card` component with `padding="lg"` (p-6)
- Full-width: `w-full`
- Avatar: `w-16 h-16 rounded-full` (64px, prominently displayed)
- Action button: Use `Button` component `variant="primary" size="md"`

---

### 5. Conversation Panel Improvements

**Current:** Slide-over panel, only opens on explicit action

**Proposed:** Enhanced panel with persistent presence + wayfinding

**Panel Enhancements:**

- **Header**: Larger, more prominent (as current)
- **Quick Actions**:
  - Pin to side (desktop): Keep panel open, main content adjusts
  - Minimize to chat bubble: Collapse to small floating button
  - **Footprint View**: Toggle to see what AI sees (context summary)
- **Context Indicators**:
  - Show which challenge you're discussing
  - Display relevant stats inline
  - **Context Badge**: Shows data sources (challenges, tasks, completions)
- **Smart Suggestions** (Wayfinders pattern):
  - **Example Gallery**: Show sample conversations when empty
  - **Templates**: Pre-filled conversation starters based on context
  - **Suggestions**: Context-aware prompt suggestions (more prominent)
  - **Follow up**: AI asks clarifying questions when prompt is unclear
- **Trust Features** (Governors pattern):
  - **Action Plan**: Show what AI will do before generating response (optional)
  - **Footprints**: Button to see AI's context and reasoning
  - **Disclosure**: Clear "AI-generated" marking on responses
  - **Memory Control**: Link to view/manage what AI remembers

**First-Time User Experience** (Wayfinders):

- **Initial CTA**: Large, welcoming input: "Ask me anything about your challenges..."
- **Example Gallery**: Show 3-4 sample conversations (NEW - not yet implemented)
- **Nudges**: Gentle tooltips explaining features
- **Enhance existing Suggested Prompts** (already implemented via `getSuggestedPrompts`):
  - Make suggestions more prominent when conversation is empty
  - Add template-style pre-filled prompts (enhancement of current context-aware suggestions)
  - Add categories: "Progress", "Reflection", "Planning", "Encouragement"
  - Show example conversations alongside suggestions

**New: Minimized State (Design System Compliant)**

- Size: `w-16 h-16 rounded-full` (64px circle) with companion avatar
- Background: `bg-gradient-to-br from-primary-500 to-purple-500`
- Shadow: `shadow-lg shadow-primary-500/30` (matches floating button pattern)
- Badge: `w-3 h-3 bg-red-500 rounded-full` shows unread indicator
- Tap to expand: `active:scale-95` transition
- Position: `fixed bottom-20 right-6` (above create button at bottom-6)
- Animation: `animate-scale-in` on mount

---

### 6. Companion Identity System (Identifiers Pattern)

**Visual Identity (Design System Compliant):**

- **Avatar**:
  - Default: `bg-gradient-to-br from-primary-500 to-purple-500 rounded-full` with sparkle icon
  - Custom: User-uploaded photo (from config), `rounded-full object-cover`
  - Size variants (Design System):
    - Inline: `w-4 h-4` (16px)
    - Cards: `w-8 h-8` (32px)
    - Header: `w-10 h-10` (40px)
    - Button: `w-14 h-14` (56px)
- **Name Display**:
  - Always show companion name when present
  - Format: Sparkle icon + name or just name with sparkle icon
  - Typography: `text-sm font-semibold text-primary` (14px semibold)
- **Color System (Design System)**:
  - Primary accent: `from-primary-500 to-purple-500` gradient
  - Background: `from-primary/5 to-purple-500/5` (subtle gradient overlays)
  - Borders: `border-primary/10` (primary/purple tint)
- **Iconography** (per shapeof.ai, Design System):
  - Consistent sparkle icon: `Sparkles` from lucide-react, `text-primary`
  - Distinct icon for footprint: `Eye` from lucide-react, `text-secondary`
  - AI disclosure badge: Small "AI" text with `text-xs text-tertiary` or icon
- **Personality Indicators** (Design System):
  - Visual cues that match personality preset
  - Warm Encourager: Softer colors (`opacity-80`), `rounded-2xl` (more rounded)
  - Direct Coach: Sharper edges (`rounded-xl`), higher contrast
  - Curious Friend: Playful animations (`animate-bounce` on hover)
  - Quiet Supporter: Minimal, subtle presence (`opacity-60`)

### 7. Disclosure System (Medium Priority)

**Simple AI Badges:**

- Add small "AI" badge to ambient notes: `text-[10px] text-tertiary`
- Mark conversation responses: Subtle "AI-generated" text at bottom
- Use consistent `Sparkles` icon from lucide-react
- Keep it minimal - just enough to be clear

**Design Specs (Design System Compliant):**

- Badge: `px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]`
- Icon: `Sparkles` from lucide-react, `w-3 h-3 text-primary`
- Position: Top-right corner of ambient notes, bottom of conversation messages

---

## Layout Comparison

### Minimal Mode (No AI)

```
┌─────────────────────────────────┐
│ Path          [Theme] [User]    │
│ Dec 26                         │
├─────────────────────────────────┤
│                                 │
│ [Challenge Cards]               │
│                                 │
│                                 │
│                            [+]  │
└─────────────────────────────────┘
```

### Companion Mode (AI Enabled)

```
┌─────────────────────────────────┐
│ Path          [Theme] [User]    │
│ Dec 26                         │
│ ─────────────────────────────── │
│ ✨ Alex • "Day 12. You've..."   │
│    [Chat]                       │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✨ Alex                     │ │
│ │ "Day 12. You've found..."   │ │
│ │ [Talk about this]          │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Challenge Content]             │
│                                 │
│                            [+]  │
│ [✨]                            │
└─────────────────────────────────┘
```

---

## Interaction Patterns

### Primary Interactions

1. **Quick Chat Access**

   - Tap companion bar in header → Open conversation
   - Tap companion card on challenge → Open conversation with context
   - Tap floating companion button → Open conversation
   - Long press companion button → Quick actions menu

2. **Contextual Awareness**

   - Companion card on challenge shows challenge-specific insights
   - Conversation panel remembers which challenge you're viewing
   - Ambient notes update based on recent activity

3. **Progressive Disclosure**
   - Header bar: Always visible, shows current note
   - Challenge cards: Expandable companion insight
   - Floating button: Quick access, always available
   - Conversation panel: Full interaction, on-demand

### Gestures (Mobile)

- **Swipe down** on companion bar → Collapse to minimal
- **Swipe left** on companion card → Dismiss for session
- **Long press** companion button → Quick actions
- **Swipe right** on conversation panel → Pin to side (desktop)

---

## Responsive Behavior

### Mobile (< 640px)

- Companion bar: Single line, avatar + note (truncated)
- Challenge cards: Companion card full-width above challenge
- Floating buttons: Stack vertically if needed
- Conversation panel: Full-screen overlay

### Tablet (640px - 1024px)

- Companion bar: Two lines, full note visible
- Challenge cards: Companion card side-by-side with challenge header
- Conversation panel: Slide-over, 400px width

### Desktop (> 1024px)

- Companion bar: Full two-line layout
- Challenge cards: Companion card integrated into challenge header
- Conversation panel: Can be pinned, main content adjusts
- Floating button: Optional (can rely on header/panel)

---

## Animation & Transitions

### Entrance Animations (Design System Compliant)

- **Companion bar**: `animate-slide-up` (0.3s ease-out) - matches design system
- **Companion cards**: `animate-fade-in` + `animate-slide-up` (0.2s ease-out) - matches design system
- **Floating button**: `animate-scale-in` (0.15s ease-out) - matches design system
- **Conversation panel**: Custom slide-in from right (300ms ease-out) - use `transition-transform duration-300`

### State Transitions (Design System Compliant)

- **Note updates**: `animate-pulse` on companion avatar (2s) - matches design system
- **New message**: Badge appears with `animate-scale-in` (0.15s) - matches design system
- **Panel minimize**: Collapse to bubble `transition-all duration-250` (250ms)
- **Card dismiss**: `animate-fade-out` + slide out (200ms) - matches design system timing

### Micro-interactions (Design System Compliant)

- **Avatar hover**: `hover:scale-105 transition-transform` (1.05x) - matches existing patterns
- **Button press**: `active:scale-95` (0.95x) - matches Button component
- **Card tap**: `hover:shadow-card-hover` (shadow increase) - matches Card component
- **All interactions**: Use `transition-all duration-150` - matches design system

---

## Accessibility

### Screen Readers

- Companion elements have proper ARIA labels
- "Companion [Name] says: [Note]"
- "Tap to chat with companion"
- Conversation panel: Proper heading hierarchy

### Keyboard Navigation

- Tab through companion elements
- Enter/Space to activate
- Escape to close conversation panel

### Visual

- High contrast for companion text
- Clear focus states
- Sufficient touch targets (44px minimum)

---

## Implementation Phases

### Phase 1: High Priority - Make Companion Prominent ⚡

**Goal**: Make companion immediately visible when AI is enabled

1. **Companion Mode Detection**

   - Add simple check: `config?.api_key && config?.personality_preset`
   - Create `useCompanionMode()` hook for clean access

2. **Companion Header Bar**

   - Create `CompanionBar` component
   - Insert into `Header.jsx` when AI enabled
   - Shows: Avatar, name, current ambient note, chat button
   - Collapsible (remembers preference in localStorage)

3. **Companion Insight Cards**

   - Create `CompanionInsightCard` component
   - Add above each challenge card in `App.jsx`
   - Shows: Challenge-specific ambient note
   - Dismissible per session (localStorage)

4. **Floating Companion Button**

   - Add to `App.jsx` alongside create button
   - Bottom-left position (opposite of create button)
   - Opens conversation panel
   - Shows badge when new note available

5. **Enhanced Ambient Notes**
   - Make existing notes more prominent (card-based)
   - Add disclosure badge (small "AI" indicator)
   - Keep existing functionality, just improve visibility

**Estimated Time**: 1-2 weeks

---

### Phase 2: Medium Priority - Enhance Interactions

**Goal**: Improve discoverability and user control

1. **Disclosure System**

   - Add "AI" badges to all ambient notes
   - Mark conversation responses as AI-generated
   - Simple, consistent iconography

2. **Conversation Panel Improvements**

   - Make existing suggested prompts more prominent
   - Better empty state (show existing suggestions prominently)
   - Add collapse/minimize functionality

3. **User Controls**
   - Companion bar collapse/expand
   - Companion card dismiss (session-only)
   - Remember preferences in localStorage

**Estimated Time**: 1 week (can be done incrementally)

---

### Phase 3: Low Priority - Future Enhancements

**Goal**: Advanced features for later

- Example gallery (if needed)
- Inline actions (if needed)
- Footprint viewer (if needed)
- Welcome screen (simple tooltip is fine)

**Estimated Time**: As needed

---

## Implementation Guidelines

### Code Quality Principles

**Act as a Principal Frontend Developer** - Focus on:

#### 1. Simplicity

- **Minimal changes**: Only modify what's necessary
- **Reuse components**: Use existing `Button`, `Card`, `Modal` components
- **Avoid over-engineering**: Start simple, enhance later if needed
- **Clear intent**: Code should be self-documenting

#### 2. Refactorability

- **Component structure**: Small, focused components
- **Separation of concerns**: UI components, hooks, utilities
- **Easy to modify**: Changes should be localized
- **Extensible**: Easy to add features later

#### 3. Consistency

- **Follow existing patterns**: Match current code style
- **Use design system**: Follow Tailwind config and CSS variables
- **Naming conventions**: Match existing component/hook naming
- **File structure**: Follow existing folder organization

#### 4. Quality

- **Type safety**: Use proper TypeScript/PropTypes if applicable
- **Performance**: Avoid unnecessary re-renders
- **Accessibility**: ARIA labels, keyboard navigation
- **Error handling**: Graceful degradation if AI fails
- **Testing**: Test critical paths (can add tests incrementally)

### Implementation Checklist

Before starting:

- [ ] Review existing component patterns (`Button`, `Card`, `Modal`)
- [ ] Understand current design system (colors, spacing, typography)
- [ ] Check existing hooks (`useAIConfig`, `useAmbientNotes`)
- [ ] Plan component structure (where to place new components)

During implementation:

- [ ] Use existing components where possible
- [ ] Follow design system tokens (no magic numbers)
- [ ] Add proper error boundaries
- [ ] Handle loading/error states
- [ ] Test in both light and dark mode
- [ ] Test responsive behavior (mobile, tablet, desktop)

After implementation:

- [ ] Code review (check for consistency)
- [ ] Performance check (no unnecessary re-renders)
- [ ] Accessibility audit (keyboard nav, screen readers)
- [ ] Visual QA (matches design system)

---

## Success Metrics

### Primary (Phase 1)

- **Visibility**: % of AI users who see companion elements on app open
- **Engagement**: % of AI users who interact with companion daily
- **Accessibility**: Time to first companion interaction

### Secondary (Phase 2+)

- Ambient note click-through rate
- Companion card interaction rate
- User feedback on prominence

### Technical

- Page load time impact (< 100ms)
- Animation performance (60fps)
- No regression in existing features

---

## Open Questions for Review

1. **Companion Bar Persistence**: Should it always be visible, or can users collapse it permanently?

2. **Challenge Card Integration**: Should companion card be above challenge (separate) or integrated into challenge header?

3. **Floating Button Priority**: Should companion button be more prominent than create button, or equal?

4. **Note Frequency**: How often should ambient notes refresh? On every completion? Every hour? Daily?

5. **Dismissal Behavior**: When user dismisses companion card, should it:

   - Dismiss for this session only?
   - Dismiss for this challenge only?
   - Remember preference globally?

6. **Mobile Layout**: On small screens, should companion bar be:

   - Always visible (takes space)?
   - Collapsible (tap to expand)?
   - Hidden, rely on floating button?

7. **Desktop Experience**: Should conversation panel be:

   - Always slide-over?
   - Pinnable to side?
   - Both (user choice)?

8. **Wayfinding Intensity**: How prominent should first-time user guidance be?

   - Full welcome screen?
   - Subtle tooltips?
   - Both (progressive)?

9. **Transparency Level**: How much should we show about AI's context?

   - Full footprint view always available?
   - Optional advanced view?
   - Minimal (just disclosure badges)?

10. **Inline Actions Scope**: Which inline actions are most valuable?
    - Task-level only?
    - Challenge-level?
    - Calendar-level?
    - All of the above?

---

## Quick Start Implementation Guide

### Step 1: Create Companion Mode Hook (5 min)

```jsx
// src/hooks/useCompanionMode.js
import { useAIConfig } from "./useAIConfig"

export function useCompanionMode() {
  const { config } = useAIConfig()
  return Boolean(config?.api_key && config?.personality_preset)
}
```

### Step 2: Create CompanionBar Component (2-3 hours)

- Use existing `Card` component
- Reuse `AmbientNote` component
- Add to `Header.jsx` when `useCompanionMode()` returns true
- Store collapsed state in localStorage

### Step 3: Create CompanionInsightCard Component (2-3 hours)

- Use existing `Card` component
- Reuse `AmbientNote` component with challenge context
- Add above each challenge in `App.jsx`
- Store dismissed cards in localStorage (session-only)

### Step 4: Create CompanionFloatingButton (1-2 hours)

- Match create button pattern
- Position: `fixed bottom-6 left-6`
- Opens conversation panel
- Shows badge when new note available

### Step 5: Enhance Existing Components (2 hours)

- Make `AmbientNote` more prominent (card-based)
- Add disclosure badges
- Enhance `ConversationPanel` empty state

**Total Estimated Time**: 8-12 hours for Phase 1

---

## Appendix: Component Specifications

### CompanionBar Component

```jsx
// Design System Compliant
<CompanionBar
  companionName={config.companion_name}
  companionPhoto={config.companion_photo_url}
  currentNote={ambientNote}
  onChat={() => openConversation()}
  collapsed={userPreference.collapsed}
  onToggleCollapse={() => toggleCollapse()}
  // Uses: rounded-2xl, p-4, gap-3, text-sm, text-xs, shadow-card
  // Colors: from-primary/10 to-purple-500/10, border-primary/10
/>
```

### CompanionInsightCard Component

```jsx
// Design System Compliant - Uses Card component
<CompanionInsightCard
  challenge={challenge}
  note={challengeNote}
  onChat={() => openConversation(challenge)}
  onDismiss={() => dismissForSession()}
  collapsed={false}
  // Uses: Card component with padding="md"
  // Background: from-primary/5 to-purple-500/5, border-primary/10
  // Text: text-xs font-semibold, text-sm text-secondary
  // Avatar: w-8 h-8 rounded-full
/>
```

### CompanionFloatingButton Component

```jsx
// Design System Compliant - Matches create button pattern
<CompanionFloatingButton
  avatar={companionPhoto}
  hasNewNote={hasNewNote}
  onPress={() => openConversation()}
  onLongPress={() => showQuickActions()}
  // Uses: w-14 h-14, rounded-full, bg-gradient-to-br from-primary-500 to-purple-500
  // Shadow: shadow-lg shadow-primary-500/30
  // Animation: animate-scale-in, active:scale-95
/>
```

### FootprintViewer Component

```jsx
// Design System Compliant - Uses Card component
// Enhances existing useAIContext hook
<FootprintViewer
  context={useAIContext(challenge, tasks, completions)} // Use existing hook
  memories={useAIMemory().memories} // Use existing hook
  dataSources={{
    challenges: challenges.length,
    tasks: tasks.length,
    completions: completions.length,
  }}
  onClose={() => closeFootprint()}
  // Uses: Card component with padding="lg"
  // Text: text-sm text-secondary, text-xs text-tertiary
  // Spacing: gap-4, p-6
/>
```

### ExampleGallery Component

```jsx
// Design System Compliant
// New component to enhance empty conversation state
<ExampleGallery
  examples={sampleConversations}
  onSelectExample={(example) => startConversation(example)}
  categories={["progress", "reflection", "planning", "encouragement"]}
  // Uses: Card component with padding="md" for each example
  // Buttons: Button component variant="ghost" size="sm"
  // Text: text-sm text-secondary, text-xs text-tertiary
  // Spacing: gap-3, p-4
/>
```

### Component Structure

```
src/
├── components/
│   ├── ai/
│   │   ├── CompanionBar.jsx          # NEW - Header bar
│   │   ├── CompanionInsightCard.jsx  # NEW - Challenge cards
│   │   ├── CompanionFloatingButton.jsx # NEW - Floating button
│   │   ├── AmbientNote.jsx           # ENHANCE - Make more prominent
│   │   ├── ConversationPanel.jsx    # ENHANCE - Better empty state
│   │   └── ... (existing components)
│   └── ...
├── hooks/
│   ├── useCompanionMode.js           # NEW - Simple mode detection
│   └── ... (existing hooks)
└── ...
```

### Implementation Order

1. **Create `useCompanionMode` hook** (5 min)

   - Simple check: `config?.api_key && config?.personality_preset`
   - Returns boolean

2. **Create `CompanionBar` component** (2-3 hours)

   - Use existing `Card` component
   - Reuse `AmbientNote` logic
   - Add to `Header.jsx` conditionally

3. **Create `CompanionInsightCard` component** (2-3 hours)

   - Use existing `Card` component
   - Reuse `AmbientNote` logic
   - Add to challenge rendering in `App.jsx`

4. **Create `CompanionFloatingButton` component** (1-2 hours)

   - Match create button pattern
   - Add to `App.jsx`

5. **Enhance existing `AmbientNote`** (1 hour)

   - Make more prominent (card-based)
   - Add disclosure badge

6. **Enhance `ConversationPanel`** (1 hour)
   - Make existing suggestions more prominent
   - Better empty state

**Total Estimated Time**: 8-12 hours for Phase 1

### InlineActionMenu Component

```jsx
<InlineActionMenu
  context={currentContext} // task, challenge, or date
  actions={contextualActions}
  onSelect={(action) => executeAction(action)}
/>
```

---

## Existing Features to Enhance (Not Replace)

### Already Implemented ✅

1. **Memory Viewer** (`src/components/ai/MemoryViewer.jsx`)

   - ✅ Shows memories grouped by type
   - ✅ Allows delete/clear
   - ✅ Integrated into AIConfigForm
   - **Enhancements needed**: Quick access from companion bar, editing capability, usage indicators

2. **Suggested Prompts** (`src/lib/ai/suggestions.js` + `ConversationPanel.jsx`)

   - ✅ Context-aware suggestions via `getSuggestedPrompts()`
   - ✅ Already shown in conversation panel
   - **Enhancements needed**: More prominent, template-style prompts, example gallery integration

3. **AI Context System** (`src/hooks/useAIContext.js`)

   - ✅ Transforms app data into AI context
   - ✅ Used by conversation system
   - **Enhancements needed**: Build Footprint Viewer UI to display this context

4. **Personality Picker** (`src/components/ai/PersonalityPicker.jsx`)

   - ✅ Already implemented and working
   - No changes needed

5. **Conversation Panel** (`src/components/ai/ConversationPanel.jsx`)

   - ✅ Full chat interface
   - ✅ Uses suggested prompts
   - **Enhancements needed**: Example gallery, templates, minimize/pin, footprint view

6. **Ambient Notes** (`src/components/ai/AmbientNote.jsx`)
   - ✅ Multiple note types (header, task, empty, return)
   - **Enhancements needed**: Make more prominent, add disclosure badges

### New Features to Build 🆕

1. Companion header bar
2. Companion insight cards on challenges
3. Floating companion button
4. Example gallery component
5. Footprint viewer UI (displays existing useAIContext)
6. Disclosure badge system
7. Inline action menus
8. Welcome screen for first-time users
9. Template system (enhancement of suggestions)

---

## References

This design plan incorporates UX patterns from:

- **[shapeof.ai](https://www.shapeof.ai/)** - Comprehensive AI UX pattern library
  - Wayfinders: Initial CTA, Example Gallery, Suggestions, Templates, Nudges
  - Inputs: Inline Actions, Follow up, Templates
  - Governors: Action Plan, Footprints, Disclosure, Memory Control
  - Trust Builders: Disclosure, Data Ownership, Footprints, Caveat
  - Identifiers: Avatar, Color, Iconography, Name, Personality

---

## Design System Compliance Checklist

All new components must follow these design system rules:

### ✅ Color Usage

- [ ] Use `text-primary`, `text-secondary`, `text-tertiary` for text hierarchy
- [ ] Use `bg-white dark:bg-surface-dark` for surfaces
- [ ] Use `from-primary/5 to-purple-500/5` for subtle gradients
- [ ] Use `border-primary/10` for borders
- [ ] Use `task-*` colors only for task-specific elements

### ✅ Typography

- [ ] Use system font stack: `-apple-system, BlinkMacSystemFont, "Inter", ...`
- [ ] Use `text-xs` (10px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px)
- [ ] Use `font-medium`, `font-semibold`, `font-bold` for weights
- [ ] Never use custom font sizes outside the scale

### ✅ Spacing

- [ ] Use Tailwind spacing scale: `p-3`, `p-4`, `p-6` for padding
- [ ] Use `gap-1`, `gap-2`, `gap-3`, `gap-4` for gaps
- [ ] Follow existing component patterns (Card uses `p-4` for md, `p-6` for lg)

### ✅ Border Radius

- [ ] Use `rounded-xl` (12px) for buttons
- [ ] Use `rounded-2xl` (16px) for cards
- [ ] Use `rounded-full` for avatars and circular buttons
- [ ] Use `rounded-t-3xl` (24px) for mobile modals

### ✅ Shadows

- [ ] Use `shadow-card` for cards
- [ ] Use `shadow-card-hover` for hover states
- [ ] Use `shadow-modal` for modals
- [ ] Use `shadow-lg shadow-primary-500/30` for floating buttons

### ✅ Components

- [ ] Use existing `Button` component with variants (primary, secondary, ghost, danger)
- [ ] Use existing `Card` component with padding prop
- [ ] Use existing `Modal` component for overlays
- [ ] Don't create new button/card variants unless absolutely necessary

### ✅ Animations

- [ ] Use `animate-scale-in` (0.15s), `animate-fade-in` (0.2s), `animate-slide-up` (0.3s)
- [ ] Use `transition-all duration-150` for standard transitions
- [ ] Use `active:scale-95` for button presses
- [ ] Use `hover:scale-105` for subtle hover effects

### ✅ Dark Mode

- [ ] All components must support dark mode
- [ ] Use `dark:` prefix for dark mode styles
- [ ] Test both light and dark modes
- [ ] Use CSS variables where appropriate (`var(--color-*)`)

### ✅ Accessibility

- [ ] Use `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`
- [ ] Ensure 44px minimum touch targets
- [ ] Use proper ARIA labels
- [ ] Maintain color contrast ratios

---

**End of Design Plan**
