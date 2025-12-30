/**
 * Home Screen (Dashboard)
 *
 * Dashboard view showing specific challenge progress, AI insights, and daily tasks.
 * Matches web app dashboard design.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useChallenges } from "../../hooks/useChallenges"
import { useTasks } from "../../hooks/useTasks"
import { useCompletions } from "../../hooks/useCompletions"
import { useAIConfig } from "../../hooks/useAIConfig"
import { CompanionInsightCard } from "../../components/ai/CompanionInsightCard"
import { CalendarGrid } from "../../components/CalendarGrid"
import { TaskItem } from "../../components/TaskItem"
import { typography, spacing, radius } from "../../lib/theme"
import {
  getToday,
  isTaskActiveOnDate,
  daysDiff,
  formatDisplayDate,
} from "../../lib/utils"

export default function HomeScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const { config } = useAIConfig()

  const {
    challenges,
    loading: challengesLoading,
    fetchChallenges,
  } = useChallenges()
  const { tasks, fetchTasksForChallenges } = useTasks()
  const {
    completions,
    completionSet,
    fetchCompletions,
    toggleCompletion,
    isCompleted,
  } = useCompletions()

  const [refreshing, setRefreshing] = useState(false)
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null
  )
  const [selectedDate, setSelectedDate] = useState(getToday())
  const today = getToday()

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Auto-select first active challenge
  useEffect(() => {
    if (!selectedChallengeId && challenges.length > 0) {
      // Prefer active (not archived) - assume filtered by backend or hook if applicable
      // For now just pick first
      setSelectedChallengeId(challenges[0].id)
    }
  }, [challenges, selectedChallengeId])

  const loadData = async () => {
    const challengeData = await fetchChallenges()
    if (challengeData.length > 0) {
      const challengeIds = challengeData.map((c) => c.id)
      const taskData = await fetchTasksForChallenges(challengeIds)
      const taskIds = taskData.map((t) => t.id)
      await fetchCompletions(taskIds)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  // Derived state
  const selectedChallenge = useMemo(
    () => challenges.find((c) => c.id === selectedChallengeId),
    [challenges, selectedChallengeId]
  )

  const challengeTasks = useMemo(
    () => tasks.filter((t) => t.challenge_id === selectedChallengeId),
    [tasks, selectedChallengeId]
  )

  const activeTasksForDate = useMemo(
    () => challengeTasks.filter((t) => isTaskActiveOnDate(t, selectedDate)),
    [challengeTasks, selectedDate]
  )

  // Stats
  const stats = useMemo(() => {
    if (!selectedChallenge) return null
    const relevantTasks = challengeTasks
    const activeToday = relevantTasks.filter((t) =>
      isTaskActiveOnDate(t, today)
    )
    const completedToday = activeToday.filter((t) =>
      isCompleted(t.id, today)
    ).length

    // Overall progress (simplified - ideally use calculateChallengeStats from utils)
    // Calculating approximate overall progress based on all tasks/completions?
    // Or just today? Web dashboard shows overall %.
    // Let's rely on cached/local calculation if possible, or simple active/total.
    // For now, let's use a placeholder or simple logic:
    // (Total Completions / Total Possible Completions)
    // This is hard to calc perfectly without generating every day.
    // Web uses "calculateChallengeStats". I'll use a placeholder "50%" or calculate daily.

    const daysElapsed = daysDiff(selectedChallenge.start_date, today) + 1
    const totalDays =
      daysDiff(selectedChallenge.start_date, selectedChallenge.end_date) + 1

    return {
      daysElapsed,
      totalDays,
      daysRemaining: Math.max(0, totalDays - daysElapsed),
      todayProgress:
        activeToday.length > 0
          ? Math.round((completedToday / activeToday.length) * 100)
          : 0,
    }
  }, [selectedChallenge, challengeTasks, completionSet, today])

  const handleToggleTask = async (taskId: string) => {
    await toggleCompletion(taskId, selectedDate)
  }

  const handleChallengeSelect = () => {
    if (challenges.length <= 1) return

    Alert.alert(
      "Select Challenge",
      "Choose a challenge to view",
      challenges
        .map((c) => ({
          text: c.name,
          onPress: () => setSelectedChallengeId(c.id),
          style: "default",
        }))
        .concat([{ text: "Cancel", style: "cancel", onPress: () => {} }])
    )
  }

  // Loading state
  if (challengesLoading && !refreshing && challenges.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  // Empty State (No Challenges)
  if (challenges.length === 0 && !challengesLoading) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons name="trophy-outline" size={64} color={colors.accentSoft} />
        <Text
          style={[
            typography.title3,
            { color: colors.textPrimary, marginTop: spacing.lg },
          ]}
        >
          No Active Challenges
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: spacing.sm,
              maxWidth: 250,
            },
          ]}
        >
          Go to Settings to create your first challenge and start your journey.
        </Text>

        {/* Helper button to go to settings since we moved the create button */}
        <TouchableOpacity
          style={[
            styles.settingsButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/settings")}
        >
          <Text style={[typography.subheadline, { color: colors.accent }]}>
            Go to Settings
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!selectedChallenge) return null

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header / Selector */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={handleChallengeSelect}
          activeOpacity={challenges.length > 1 ? 0.6 : 1}
          style={styles.headerTitleContainer}
        >
          <Text style={[typography.title3, { color: colors.textPrimary }]}>
            {selectedChallenge.name}
          </Text>
          {challenges.length > 1 && (
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.textTertiary}
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>

        {selectedChallenge.reward_text && (
          <Ionicons name="gift-outline" size={20} color="#eab308" />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Overview Section */}
        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[typography.caption1, { color: colors.textSecondary }]}
            >
              {formatDisplayDate(selectedChallenge.start_date)} →{" "}
              {formatDisplayDate(selectedChallenge.end_date)}
            </Text>
            {stats && stats.daysRemaining > 0 ? (
              <Text
                style={[
                  typography.subheadlineBold,
                  { color: colors.accent, marginTop: 2 },
                ]}
              >
                {stats.daysRemaining} days left
              </Text>
            ) : (
              <Text
                style={[
                  typography.subheadlineBold,
                  { color: colors.success, marginTop: 2 },
                ]}
              >
                Completed
              </Text>
            )}
          </View>

          <View style={styles.circularProgress}>
            <Text style={[typography.title2, { color: colors.accent }]}>
              {stats?.todayProgress || 0}%
            </Text>
            <Text style={[typography.caption2, { color: colors.textTertiary }]}>
              today
            </Text>
          </View>
        </View>

        {/* AI Insight Card */}
        {config?.api_key && (
          <CompanionInsightCard
            challenge={selectedChallenge}
            tasks={challengeTasks}
            completions={completions}
            onChat={() => {
              // TODO: Open chat modal
              Alert.alert("Coming Soon", "Chat interface is under construction")
            }}
          />
        )}

        {/* Heatmap / Calendar */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[
                typography.subheadlineBold,
                { color: colors.textPrimary, marginLeft: spacing.xs },
              ]}
            >
              Progress
            </Text>
          </View>
          <CalendarGrid
            tasks={challengeTasks}
            completions={completions}
            startDate={selectedChallenge.start_date}
            endDate={selectedChallenge.end_date}
            selectedDate={selectedDate}
            onDateClick={setSelectedDate}
            weeksToShow={12}
          />
        </View>

        {/* Task List */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="list-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  typography.subheadlineBold,
                  { color: colors.textPrimary, marginLeft: spacing.xs },
                ]}
              >
                Tasks
              </Text>
              {activeTasksForDate.length > 0 && (
                <View
                  style={[styles.badge, { backgroundColor: colors.accentSoft }]}
                >
                  <Text style={[typography.caption2, { color: colors.accent }]}>
                    {
                      activeTasksForDate.filter((t) =>
                        isCompleted(t.id, selectedDate)
                      ).length
                    }
                    /{activeTasksForDate.length}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[typography.caption1, { color: colors.textTertiary }]}>
              {selectedDate === today ? "Today" : selectedDate}
            </Text>
          </View>

          {activeTasksForDate.length > 0 ? (
            <View style={{ marginTop: spacing.sm }}>
              {activeTasksForDate.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={isCompleted(task.id, selectedDate)}
                  onToggle={() => handleToggleTask(task.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyTasks}>
              <Text
                style={[
                  typography.body,
                  { color: colors.textTertiary, fontStyle: "italic" },
                ]}
              >
                No tasks scheduled for this day
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.inlineAddButton}
            onPress={() => {
              // Initial implementation: Just show alert or nav to settings as generic "add" placeholder since we lack Task Form page
              // The user objective said "move Add BUTTON to settings". It didn't say remove functionality.
              // But "Home page, show all the things like web app". Web app has "Add" button in the task list card.
              // Mobile doesn't have Task Form implemented yet (Task 1 in Missing Features).
              Alert.alert("Add Task", "Task creation screen is coming soon!")
            }}
          >
            <Ionicons name="add" size={16} color={colors.textTertiary} />
            <Text style={[typography.caption1, { color: colors.textTertiary }]}>
              Add Task
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reward Section */}
        {selectedChallenge.reward_text && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="gift-outline" size={16} color="#eab308" />
              <Text
                style={[
                  typography.subheadlineBold,
                  { color: colors.textPrimary, marginLeft: spacing.xs },
                ]}
              >
                Reward
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: spacing.xs },
              ]}
            >
              {selectedChallenge.reward_text}
            </Text>
            {selectedChallenge.reward_link && (
              <TouchableOpacity
                onPress={() => {
                  // Open link
                  Alert.alert("Link", selectedChallenge.reward_link)
                }}
                style={{ marginTop: spacing.sm }}
              >
                <Text style={[typography.caption1, { color: colors.accent }]}>
                  View Reward Link ↗
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  settingsButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.massive,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  circularProgress: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "rgba(139, 92, 246, 0.2)", // Light purple
  },
  section: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  emptyTasks: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  inlineAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
})
