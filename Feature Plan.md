Feature Plan: Goal-Driven, Phase-Based Task Planning (UX-Focused)

1. Product Goal

Enable users to turn high-level goals into clear, adaptive, and non-overwhelming plans that feel continuously progressive — even as tasks regenerate, priorities change, or new goals are added.

The system should:
Feel personalized without over-questioning
Avoid irrelevant or redundant prompts
Protect the user’s sense of progress
Adapt gracefully to real-world constraints (time, energy, calendar) 2. Core Planning Model (User-Facing Mental Model)

The planning experience is structured into four layers:

Goal → Phase → Weekly Plan → Tasks (with optional Subtasks)

Each layer has a distinct UX purpose:
Goal: What the user wants to achieve
Phase: Why they feel they are making progress
Weekly plan: What they are focusing on right now
Tasks / Subtasks: What they actually do 3. Goal Creation Experience

Principle: Ask less, infer more

When a user creates a goal:
The AI infers intent from the goal text
The system classifies the goal into a goal type
Only missing or ambiguous information is requested

Examples:
If a deadline is provided, do not re-ask for it
If the goal is execution-oriented (e.g. “study for exam”), avoid abstract reflection questions upfront

The goal creation flow should feel like confirmation, not interrogation. 4. Phases: The Continuity Layer

Purpose

Phases provide a long-term progress narrative that persists beyond individual tasks or weeks. Phases should be saved in the db as a northstar for future plan generation, and evolve with user’s progress.

UX Characteristics
Generated once at goal creation
Outcome-based, not task-based
Named in human, motivational language
Visible as a progress arc (“where I am in the journey”)

Why Phases Exist
Weekly plans reset; phases do not
Users feel progress even when tasks change
Supports long-horizon goals without overwhelming detail

Phases are never silently rewritten. They anchor trust. 5. Weekly Plans: The Execution Window

Purpose

Translate the current phase into near-term, realistic focus.

UX Characteristics
Rolling window (up to 4 weeks at a time)
Regenerable without affecting completed work
Each week has a clear focus tied to the current phase

Weekly plans adapt when:
Time availability changes
New goals are added
Priorities shift

But they always respect what the user has already done. 6. Tasks: Planning Units, Not Checklists

Task Philosophy

Tasks represent meaningful commitments, not granular steps.
Tasks are intentionally limited in number
Tasks are sized to protect cognitive load
Daily planning respects the 1-3-5 rule

Task Sizing
Big tasks = deep thinking, heavy setup, or long focus
Medium tasks = sustained but bounded work
Small tasks = quick wins or mechanical actions

Daily plans should never overload the user, even across multiple goals. 7. Subtasks: Execution Support

Role of Subtasks

Subtasks exist to make tasks feel doable, not to increase planning complexity.
Optional, not mandatory
Shown only when a task is opened
Never scheduled independently

Subtasks:
Help users start
Reduce ambiguity
Support momentum

Key rule:

Tasks are promises. Subtasks are suggestions. 8. Multi-Goal Awareness & Priority Handling

Principle: One human, one capacity

When multiple goals exist:
The system plans holistically
Daily load is evaluated across all goals
Conflicts are resolved transparently

If a new goal is higher priority:
Existing plans adjust
Lower-priority tasks are deferred, not deleted
The user is shown what changed and why

The system never silently double-books the user. 9. Calendar & Availability Awareness

Purpose

Respect real life.
Users can choose which days they work
Fully booked days are protected
Large tasks are not suggested on constrained days

Calendar awareness improves trust, not micromanagement. 10. Regeneration Without Progress Loss

Core UX Promise

“Your progress is safe. We only adapt what’s ahead.”

Rules:
Completed work is never undone
Phases persist across regenerations
Only upcoming, unstarted tasks change

This allows the system to stay flexible without feeling unstable. 11. Success Criteria (UX)

This feature succeeds if users:
Feel understood after goal creation
Rarely delete AI-generated tasks
Can explain where they are in a goal in one sentence
Feel motivated even when plans change 12. Design North Star

This is not a task app.

It is a progress system that adapts to real life while protecting motivation, clarity, and momentum.
