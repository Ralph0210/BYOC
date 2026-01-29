import { useState } from "react"
import {
  RefreshCw,
  CheckSquare,
  Square,
  Sparkles,
  Plus,
  X,
  MessageSquare,
  Edit2,
} from "lucide-react"
import { Button } from "../ui/Button"
import { PlanTaskItem } from "./PlanTaskItem"
import { cn } from "../../lib/utils"

const FREQUENCY_PRESETS = [
  { id: "daily", label: "Daily" },
  { id: "3x", label: "3x/week" },
  { id: "2x", label: "2x/week" },
  { id: "1x", label: "1x/week" },
  { id: "flexible", label: "Flexible" },
]

export function PlanPreview({
  plan,
  selectedTasks,
  onToggleTask,
  onSelectAllWeek,
  onDeselectAllWeek,
  onRegenerateWeek,
  onRegenerateAll,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onConfirm,
  onBack,
  regeneratingWeek = null,
  regeneratingAll = false,
}) {
  const [showRegeneratePrompt, setShowRegeneratePrompt] = useState(false)
  const [regenerateInput, setRegenerateInput] = useState("")
  const [regenerateWeekTarget, setRegenerateWeekTarget] = useState(null)

  // Edit task state
  const [editingTask, setEditingTask] = useState(null) // { week, index, task }
  const [editForm, setEditForm] = useState({
    name: "",
    frequency: "",
    notes: "",
  })

  // Calculate selection stats
  const totalTasks = plan.phases.reduce(
    (sum, phase) => sum + phase.tasks.length,
    0,
  )
  const selectedCount = selectedTasks.length

  const handleRegenerateClick = (weekNumber = null) => {
    setRegenerateWeekTarget(weekNumber)
    setShowRegeneratePrompt(true)
    setRegenerateInput("")
  }

  const handleRegenerateSubmit = () => {
    if (regenerateWeekTarget) {
      onRegenerateWeek(regenerateWeekTarget, regenerateInput)
    } else {
      onRegenerateAll(regenerateInput)
    }
    setShowRegeneratePrompt(false)
    setRegenerateInput("")
  }

  const handleEditClick = (week, index, task) => {
    setEditingTask({ week, index, task })
    setEditForm({
      name: task.name,
      frequency: task.frequency || "",
      notes: task.notes || "",
      duration_minutes: task.duration_minutes || "",
    })
  }

  const handleEditSave = () => {
    if (editingTask && onUpdateTask) {
      onUpdateTask(editingTask.week, editingTask.index, {
        ...editingTask.task,
        name: editForm.name,
        frequency: editForm.frequency,
        notes: editForm.notes,
        duration_minutes: editForm.duration_minutes
          ? parseInt(editForm.duration_minutes)
          : null,
      })
    }
    setEditingTask(null)
  }

  const handleEditCancel = () => {
    setEditingTask(null)
  }

  return (
    <div className="space-y-4">
      {/* Edit Task Modal */}
      {editingTask && (
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-primary">
                Edit Task
              </span>
            </div>
            <button
              onClick={handleEditCancel}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 text-tertiary" />
            </button>
          </div>

          {/* Task Name */}
          <div>
            <label className="block text-xs text-tertiary mb-1">
              Task Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
              autoFocus
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs text-tertiary mb-1">
              Frequency
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {FREQUENCY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setEditForm({ ...editForm, frequency: preset.label })
                  }
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-all border",
                    editForm.frequency.toLowerCase().includes(preset.id) ||
                      editForm.frequency === preset.label
                      ? "bg-primary-500 text-white border-primary-500"
                      : "bg-transparent border-app text-secondary hover:border-primary-500",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={editForm.frequency}
              onChange={(e) =>
                setEditForm({ ...editForm, frequency: e.target.value })
              }
              placeholder="e.g., Daily, 3x per week, Mon/Wed/Fri"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs text-tertiary mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={editForm.duration_minutes}
              onChange={(e) =>
                setEditForm({ ...editForm, duration_minutes: e.target.value })
              }
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-tertiary mb-1">Notes</label>
            <input
              type="text"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              placeholder="Optional tip or reminder"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={handleEditCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditSave}
              disabled={!editForm.name.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Regenerate Prompt Modal */}
      {showRegeneratePrompt && (
        <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/20 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary">
                {regenerateWeekTarget
                  ? `Regenerate Week ${regenerateWeekTarget}`
                  : "Regenerate All"}
              </span>
            </div>
            <button
              onClick={() => setShowRegeneratePrompt(false)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 text-tertiary" />
            </button>
          </div>
          <input
            type="text"
            value={regenerateInput}
            onChange={(e) => setRegenerateInput(e.target.value)}
            placeholder="Optional: Add instructions (e.g., 'make it easier', 'focus more on the main goal')"
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRegeneratePrompt(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRegenerateSubmit}
              loading={regeneratingAll || regeneratingWeek !== null}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            {plan.plan_title}
          </h3>
          <p className="text-sm text-tertiary mt-1">
            {selectedCount} of {totalTasks} tasks selected
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRegenerateClick(null)}
          loading={regeneratingAll}
          icon={RefreshCw}
        >
          Regenerate
        </Button>
      </div>

      {/* Encouragement Note */}
      {plan.encouragement && (
        <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/20">
          <p className="text-sm text-secondary italic">{plan.encouragement}</p>
        </div>
      )}

      {/* Phases - Vertical Scroll */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 -mr-2">
        {plan.phases.map((phase, phaseIndex) => {
          // normalizing identifier: support phase.phase or phase.week
          const phaseId = phase.week || phase.phase || phaseIndex + 1
          const phaseName = phase.week
            ? `Week ${phase.week}: ${phase.name}`
            : phase.name

          const weekTasks = phase.tasks.map((t) => t.id)
          const allSelected = weekTasks.every((id) =>
            selectedTasks.includes(id),
          )

          return (
            <div key={phaseId} className="space-y-3">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-surface py-2 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-primary">{phaseName}</h4>
                    {phase.tagline && (
                      <p className="text-xs text-tertiary mt-0.5">
                        {phase.tagline}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Select All / Deselect All */}
                    <button
                      type="button"
                      onClick={() =>
                        allSelected
                          ? onDeselectAllWeek(phaseId)
                          : onSelectAllWeek(phaseId)
                      }
                      className="text-xs text-primary-500 hover:underline flex items-center gap-1"
                    >
                      {allSelected ? (
                        <>
                          <Square className="w-3 h-3" />
                          Deselect all
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3 h-3" />
                          Select all
                        </>
                      )}
                    </button>
                    {/* Regenerate Phase */}
                    <button
                      type="button"
                      onClick={() => handleRegenerateClick(phaseId)}
                      disabled={regeneratingWeek === phaseId}
                      className={cn(
                        "p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-tertiary hover:text-primary transition-colors",
                        regeneratingWeek === phaseId && "animate-spin",
                      )}
                      title="Regenerate this phase"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {phase.tasks.map((task, taskIndex) => {
                  const taskId = task.id
                  return (
                    <PlanTaskItem
                      key={taskId}
                      task={task}
                      selected={selectedTasks.includes(taskId)}
                      onToggle={() => onToggleTask(taskId)}
                      onEdit={() => handleEditClick(phaseId, taskIndex, task)}
                      onDelete={() => onDeleteTask(phaseId, taskIndex)}
                    />
                  )
                })}
                {/* Add Custom Task */}
                <button
                  type="button"
                  onClick={() => onAddTask(phaseId)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-tertiary hover:text-primary hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add custom task
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-app">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={selectedCount === 0}
          className="flex-1"
        >
          Create Challenge ({selectedCount})
        </Button>
      </div>
    </div>
  )
}
