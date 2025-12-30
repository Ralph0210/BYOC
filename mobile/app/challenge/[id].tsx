/**
 * Challenge Detail Screen
 *
 * Shows challenge progress with date strip and task list.
 * Allows toggling task completion for selected date.
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
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"
import { DateStrip, TaskItem, ProgressRing } from "../../components"
import { useChallenges, ChallengeDB } from "../../hooks/useChallenges"
import { useTasks } from "../../hooks/useTasks"
import { useCompletions } from "../../hooks/useCompletions"
import { typography, spacing, radius, shadows } from "../../lib/theme"
import {
  getToday,
  getChallengeDay,
  getChallengeTotalDays,
  isTaskActiveOnDate,
  isDateInChallenge,
} from "../../lib/utils"

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useTheme()

  const { challenges, fetchChallenges } = useChallenges()
  const { tasks, fetchTasks, deleteTask } = useTasks()
  const {
    completions,
    completionSet,
    fetchCompletions,
    toggleCompletion,
    isCompleted,
  } = useCompletions()

  const [selectedDate, setSelectedDate] = useState(getToday())
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Find the current challenge
  const challenge = challenges.find((c) => c.id === id)

  // Get tasks for this challenge
  const challengeTasks = useMemo(
    () => tasks.filter((t) => t.challenge_id === id),
    [tasks, id]
  )

  // Get active tasks for selected date
  const activeTasks = useMemo(
    () => challengeTasks.filter((t) => isTaskActiveOnDate(t, selectedDate)),
    [challengeTasks, selectedDate]
  )

  // Calculate completion percentage
  const completionPercent = useMemo(() => {
    if (activeTasks.length === 0) return 100
    const completedCount = activeTasks.filter((t) =>
      completionSet.has(`${t.id}:${selectedDate}`)
    ).length
    return Math.round((completedCount / activeTasks.length) * 100)
  }, [activeTasks, completionSet, selectedDate])

  // Load data
  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    await fetchChallenges()
    const taskData = await fetchTasks(id)
    if (taskData.length > 0) {
      const taskIds = taskData.map((t) => t.id)
      await fetchCompletions(taskIds)
    }
    setLoading(false)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [id])

  const handleToggleTask = async (taskId: string) => {
    await toggleCompletion(taskId, selectedDate)
  }

  const confirmDeleteTask = (taskId: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteTask(taskId)
            if (!success) {
              Alert.alert("Error", "Failed to delete task")
            }
          },
        },
      ]
    )
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  // Clamp selected date to challenge range
  useEffect(() => {
    if (challenge) {
      if (selectedDate < challenge.start_date) {
        setSelectedDate(challenge.start_date)
      } else if (selectedDate > challenge.end_date) {
        setSelectedDate(challenge.end_date)
      }
    }
  }, [challenge, selectedDate])

  // Loading state
  if (loading && !challenge) {
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

  // Not found state
  if (!challenge) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.textTertiary}
        />
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.md },
          ]}
        >
          Challenge not found
        </Text>
      </View>
    )
  }

  const currentDay = getChallengeDay(challenge, selectedDate)
  const totalDays = getChallengeTotalDays(challenge)
  const isToday = selectedDate === getToday()

  return (
    <>
      <Stack.Screen
        options={{
          title: challenge.name,
          headerBackTitle: "Home",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Progress Header */}
        <View
          style={[
            styles.progressHeader,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.progressInfo}>
            <Text style={[typography.title3, { color: colors.textPrimary }]}>
              Day {currentDay} of {totalDays}
            </Text>
            <Text
              style={[typography.subheadline, { color: colors.textSecondary }]}
            >
              {isToday ? "Today" : selectedDate}
            </Text>
          </View>
          <ProgressRing
            progress={completionPercent}
            size={56}
            strokeWidth={5}
            showPercent
          />
        </View>

        {/* Date Strip */}
        <View style={{ backgroundColor: colors.surface }}>
          <DateStrip
            selectedDate={selectedDate}
            startDate={challenge.start_date}
            endDate={challenge.end_date}
            onSelectDate={handleDateChange}
          />
        </View>

        {/* Tasks List */}
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
          {activeTasks.length === 0 ? (
            <View style={styles.emptyTasks}>
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginTop: spacing.md },
                ]}
              >
                No tasks scheduled for this day
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.taskList,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {activeTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={isCompleted(task.id, selectedDate)}
                  onToggle={() => handleToggleTask(task.id)}
                  lastCompletedDate={
                    completions
                      .filter((c) => c.task_id === task.id)
                      .sort((a, b) => b.date.localeCompare(a.date))[0]?.date ||
                    null
                  }
                  onDelete={() => confirmDeleteTask(task.id)}
                />
              ))}
            </View>
          )}

          {/* Add Task Button */}
          <TouchableOpacity
            style={[styles.addTaskButton, { borderColor: colors.border }]}
            onPress={() => {
              router.push({
                pathname: "/task/new",
                params: { challengeId: challenge.id },
              })
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={colors.textTertiary}
            />
            <Text
              style={[
                typography.subheadline,
                { color: colors.textTertiary, marginLeft: spacing.sm },
              ]}
            >
              Add New Task
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressInfo: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.massive,
  },
  emptyTasks: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  taskList: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
  },
})
