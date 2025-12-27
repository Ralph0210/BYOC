import { Trophy, ExternalLink, Archive, Plus, Calendar } from "lucide-react"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import { formatFullDate, calculateCompletionPercentage } from "../../lib/utils"

export function ChallengeSummary({
  challenge,
  tasks,
  completionStats,
  onArchive,
  onExtend,
  onClose,
}) {
  const overallCompletion = completionStats.overall || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-task-yellow to-task-orange flex items-center justify-center">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">
          Challenge Complete!
        </h2>
        <p className="text-secondary">{challenge.name}</p>
        <p className="text-sm text-tertiary mt-1">
          {formatFullDate(challenge.start_date)} —{" "}
          {formatFullDate(challenge.end_date)}
        </p>
      </div>

      {/* Overall Stats */}
      <Card padding="lg" className="text-center">
        <div className="text-5xl font-bold text-primary mb-2">
          {Math.round(overallCompletion)}%
        </div>
        <p className="text-secondary">Overall Completion</p>
      </Card>

      {/* Task Breakdown */}
      <div>
        <h3 className="text-sm font-medium text-secondary mb-3">
          Task Breakdown
        </h3>
        <div className="space-y-2">
          {tasks.map((task) => {
            const taskStats = completionStats.byTask?.[task.id] || {
              completed: 0,
              total: 0,
            }
            const percentage = calculateCompletionPercentage(
              taskStats.completed,
              taskStats.total
            )

            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-light dark:bg-gray-800"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: task.color }}
                />
                <span className="flex-1 text-sm text-primary">{task.name}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: task.color }}
                >
                  {percentage}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reward */}
      {challenge.reward_text && (
        <Card
          padding="lg"
          className="bg-gradient-to-br from-task-yellow/10 to-task-orange/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-task-yellow/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-task-yellow" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-primary mb-1">Your Reward</h4>
              <p className="text-secondary">{challenge.reward_text}</p>
              {challenge.reward_link && (
                <a
                  href={challenge.reward_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary-500 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Product
                </a>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => onExtend(7)}
            className="flex-1"
          >
            +7 Days
          </Button>
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => onExtend(30)}
            className="flex-1"
          >
            +30 Days
          </Button>
        </div>
        <Button
          variant="secondary"
          icon={Archive}
          onClick={onArchive}
          className="w-full"
        >
          Archive Challenge
        </Button>
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    </div>
  )
}
