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
} from "lucide-react"
import { Header } from "./components/layout/Header"
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
import { useTheme } from "./hooks/useTheme"
import { useAuth } from "./hooks/useAuth.jsx"
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
import { calculateChallengeStats } from "./lib/stats"
import {
  AmbientNote,
  ReturnNote,
  EmptyStateNote,
} from "./components/ai/AmbientNote"
import { ConversationPanel } from "./components/ai/ConversationPanel"
import { AIConfigForm } from "./components/ai/AIConfigForm"
import { useReturnDetection } from "./hooks/useAmbientNotes"

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
    return localStorage.getItem("path_has_started") === "true"
  })

  const handleGetStarted = () => {
    localStorage.setItem("path_has_started", "true")
    setHasStarted(true)
  }

  const today = getToday()
  const [expandedChallenges, setExpandedChallenges] = useState({})
  const [selectedDates, setSelectedDates] = useState({}) // Per-challenge date selection

  // Modals
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedChallengeForTask, setSelectedChallengeForTask] = useState(null)

  // AI State
  const [showAISettings, setShowAISettings] = useState(false)
  const [chatChallengeId, setChatChallengeId] = useState(null)
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

  // Initial data fetch
  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

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
              dates[0].start
            )
            fetchCompletions(taskIds, startDate, today)
          }
        })
      }
    }
  }, [challenges, today, fetchTasksForChallenges, fetchCompletions])

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
      return calculateChallengeStats(challenge, challengeTasks, completions)
    },
    [completions]
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
    [tasks, getCompletionCountForTask, addCompletion]
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
          dates[0].start
        )
        fetchCompletions(taskIds, startDate, today)
      }
    },
    [challenges, tasks, removeCompletion, fetchCompletions, today]
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
        dates[0].start
      )
      fetchCompletions(taskIds, startDate, today)
    }
  }, [challenges, tasks, fetchCompletions, today])

  // Challenge handlers
  const handleSaveChallenge = async (data) => {
    if (editingChallenge) {
      await updateChallenge(editingChallenge.id, data)
    } else {
      await createChallenge(data)
    }
    setShowChallengeModal(false)
    setEditingChallenge(null)
    fetchChallenges()
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
    // Refetch tasks
    const challengeIds = challenges
      .filter((c) => !c.is_archived)
      .map((c) => c.id)
    fetchTasksForChallenges(challengeIds)
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
      isTaskActiveOnDate(t, selectedDate)
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
            startDate={challenge.start_date}
            endDate={challenge.end_date}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            weeksToShow={Math.min(
              Math.ceil(
                daysDiff(challenge.start_date, challenge.end_date) / 7
              ) + 1,
              8
            )}
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
                  !canGoPrev && "opacity-40 cursor-not-allowed"
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
                    : "text-secondary hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  !canGoNext && "opacity-40 cursor-not-allowed"
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
                    selectedDate
                  )}
                  onComplete={handleCompleteTask}
                  onUncomplete={handleUncompleteTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
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
              (t) => t.challenge_id === challenge.id
            )
            const stats = getCompletionStats(challenge, challengeTasks)
            const isExpanded = expandedChallenges[challenge.id]
            const daysRemaining =
              challenge.end_date >= today
                ? daysDiff(today, challenge.end_date)
                : 0

            // Today's Progress
            let todayTarget = 0
            let todayDone = 0
            challengeTasks.forEach((task) => {
              if (isTaskActiveOnDate(task, today)) {
                todayTarget += task.frequency_count || 1
                const taskCompletions = completions.filter(
                  (c) => c.task_id === task.id && c.date === today
                ).length
                todayDone += Math.min(
                  taskCompletions,
                  task.frequency_count || 1
                )
              }
            })

            return (
              <Card key={challenge.id} padding="lg" className="overflow-hidden">
                {/* Challenge Header */}
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => toggleChallenge(challenge.id)}
                >
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
                                "text-task-orange font-medium"
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
                        setChatChallengeId(challenge.id)
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
                      <div className="text-xs text-tertiary mt-1">No tasks</div>
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
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-tertiary" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-tertiary" />
                    )}
                  </div>
                </div>

                {/* Journey Progress Bar */}

                {/* Expanded Content */}
                {isExpanded && renderChallengeContent(challenge)}
              </Card>
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
      </div>
    )
  }

  // Show landing page for new visitors
  if (!hasStarted && !isAuthenticated) {
    return (
      <LandingPage
        onGetStarted={handleGetStarted}
        onSignIn={signInWithGoogle}
        loading={authLoading}
      />
    )
  }

  return (
    <div className="min-h-screen bg-app">
      <Header
        title="Path"
        subtitle={formatDisplayDate(today)}
        onOpenAISettings={() => setShowAISettings(true)}
      />

      <main className="max-w-3xl mx-auto px-4 pb-24 pt-6 md:pb-6">
        {renderHome()}
      </main>

      {/* Floating action button - Safe area aware */}
      <button
        onClick={() => setShowChallengeModal(true)}
        aria-label="Create new challenge"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600 active:scale-95 transition-all flex items-center justify-center z-30"
      >
        <Plus className="w-7 h-7" />
      </button>

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
              tasks.filter((t) => t.challenge_id === editingChallenge.id)
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

      {/* AI Settings Modal */}
      <Modal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        title="AI Settings"
        size="lg"
      >
        <AIConfigForm />
      </Modal>

      {/* Chat Panel */}
      {chatChallengeId && (
        <ConversationPanel
          challenge={challenges.find((c) => c.id === chatChallengeId)}
          tasks={tasks.filter((t) => t.challenge_id === chatChallengeId)}
          completions={completions}
          onClose={() => setChatChallengeId(null)}
        />
      )}
    </div>
  )
}

export default App
