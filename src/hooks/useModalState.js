import { useState, useCallback } from "react"

/**
 * Custom hook for managing multiple modal states in one place.
 * Reduces boilerplate and ensures consistent modal handling.
 */
export function useModalState() {
  const [modals, setModals] = useState({
    challenge: false,
    task: false,
    summary: false,
    aiSettings: false,
  })

  const [editing, setEditing] = useState({
    challenge: null,
    task: null,
  })

  const [selected, setSelected] = useState({
    challengeForTask: null,
    chatChallengeId: null,
  })

  const openModal = useCallback((modalName, editItem = null) => {
    setModals((prev) => ({ ...prev, [modalName]: true }))
    if (editItem && (modalName === "challenge" || modalName === "task")) {
      setEditing((prev) => ({ ...prev, [modalName]: editItem }))
    }
  }, [])

  const closeModal = useCallback((modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: false }))
    if (modalName === "challenge" || modalName === "task") {
      setEditing((prev) => ({ ...prev, [modalName]: null }))
    }
    if (modalName === "task") {
      setSelected((prev) => ({ ...prev, challengeForTask: null }))
    }
  }, [])

  const openTaskModalForChallenge = useCallback((challenge) => {
    setSelected((prev) => ({ ...prev, challengeForTask: challenge }))
    setEditing((prev) => ({ ...prev, task: null }))
    setModals((prev) => ({ ...prev, task: true }))
  }, [])

  const openChat = useCallback((challengeId) => {
    setSelected((prev) => ({ ...prev, chatChallengeId: challengeId }))
  }, [])

  const closeChat = useCallback(() => {
    setSelected((prev) => ({ ...prev, chatChallengeId: null }))
  }, [])

  return {
    // Modal visibility states
    showChallengeModal: modals.challenge,
    showTaskModal: modals.task,
    showSummaryModal: modals.summary,
    showAISettings: modals.aiSettings,

    // Editing items
    editingChallenge: editing.challenge,
    editingTask: editing.task,

    // Selected items
    selectedChallengeForTask: selected.challengeForTask,
    chatChallengeId: selected.chatChallengeId,

    // Actions
    openModal,
    closeModal,
    openTaskModalForChallenge,
    openChat,
    closeChat,

    // Convenience methods
    openChallengeModal: (challenge = null) => openModal("challenge", challenge),
    closeChallengeModal: () => closeModal("challenge"),
    openTaskModal: (task = null) => openModal("task", task),
    closeTaskModal: () => closeModal("task"),
    openSummaryModal: () => openModal("summary"),
    closeSummaryModal: () => closeModal("summary"),
    openAISettings: () => openModal("aiSettings"),
    closeAISettings: () => closeModal("aiSettings"),
  }
}
