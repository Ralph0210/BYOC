# Path - UX Research Document

## Executive Summary

This document synthesizes UX research from leading task management and habit tracking apps to inform the design of **Path**, a challenge-based task tracking application. The goal is to create an Apple-quality experience that feels premium, minimal, and motivating.

---

## Apps Analyzed

| App                  | Category           | Key Strength                                     |
| -------------------- | ------------------ | ------------------------------------------------ |
| Things 3             | Task Management    | Elegant simplicity, satisfying interactions      |
| Streaks              | Habit Tracking     | Visual completion rings, extensive customization |
| Habitify             | Habit Tracking     | Clear completion status indicators               |
| Apple Reminders      | Task Management    | Native iOS patterns, minimal design              |
| GitHub Contributions | Data Visualization | Heat map calendar grid                           |

---

## Key UX Patterns

### 1. Task Completion Interactions

**Things 3 Approach:**

- Square checkboxes with haptic feedback on completion
- Satisfying micro-animations when marking complete
- Completed tasks slide away smoothly to a "Logbook"

**Streaks Approach:**

- Tap or long-tap to complete
- Ring fills with color as progress is made
- Multi-count tasks use +/- with visual progress

> [!TIP] > **Recommendation for Path**: Combine haptic feedback + ring-based progress for multi-count tasks. Single-tap completion with subtle scale animation.

---

### 2. Calendar Visualization

**GitHub Contributions Grid:**

- Sequential color palette (light → dark green)
- 7 rows × 52 columns (days × weeks)
- Hover tooltips showing exact counts
- Clear legend mapping colors to ranges

**Habitify Calendar:**
| Symbol | Meaning |
|--------|---------|
| ● Solid circle | Goal achieved |
| ◐ Incomplete circle | Partial progress |
| → Arrow | Skipped |
| ✕ Cross | Failed/missed |

**Streaks Mini Calendar:**

- Tapping a habit reveals a monthly calendar view
- Each day shows completion status with color coding
- Current and best streak prominently displayed

> [!TIP] > **Recommendation for Path**: GitHub-style grid with task-specific color dots. Each cell shows small colored dots for each task completed that day. Hover/tap reveals detailed breakdown.

---

### 3. Information Architecture

**Things 3 Hierarchy:**

```
Areas (broad themes)
  └── Projects (specific goals)
        └── Headings (sections)
              └── Tasks (actionable items)
                    └── Checklists (sub-steps)
```

**Path Equivalent:**

```
Challenges (time-bound goals with reward)
  └── Tasks (customizable with color/icon)
        └── Daily entries (completion records)
```

---

### 4. Task Creation & Editing

**Best Practices Observed:**

1. **Magic Plus Button (Things 3)**: Floating action button that can be dragged to insert tasks at specific positions
2. **Inline Editing**: Edit task name directly without opening a modal
3. **Quick Schedule**: Natural language input or date picker
4. **Color & Icon Selection**: Visual grid picker (Streaks has 600+ icons, 78 color themes)

> [!TIP] > **Recommendation for Path**: Bottom-sheet modal for task creation with icon grid (Lucide), curated Apple-like color palette, and frequency selector.

---

### 5. Visual Design Language

**Apple Design Principles:**

- Clean white/dark backgrounds with subtle contrast
- SF Pro or Inter typography
- Generous whitespace
- Subtle shadows and rounded corners (12-16px radius)
- System blue (#007AFF) as primary accent

**Streaks Customization:**

- 78 color themes for personalization
- 600+ task icons organized by category
- Custom app icons

> [!IMPORTANT] > **Design tokens for Path**:
>
> - Primary: Apple Blue `#007AFF`
> - Background (light): `#FFFFFF` / (dark): `#000000`
> - Surface (light): `#F2F2F7` / (dark): `#1C1C1E`
> - Text: System colors with proper contrast
> - Radius: `12px` for cards, `8px` for buttons, `50%` for icons

---

## Calendar Grid Design Recommendations

### Layout

- **Structure**: 7 columns (Mon-Sun) × dynamic rows
- **Cell Size**: 32-40px squares with 4px gap
- **Scrolling**: Horizontal or vertical scroll through months/weeks

### Color Coding

For a challenge with multiple tasks, each task has its assigned color. The calendar cell shows:

```
┌─────────────┐
│  ●  ●  ●    │  ← 3 task dots (3 tasks completed)
│    12       │  ← Optional: day number
└─────────────┘
```

**Intensity scale for single-task view:**
| Completion | Opacity/Intensity |
|------------|-------------------|
| 0% | `0.1` (very light) |
| 25% | `0.35` |
| 50% | `0.55` |
| 75% | `0.75` |
| 100% | `1.0` (full color) |

### Interaction

- **Hover**: Show tooltip with date, completion count per task
- **Click**: Navigate to that day's detail view or open quick-edit

---

## Task Frequency UX

Based on research, the frequency selector should support:

| Type          | UI Representation                         |
| ------------- | ----------------------------------------- |
| Daily (1x)    | "Every day" toggle                        |
| Daily (Nx)    | Counter: "3 times per day" with +/-       |
| Specific days | Weekday pills: M T W T F S S              |
| Weekly        | "Once per week" + optional day preference |

**Completion tracking for multi-count:**

- Ring progress indicator (0/3 → 1/3 → 2/3 → 3/3)
- Tap to increment, long-press to decrement or reset

---

## Challenge Lifecycle UX

### Active Challenge View

- Progress bar showing days elapsed / total days
- Overall completion percentage
- Reward preview (motivational element)

### Challenge Completion Flow

1. Celebration animation (confetti or pulse)
2. Summary screen showing:
   - Total days
   - Completion rate per task
   - Best day/week
   - Reward with link button
3. Actions: "Archive" | "Extend (+7 days, +30 days, custom)"

---

## Dark Mode Considerations

- True black background (`#000000`) for OLED
- Elevated surfaces use lighter grays (`#1C1C1E`, `#2C2C2E`)
- Reduce pure white text to `rgba(255,255,255,0.87)` for comfort
- Task colors should be slightly desaturated in dark mode

---

## Final Design Recommendations Summary

| Feature           | Recommendation                                 |
| ----------------- | ---------------------------------------------- |
| Task completion   | Tap + haptic + scale animation                 |
| Multi-count tasks | Ring progress with +/- controls                |
| Calendar grid     | GitHub-style with colored dots per task        |
| Color palette     | 12 curated Apple-like colors                   |
| Icons             | Lucide icons, searchable grid picker           |
| Challenge card    | Progress bar + days remaining + reward preview |
| Theme             | Light/Dark/System with true black dark mode    |
| Typography        | Inter or system font stack                     |

---

## References

- Things 3 UX Review - culturedcode.com
- Streaks App - streaksapp.com, macstories.net
- Habitify Help Center - intercom.help
- GitHub Contributions - medium.com analysis
- Apple HIG - developer.apple.com
