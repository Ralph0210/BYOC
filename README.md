# BYOC📍

> **Build better habits through focused challenges.**

BYOC is a modern, challenge-based habit tracker designed to help you build consistency through defined sprints rather than endless lists. It visualizes your progress with a GitHub-style contribution graph and premium insights.

![App Preview](public/preview.png)
_(Drop a screenshot of your app here)_

---

## ✨ Philosophy & UX

Most habit trackers fail because they are "infinite". Path introduces the concept of **Challenges**—time-bound commitments (e.g., "30 Days of Coding", "Morning Routine Sprint") that give you a clear start and finish line.

### Key UX Considerations

- **Visual Consistency**: We use a heatmap coloring system (the "GitHub Graph" effect) where days get darker as you complete more tasks. A "Perfect Day" gets a distinct checkmark and glow.
- **Dual Progress Tracking**:
  - **Score**: Your overall consistency/performance percentage (Efficiency).
  - **Journey**: A timeline bar showing how far you are through the challenge duration (Time Elapsed).
- **Tactile Interactions**: Infinite-polish animations, "pop" effects on completion, and haptic-like button scaling for a premium feel.
- **Mobile First**: Fully responsive layout with touch-optimized targets (44px+) and sticky calendar headers.

---

## 🚀 Features

- **🏆 Challenge System**: Create custom challenges with specific durations (7, 30, 90 days) or custom date ranges.
- **📅 Interactive Calendar**: A scrollable, snap-based calendar grid that visualizes your daily performance and allows backtracking.
- **⚡ Flexible Tasks**: Tasks can be Daily, Weekly (e.g., "3 times a week"), or on Specific Days (Mon/Wed/Fri).
- **🎨 Customization**: Assign unique colors and icons to every task.
- **📊 Smart Stats**: Real-time calculation of completion rates, current streaks, and daily targets.
- **🔐 Privacy First**: All user content (Challenges, Tasks, AI Config) and API keys are **encrypted** before storage.
- **🔐 Google Auth**: Secure authentication via Supabase (with Guest mode fallback).
- **🌑 Dark Mode**: Fully native dark mode support that respects system preferences.

---

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/path-tracker.git
   cd path-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   Run the SQL script located at `supabase/complete_reset.sql` in your Supabase SQL Editor to set up the necessary tables, views, and security policies.

5. **Run Locally**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```
src/
├── components/
│   ├── calendar/      # The stats grid & heatmap logic
│   ├── challenge/     # Challenge cards, forms, & creation flow
│   ├── layout/        # Header, Shell
│   ├── task/          # Task items, checklist, & interactions
│   └── ui/            # Reusable primitives (Modal, Button, Card)
├── hooks/             # Custom hooks (useTasks, useAuth, useTheme)
├── lib/               # Utilities & Date helpers
└── App.jsx            # Main application logic
```

---

## 🎨 Design System

- **Colors**: Uses a semantic `primary`, `secondary`, `tertiary` system with `surface` layers for depth.
- **Typography**: Clean sans-serif hierarchy.
- **Motion**: Fast, ease-out transitions (150ms) for UI interactions.

---

built with ❤️ by Ralph Chang
