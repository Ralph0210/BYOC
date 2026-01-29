import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Plus,
  Calendar,
  Gift,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  List,
  Sparkles,
} from "lucide-react"
import { Header } from "./components/layout/Header"
import {
  Sidebar,
  MobileHeader,
  SidebarToggle,
} from "./components/layout/Sidebar"
import { Button } from "./components/ui/Button"
import { Card } from "./components/ui/Card"
import { Modal } from "./components/ui/Modal"
import { ConfirmModal } from "./components/ui/ConfirmModal"
import { ChallengeForm } from "./components/challenge/ChallengeForm"
import { ChallengeSummary } from "./components/challenge/ChallengeSummary"
import { TaskItem } from "./components/task/TaskItem"
import { TaskForm } from "./components/task/TaskForm"
import { CalendarGrid } from "./components/calendar/CalendarGrid"
import { useChallenges } from "./hooks/useChallenges"
import { useTasks } from "./hooks/useTasks"
import { useCompletions } from "./hooks/useCompletions"
import { useSnoozes } from "./hooks/useSnoozes"
import { useTheme } from "./hooks/useTheme"
import { useAuth } from "./hooks/useAuth.jsx"
import { useGoogleCalendar } from "./hooks/useGoogleCalendar"
import { LandingPage } from "./components/landing/LandingPage"
import {
  getToday,
  formatDisplayDate,
  isTaskActiveOnDate,
  calculateCompletionPercentage,
  getDateRange,
  daysDiff,
  addDays,
  formatDate,
  cn,
} from "./lib/utils"
import { PrivacyPolicyPage } from "./components/landing/PrivacyPolicyPage"
import { calculateChallengeStats } from "./lib/stats"
import {
  AmbientNote,
  ReturnNote,
  EmptyStateNote,
} from "./components/ai/AmbientNote"
import { AISortButton } from "./components/ai/AISortButton"
import { DayPlanner } from "./components/calendar/DayPlanner"
import { ConversationPanel } from "./components/ai/ConversationPanel"
import { SettingsPanel } from "./components/settings/SettingsPanel"
import {
  useReturnDetection,
  prefetchAmbientNote,
} from "./hooks/useAmbientNotes"
import { useAIConfig } from "./hooks/useAIConfig"
import { useCompanionMode } from "./hooks/useCompanionMode"
import { CompanionInsightCard } from "./components/ai/CompanionInsightCard"

