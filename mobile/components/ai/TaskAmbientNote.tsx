import React from "react"
import { View, Text, StyleSheet, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAIConfig } from "../../hooks/useAIConfig"
import { useAmbientNotes } from "../../hooks/useAmbientNotes"
import { AmbientNoteCard } from "../AmbientNoteCard"
import { TaskDB } from "../../hooks/useTasks"

interface TaskAmbientNoteProps {
  task: TaskDB
  lastCompletedDate: string | null
}

export function TaskAmbientNote({
  task,
  lastCompletedDate,
}: TaskAmbientNoteProps) {
  const { config } = useAIConfig()

  const daysSinceLastDone = lastCompletedDate
    ? Math.floor(
        (new Date().getTime() - new Date(lastCompletedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 999

  // Only show for tasks not done in 3+ days
  if (daysSinceLastDone < 3) return null

  const contextData = {
    taskName: task.name,
    daysSinceLastDone,
  }

  const { note, loading } = useAmbientNotes("task", contextData)

  if (!config?.api_key || !note) {
    if (loading) {
      return <AmbientNoteCard note={null} loading={true} variant="inline" />
    }
    return null
  }

  return <AmbientNoteCard note={note} variant="inline" />
}