function App() {
  // Initialize theme
  useTheme()

  // Auth
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    signOut,
    isAuthenticated,
  } = useAuth()
  const [hasStarted, setHasStarted] = useState(() => {
    // Check if user has used the app before
    return localStorage.getItem("byoc_has_started") === "true"
  })

  const handleGetStarted = () => {
    localStorage.setItem("byoc_has_started", "true")
    setHasStarted(true)
  }

  const handleSignOut = async () => {
    await signOut()
    localStorage.removeItem("byoc_has_started")
    setHasStarted(false)
  }

  const today = getToday()
  const [expandedChallenges, setExpandedChallenges] = useState({})
  const [selectedDates, setSelectedDates] = useState({}) // Per-challenge date selection
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedChallengeId, setSelectedChallengeId] = useState(null)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // Modals
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedChallengeForTask, setSelectedChallengeForTask] = useState(null)
  const [progressViewMode, setProgressViewMode] = useState("grid") // "grid" or "day"

  // AI State
  const { config } = useAIConfig()
  const isCompanionEnabled = useCompanionMode()
  const [showAISettings, setShowAISettings] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatInitialContext, setChatInitialContext] = useState(null)
  const [sortedTaskIds, setSortedTaskIds] = useState({}) // Per-challenge sorted task order

  const handleOpenChat = (context = null) => {
    setChatInitialContext(context)
    setShowChat(true)
  }

  const { daysAway, isReturning, dismissReturn } = useReturnDetection()

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, id: null })

  // Data hooks
  const {
    challenges,
    fetchChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    archiveChallenge,
    extendChallenge,
  } = useChallenges()

  const { tasks, fetchTasksForChallenges, createTask, updateTask, deleteTask } =
    useTasks()

  const {
    completions,
    fetchCompletions,
    addCompletion,
    removeCompletion,
    getCompletionCountForTask,
  } = useCompletions()

  const { snoozes, fetchSnoozes, addSnooze, removeSnooze, isTaskSnoozed } =
    useSnoozes()

  // Google Calendar Data
  const { todayEvents, weekEvents } = useGoogleCalendar()

  // Initial data fetch
  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  // Auto-select first challenge if none selected
  useEffect(() => {
    if (!selectedChallengeId && challenges.length > 0) {
      const activeChallenges = challenges.filter((c) => !c.is_archived)
      if (activeChallenges.length > 0) {
        setSelectedChallengeId(activeChallenges[0].id)
      }
    }
  }, [challenges, selectedChallengeId])

  // Fetch all tasks and completions when challenges load
  useEffect(() => {
    if (challenges.length > 0) {
      const activeChallenges = challenges.filter((c) => !c.is_archived)
      const challengeIds = activeChallenges.map((c) => c.id)

      if (challengeIds.length > 0) {
        fetchTasksForChallenges(challengeIds).then((allTasks) => {
          if (allTasks && allTasks.length > 0) {
            const taskIds = allTasks.map((t) => t.id)
            // Fetch completions for full date range
            const dates = activeChallenges.map((c) => ({
              start: c.start_date,
              end: c.end_date,
            }))
            const startDate = dates.reduce(
              (min, d) => (d.start < min ? d.start : min),
              dates[0].start,
            )
            fetchCompletions(taskIds, startDate, today)
            fetchSnoozes(taskIds, startDate, today)
          }
        })
      }
    }
  }, [
    challenges,
    today,
    fetchTasksForChallenges,
    fetchCompletions,
    fetchSnoozes,
  ])

  // Pre-fetch AI notes for neglected tasks
  useEffect(() => {
    if (!isCompanionEnabled || tasks.length === 0) return

    // Stagger pre-fetches to avoid hitting rate limits too hard
    const timer = setTimeout(() => {
      const activeChallenges = challenges.filter((c) => !c.is_archived)

      activeChallenges.forEach((challenge) => {
        const challengeTasks = tasks.filter(
          (t) => t.challenge_id === challenge.id,
        )

        challengeTasks.forEach((task) => {
          const taskCompletions = completions
            .filter((c) => c.task_id === task.id)
            .sort((a, b) => b.date.localeCompare(a.date))

          const lastCompletedDate = taskCompletions[0]?.date || null
          const daysSinceLastDone = lastCompletedDate
            ? Math.floor(
                (new Date() - new Date(lastCompletedDate)) /
                  (1000 * 60 * 60 * 24),
              )
            : 999

          if (daysSinceLastDone >= 3) {
            prefetchAmbientNote(
              "task",
              {
                taskName: task.name,
                daysSinceLastDone,
              },
              config,
              user?.user_metadata?.full_name?.split(" ")[0] ||
                user?.email?.split("@")[0],
            )
          }
        })
      })
    }, 2000) // Wait 2s after stability to start pre-fetching

    return () => clearTimeout(timer)
  }, [challenges.length, tasks.length, completions.length, config?.api_key])

  // Toggle challenge expanded state
  const toggleChallenge = (challengeId) => {
    setExpandedChallenges((prev) => ({
      ...prev,
      [challengeId]: !prev[challengeId],
    }))
  }

  // Calculate completion stats for a challenge
  const getCompletionStats = useCallback(
    (challenge, challengeTasks) => {
      return calculateChallengeStats(
        challenge,
        challengeTasks,
        completions,
        snoozes,
      )
    },
    [completions, snoozes],
  )

  // Handle task snooze toggle
  const handleSnoozeTask = useCallback(
    async (taskId, date) => {
      if (isTaskSnoozed(taskId, date)) {
        await removeSnooze(taskId, date)
      } else {
        await addSnooze(taskId, date)
      }
    },
    [isTaskSnoozed, addSnooze, removeSnooze],
  )

  // Handle task completion
  const handleCompleteTask = useCallback(
    async (taskId, date) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      const currentCount = getCompletionCountForTask(taskId, date)
      const targetCount = task.frequency_count || 1

      if (currentCount < targetCount) {
        await addCompletion(taskId, date)
      }
    },
    [tasks, getCompletionCountForTask, addCompletion],
  )

  // Handle task uncomplete (decrement)
  const handleUncompleteTask = useCallback(
    async (taskId, date) => {
      await removeCompletion(taskId, date)
      // Refetch completions to update UI
      const activeChallenges = challenges.filter((c) => !c.is_archived)
      const taskIds = tasks.map((t) => t.id)
      if (taskIds.length > 0 && activeChallenges.length > 0) {
        const dates = activeChallenges.map((c) => ({
          start: c.start_date,
          end: c.end_date,
        }))
        const startDate = dates.reduce(
          (min, d) => (d.start < min ? d.start : min),
          dates[0].start,
        )
        fetchCompletions(taskIds, startDate, today)
      }
    },
    [challenges, tasks, removeCompletion, fetchCompletions, today],
  )

  // Refetch completions after any completion change
  const refetchCompletions = useCallback(() => {
    const activeChallenges = challenges.filter((c) => !c.is_archived)
    const taskIds = tasks.map((t) => t.id)
    if (taskIds.length > 0 && activeChallenges.length > 0) {
      const dates = activeChallenges.map((c) => ({
        start: c.start_date,
        end: c.end_date,
      }))
      const startDate = dates.reduce(
        (min, d) => (d.start < min ? d.start : min),
        dates[0].start,
      )
      fetchCompletions(taskIds, startDate, today)
    }
  }, [challenges, tasks, fetchCompletions, today])

  // Challenge handlers
  const handleSaveChallenge = async (data, tasksToCreate = null) => {
    let savedChallenge = null

    if (editingChallenge) {
      savedChallenge = await updateChallenge(editingChallenge.id, data)
    } else {
      savedChallenge = await createChallenge(data)

      // If tasks are provided (from goal creation), create them
      if (tasksToCreate && tasksToCreate.length > 0 && savedChallenge) {
        for (const taskData of tasksToCreate) {
          await createTask({ ...taskData, challenge_id: savedChallenge.id })
        }
      }

      // Auto-select the newly created challenge
      if (savedChallenge) {
        setSelectedChallengeId(savedChallenge.id)
      }
    }

    setShowChallengeModal(false)
    setEditingChallenge(null)

    // Parallel fetch: refresh challenges list AND tasks for all active challenges
    // Important: we need to use the potential new list of challenges
    const updatedChallenges = await fetchChallenges()
    const activeChallenges = updatedChallenges.filter((c) => !c.is_archived)
    const challengeIds = activeChallenges.map((c) => c.id)

    if (challengeIds.length > 0) {
      await fetchTasksForChallenges(challengeIds)
    }
  }

  const handleDeleteChallenge = async (challengeId) => {
    setDeleteConfirm({ type: "challenge", id: challengeId })
  }

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge)
    setShowChallengeModal(true)
  }

  // Task handlers
  const handleSaveTask = async (data) => {
    if (editingTask) {
      await updateTask(editingTask.id, data)
    } else if (selectedChallengeForTask) {
      await createTask({ ...data, challenge_id: selectedChallengeForTask.id })
    }
    setShowTaskModal(false)
    setEditingTask(null)
    setSelectedChallengeForTask(null)
    // Refetch tasks for all active challenges
    const activeChallenges = challenges.filter((c) => !c.is_archived)
    const challengeIds = activeChallenges.map((c) => c.id)
    if (challengeIds.length > 0) {
      await fetchTasksForChallenges(challengeIds)
    }
  }

  const handleDeleteTask = async (id) => {
    setDeleteConfirm({ type: "task", id })
  }

  // Execute delete after confirmation
  const executeDelete = async () => {
    if (deleteConfirm.type === "challenge") {
      await deleteChallenge(deleteConfirm.id)
      fetchChallenges()
    } else if (deleteConfirm.type === "task") {
      await deleteTask(deleteConfirm.id)
      const challengeIds = challenges
        .filter((c) => !c.is_archived)
        .map((c) => c.id)
      fetchTasksForChallenges(challengeIds)
    }
    setDeleteConfirm({ type: null, id: null })
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  const handleAddTask = (challenge) => {
    setSelectedChallengeForTask(challenge)
    setEditingTask(null)
    setShowTaskModal(true)
  }

  // Render single challenge detail view (for sidebar layout)
  const renderChallengeDetail = (challenge) => {
    const challengeTasks = tasks.filter((t) => t.challenge_id === challenge.id)
    const stats = getCompletionStats(challenge, challengeTasks)
    const daysRemaining =
      challenge.end_date >= today ? daysDiff(today, challenge.end_date) + 1 : 0

    // Today's Progress
    let todayTarget = 0
    let todayDone = 0
    challengeTasks.forEach((task) => {
      if (isTaskActiveOnDate(task, today)) {
        todayTarget += task.frequency_count || 1
        const taskCompletions = completions.filter(
          (c) => c.task_id === task.id && c.date === today,
        ).length
        todayDone += Math.min(taskCompletions, task.frequency_count || 1)
      }
    })

    return (
      <div className="dashboard-grid">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-primary truncate">
                {challenge.name}
              </h1>
              {challenge.reward_text && (
                <Gift className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary">
              <span>
                {formatDisplayDate(challenge.start_date)} →{" "}
                {formatDisplayDate(challenge.end_date)}
              </span>
              {daysRemaining > 0 && (
                <span
                  className={cn(
                    daysRemaining <= 3 && "text-orange-500 font-medium",
                  )}
                >
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                </span>
              )}
            </div>
          </div>

          {/* Progress Stats - Clean skeuomorphic design */}
          <div className="flex items-center gap-4 ml-4">
            <div className="stat-box text-center">
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-300">
                {stats.overall}%
              </div>
              <div className="text-xs text-indigo-500/80 dark:text-indigo-400/80 font-medium">
                progress
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleEditChallenge(challenge)}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                aria-label="Edit challenge"
              >
                <Edit2 className="w-4 h-4 text-tertiary hover:text-primary" />
              </button>
              <button
                onClick={() => handleDeleteChallenge(challenge.id)}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                aria-label="Delete challenge"
              >
                <Trash2 className="w-4 h-4 text-tertiary hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Left Column: AI Insights + Heatmap */}
        <div className="dashboard-left">
          {/* AI Insights Card - with AI glow styling */}
          {isCompanionEnabled && (
            <div
              className="dashboard-card dashboard-card-ai p-5 cursor-pointer hover:scale-[1.01] transition-all duration-200"
              onClick={() => handleOpenChat(challenge)}
            >
              <CompanionInsightCard
                challenge={challenge}
                tasks={challengeTasks}
                completions={completions}
                onChat={() => handleOpenChat(challenge)}
                embedded
              />
            </div>
          )}

          {/* Heatmap/DayPlanner Card */}
          <div className="dashboard-card p-4 min-h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="dashboard-card-icon">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-primary">Progress</h3>
              </div>

              {/* View Toggle */}
              <div className="flex bg-surface-alt rounded-lg p-0.5 border border-border">
                <button
                  onClick={() => setProgressViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    progressViewMode === "grid"
                      ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                      : "text-tertiary hover:text-secondary",
                  )}
                  title="Month View"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProgressViewMode("day")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    progressViewMode === "day"
                      ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                      : "text-tertiary hover:text-secondary",
                  )}
                  title="Day View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {progressViewMode === "grid" ? (
              <CalendarGrid
                tasks={challengeTasks}
                completions={completions}
                snoozes={snoozes}
                startDate={challenge.start_date}
                endDate={challenge.end_date}
                selectedDate={selectedDates[challenge.id] || today}
                onDateClick={(date) => {
                  if (date <= today) {
                    setSelectedDates((prev) => ({
                      ...prev,
                      [challenge.id]: date,
                    }))
                    // Auto-switch to day view on click if desired? No, stay on grid for navigation
                  }
                }}
                weeksToShow={
                  Math.ceil(
                    daysDiff(challenge.start_date, challenge.end_date) / 7,
                  ) + 1
                }
                minWeeks={20}
              />
            ) : (
              <DayPlanner
                date={selectedDates[challenge.id] || today}
                tasks={challengeTasks.filter((t) =>
                  isTaskActiveOnDate(t, selectedDates[challenge.id] || today),
                )}
                events={[...todayEvents, ...weekEvents]}
                onEditTask={handleEditTask}
              />
            )}
          </div>
        </div>

        {/* Right Column: Tasks + Reward */}
        <div className="dashboard-right">
          {/* Tasks Card */}
          <div className="dashboard-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="dashboard-card-icon">
                  <List className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-primary">Tasks</h3>
              </div>
              <div className="flex items-center gap-2">
                {todayTarget > 0 && (
                  <span className="done-badge">{todayDone} done</span>
                )}
                <AISortButton
                  tasks={challengeTasks.filter((t) =>
                    isTaskActiveOnDate(t, selectedDates[challenge.id] || today),
                  )}
                  onUpdateTask={updateTask}
                  onSort={(sortedTasks) => {
                    // Store the sorted order for this challenge
                    setSortedTaskIds((prev) => ({
                      ...prev,
                      [challenge.id]: sortedTasks.map((t) => t.id),
                    }))
                  }}
                />
                <Button
                  size="xs"
                  variant="ghost"
                  icon={Plus}
                  onClick={() => handleAddTask(challenge)}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Task List */}
            {(() => {
              const selectedDate = selectedDates[challenge.id] || today
              let dateTasks = challengeTasks.filter((t) =>
                isTaskActiveOnDate(t, selectedDate),
              )

              // Apply AI sorting if available
              const sortOrder = sortedTaskIds[challenge.id]
              if (sortOrder && sortOrder.length > 0) {
                dateTasks = [...dateTasks].sort((a, b) => {
                  const aIdx = sortOrder.indexOf(a.id)
                  const bIdx = sortOrder.indexOf(b.id)
                  if (aIdx === -1) return 1
                  if (bIdx === -1) return -1
                  return aIdx - bIdx
                })
              }

              const isFutureDate = selectedDate > today

              return dateTasks.length > 0 ? (
                <div className="space-y-2">
                  {dateTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      completionCount={getCompletionCountForTask(
                        task.id,
                        selectedDate,
                      )}
                      onComplete={handleCompleteTask}
                      onUncomplete={handleUncompleteTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onSnooze={handleSnoozeTask}
                      isSnoozed={isTaskSnoozed(task.id, selectedDate)}
                      date={selectedDate}
                      disabled={isFutureDate}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <EmptyStateNote />
                  <p className="text-sm text-tertiary mt-2">
                    No tasks for today
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Reward Card */}
          {challenge.reward_text && (
            <div className="dashboard-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.1))",
                  }}
                >
                  <Gift className="w-4 h-4 text-yellow-500" />
                </div>
                <h3 className="text-sm font-semibold text-primary">Reward</h3>
              </div>
              <p className="text-sm text-secondary">{challenge.reward_text}</p>
              {challenge.reward_link && (
                <a
                  href={challenge.reward_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View reward
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render expanded challenge content
  const renderChallengeContent = (challenge) => {
    const challengeTasks = tasks.filter((t) => t.challenge_id === challenge.id)
    const stats = getCompletionStats(challenge, challengeTasks)

    // Per-challenge selected date (defaults to today)
    const selectedDate = selectedDates[challenge.id] || today
    const isFutureDate = selectedDate > today
    const isPastDate = selectedDate < today
    const isSelectedToday = selectedDate === today

    // Tasks active on selected date
    const dateTasks = challengeTasks.filter((t) =>
      isTaskActiveOnDate(t, selectedDate),
    )

    // Date navigation handlers
    const handlePrevDate = (e) => {
      e.stopPropagation()
      const prevDate = formatDate(addDays(selectedDate, -1))
      if (prevDate >= challenge.start_date) {
        setSelectedDates((prev) => ({ ...prev, [challenge.id]: prevDate }))
      }
    }

    const handleNextDate = (e) => {
      e.stopPropagation()
      const nextDate = formatDate(addDays(selectedDate, 1))
      // Can only go up to today
      if (nextDate <= today && nextDate <= challenge.end_date) {
        setSelectedDates((prev) => ({ ...prev, [challenge.id]: nextDate }))
      }
    }

    const handleDateClick = (date) => {
      // Only allow clicking past or today
      if (date <= today) {
        setSelectedDates((prev) => ({ ...prev, [challenge.id]: date }))
      }
    }

    const handleResetToToday = (e) => {
      e.stopPropagation()
      setSelectedDates((prev) => ({ ...prev, [challenge.id]: today }))
    }

    const canGoPrev = selectedDate > challenge.start_date
    // Can only go forward if not on today AND not past end_date
    const maxDate = today < challenge.end_date ? today : challenge.end_date
    const canGoNext = selectedDate < maxDate

    return (
      <div className="mt-4 pt-4 border-t border-app space-y-4">
        {/* Reward */}
        {challenge.reward_text && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-task-yellow/10">
            <Gift className="w-5 h-5 text-task-yellow flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">
                {challenge.reward_text}
              </p>
              {challenge.reward_link && (
                <a
                  href={challenge.reward_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-task-yellow hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </a>
              )}
            </div>
            {challenge.reward_link && (
              <img
                src={challenge.reward_link}
                alt=""
                className="w-12 h-12 rounded-lg object-cover"
                onError={(e) => {
                  e.target.style.display = "none"
                }}
              />
            )}
          </div>
        )}

        {/* Calendar Grid */}
        <div>
          <h4 className="text-xs font-medium text-tertiary mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Progress
          </h4>
          <CalendarGrid
            tasks={challengeTasks}
            completions={completions}
            snoozes={snoozes}
            startDate={challenge.start_date}
            endDate={challenge.end_date}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            weeksToShow={
              Math.ceil(
                daysDiff(challenge.start_date, challenge.end_date) / 7,
              ) + 1
            }
            minWeeks={20}
          />
        </div>

        {/* Date Navigation & Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevDate}
                disabled={!canGoPrev}
                className={cn(
                  "p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800",
                  !canGoPrev && "opacity-40 cursor-not-allowed",
                )}
              >
                <ChevronLeft className="w-4 h-4 text-tertiary" />
              </button>
              <button
                type="button"
                onClick={handleResetToToday}
                className={cn(
                  "text-sm font-medium px-2 py-1 rounded-lg",
                  isSelectedToday
                    ? "text-primary bg-primary-500/10"
                    : "text-secondary hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                {isSelectedToday ? "Today" : formatDisplayDate(selectedDate)}
              </button>
              <button
                type="button"
                onClick={handleNextDate}
                disabled={!canGoNext}
                className={cn(
                  "p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800",
                  !canGoNext && "opacity-40 cursor-not-allowed",
                )}
              >
                <ChevronRight className="w-4 h-4 text-tertiary" />
              </button>
              {!isSelectedToday && (
                <button
                  type="button"
                  onClick={handleResetToToday}
                  className="text-xs text-primary-500 hover:underline ml-2"
                >
                  Back to today
                </button>
              )}
            </div>

            {/* Add Task Button */}
            <Button
              size="sm"
              variant="ghost"
              icon={Plus}
              onClick={() => handleAddTask(challenge)}
            >
              Add
            </Button>
          </div>

          {/* Tasks for Selected Date */}
          {dateTasks.length > 0 ? (
            <div className="space-y-2">
              {dateTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  completionCount={getCompletionCountForTask(
                    task.id,
                    selectedDate,
                  )}
                  onComplete={handleCompleteTask}
                  onUncomplete={handleUncompleteTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onSnooze={handleSnoozeTask}
                  isSnoozed={isTaskSnoozed(task.id, selectedDate)}
                  date={selectedDate}
                  disabled={isFutureDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <EmptyStateNote />
              <p className="text-sm text-tertiary mt-2">
                No tasks for{" "}
                {isSelectedToday ? "today" : formatDisplayDate(selectedDate)}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render home view with expandable challenge cards
  const renderHome = () => {
    const activeChallenges = challenges.filter((c) => !c.is_archived)

    return (
      <div className="space-y-4">
        {/* Return After Absence Note */}
        {isReturning && (
          <ReturnNote daysAway={daysAway} onDismiss={dismissReturn} />
        )}

        {activeChallenges.length > 0 ? (
          activeChallenges.map((challenge) => {
            const challengeTasks = tasks.filter(
              (t) => t.challenge_id === challenge.id,
            )
            const stats = getCompletionStats(challenge, challengeTasks)
            const isExpanded = expandedChallenges[challenge.id]
            const daysRemaining =
              challenge.end_date >= today
                ? daysDiff(today, challenge.end_date) + 1
                : 0

            // Today's Progress
            let todayTarget = 0
            let todayDone = 0
            challengeTasks.forEach((task) => {
              if (isTaskActiveOnDate(task, today)) {
                todayTarget += task.frequency_count || 1
                const taskCompletions = completions.filter(
                  (c) => c.task_id === task.id && c.date === today,
                ).length
                todayDone += Math.min(
                  taskCompletions,
                  task.frequency_count || 1,
                )
              }
            })

            return (
              <div key={challenge.id} className="space-y-3">
                {/* Companion Insight Card */}
                {isCompanionEnabled && (
                  <CompanionInsightCard
                    challenge={challenge}
                    tasks={challengeTasks}
                    completions={completions}
                    onChat={() => handleOpenChat(challenge)}
                  />
                )}

                <Card padding="lg" className="overflow-hidden">
                  {/* Challenge Header */}
                  <div className="flex items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-primary truncate">
                          {challenge.name}
                        </h3>
                        {challenge.reward_text && (
                          <Gift className="w-4 h-4 text-task-yellow flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
                        <span>
                          {challengeTasks.length} task
                          {challengeTasks.length !== 1 ? "s" : ""}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDisplayDate(challenge.start_date)} →{" "}
                          {formatDisplayDate(challenge.end_date)}
                        </span>
                        {daysRemaining > 0 && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span
                              className={cn(
                                daysRemaining <= 3 &&
                                  "text-task-orange font-medium",
                              )}
                            >
                              {daysRemaining}d left
                            </span>
                          </>
                        )}
                      </div>
                      {/* Ambient Note */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenChat(challenge)
                        }}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <AmbientNote
                          challenge={challenge}
                          tasks={challengeTasks}
                          completions={completions}
                        />
                      </div>
                    </div>

                    {/* Completion Stats */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {stats.overall}%
                      </div>
                      <div className="text-xs text-tertiary">progress</div>
                      {todayTarget > 0 ? (
                        <div className="text-xs font-medium text-primary mt-1">
                          Today: {todayDone}/{todayTarget}
                        </div>
                      ) : (
                        <div className="text-xs text-tertiary mt-1">
                          No tasks
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditChallenge(challenge)
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Edit2 className="w-4 h-4 text-tertiary" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChallenge(challenge.id)
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Trash2 className="w-4 h-4 text-tertiary hover:text-task-red" />
                      </button>
                    </div>
                  </div>

                  {/* Always show content */}
                  {renderChallengeContent(challenge)}
                </Card>
              </div>
            )
          })
        ) : (
          <Card padding="lg" className="text-center">
            <p className="text-secondary mb-4">No active challenges</p>
            <Button onClick={() => setShowChallengeModal(true)}>
              Create Your First Challenge
            </Button>
          </Card>
        )}

        {/* Inline New Challenge Card - Soft Focus design */}
        {challenges.filter((c) => !c.is_archived).length > 0 && (
          <button
            onClick={() => setShowChallengeModal(true)}
            className="invite-card w-full"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Start a new challenge</span>
          </button>
        )}
      </div>
    )
  }

  // Show landing page for new visitors (unless viewing privacy)
  if (!isAuthenticated && !hasStarted && !showPrivacy) {
    return (
      <LandingPage
        onGetStarted={handleGetStarted}
        onSignIn={signInWithGoogle}
        loading={authLoading}
        onViewPrivacy={() => setShowPrivacy(true)}
      />
    )
  }

  // Show privacy policy page
  if (showPrivacy) {
    return <PrivacyPolicyPage onBack={() => setShowPrivacy(false)} />
  }

  // Get active challenges for sidebar
  const activeChallenges = challenges.filter((c) => !c.is_archived)

  // Get currently selected challenge
  const selectedChallenge = activeChallenges.find(
    (c) => c.id === selectedChallengeId,
  )

  return (
    <div className="app-layout bg-app">
      {/* Sidebar */}
      <Sidebar
        challenges={activeChallenges}
        tasks={tasks}
        completions={completions}
        selectedChallengeId={selectedChallengeId}
        onSelectChallenge={setSelectedChallengeId}
        onNewChallenge={() => setShowChallengeModal(true)}
        onOpenSettings={() => setShowAISettings(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Sidebar Toggle (shows when sidebar is hidden) */}
      <SidebarToggle
        onClick={() => setSidebarCollapsed(false)}
        isVisible={sidebarCollapsed}
      />

      {/* Main Content */}
      <div
        className={cn("main-content", sidebarCollapsed && "sidebar-collapsed")}
      >
        {/* Mobile Header */}
        <MobileHeader
          onMenuClick={() => setSidebarOpen(true)}
          title={selectedChallenge?.name || "BYOC"}
        />

        {/* Main Content Area */}
        <main className="main-content-inner">
          {/* Return After Absence Note */}
          {isReturning && (
            <ReturnNote daysAway={daysAway} onDismiss={dismissReturn} />
          )}

          {selectedChallenge ? (
            <>
              {/* Challenge Detail Dashboard */}
              {renderChallengeDetail(selectedChallenge)}
            </>
          ) : activeChallenges.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="py-8">
                <h2 className="text-h2 mb-2">Welcome to BYOC</h2>
                <p className="text-secondary mb-6">
                  Create your first challenge to get started
                </p>
                <Button onClick={() => setShowChallengeModal(true)}>
                  Create Your First Challenge
                </Button>
              </div>
            </Card>
          ) : (
            <div className="text-center py-12 text-tertiary">
              Select a challenge from the sidebar
            </div>
          )}
        </main>
      </div>

      {/* AI Chat FAB - Floating Action Button */}
      {isCompanionEnabled && selectedChallenge && (
        <button
          onClick={() => handleOpenChat(selectedChallenge)}
          className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
            boxShadow:
              "0 4px 14px rgba(99, 102, 241, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1)",
          }}
          aria-label="Open AI Chat"
          title="Chat with AI Companion"
        >
          {config?.companion_photo_url ? (
            <img
              src={config.companion_photo_url}
              alt={config?.companion_name || "AI Companion"}
              className="w-14 h-14 object-cover ring-2 ring-indigo-500"
            />
          ) : (
            <div
              className="w-14 h-14 flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          )}
        </button>
      )}

      {/* Challenge Modal */}
      <Modal
        isOpen={showChallengeModal}
        onClose={() => {
          setShowChallengeModal(false)
          setEditingChallenge(null)
        }}
        title={editingChallenge ? "Edit Challenge" : "New Challenge"}
        size="lg"
      >
        <ChallengeForm
          challenge={editingChallenge}
          onSubmit={handleSaveChallenge}
          onCancel={() => {
            setShowChallengeModal(false)
            setEditingChallenge(null)
          }}
        />
      </Modal>

      {/* Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setEditingTask(null)
          setSelectedChallengeForTask(null)
        }}
        title={editingTask ? "Edit Task" : "New Task"}
        size="lg"
      >
        <TaskForm
          task={editingTask}
          onSubmit={handleSaveTask}
          onCancel={() => {
            setShowTaskModal(false)
            setEditingTask(null)
            setSelectedChallengeForTask(null)
          }}
        />
      </Modal>

      {/* Summary Modal */}
      <Modal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        title=""
        size="lg"
        showClose={false}
      >
        {editingChallenge && (
          <ChallengeSummary
            challenge={editingChallenge}
            tasks={tasks.filter((t) => t.challenge_id === editingChallenge.id)}
            completionStats={getCompletionStats(
              editingChallenge,
              tasks.filter((t) => t.challenge_id === editingChallenge.id),
            )}
            onArchive={async () => {
              await archiveChallenge(editingChallenge.id)
              setShowSummaryModal(false)
              fetchChallenges()
            }}
            onExtend={async (days) => {
              await extendChallenge(editingChallenge.id, days)
              setShowSummaryModal(false)
              fetchChallenges()
            }}
            onClose={() => setShowSummaryModal(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.type !== null}
        onClose={() => setDeleteConfirm({ type: null, id: null })}
        onConfirm={executeDelete}
        title={
          deleteConfirm.type === "challenge"
            ? "Delete Challenge"
            : "Delete Task"
        }
        message={
          deleteConfirm.type === "challenge"
            ? "Delete this challenge and all its tasks? This cannot be undone."
            : "Delete this task? This cannot be undone."
        }
        confirmText="Delete"
        variant="danger"
      />

      {/* Settings Modal */}
      <Modal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        title="Settings"
        size="lg"
      >
        <SettingsPanel onClose={() => setShowAISettings(false)} />
      </Modal>

      {/* Chat Panel */}
      {showChat && (
        <ConversationPanel
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          initialContext={chatInitialContext}
          challenges={(challenges || []).filter((c) => !c.is_archived)}
          tasks={tasks || []}
          completions={completions || []}
        />
      )}
    </div>
  )
}

export default App
