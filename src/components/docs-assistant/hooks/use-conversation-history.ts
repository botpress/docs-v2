import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'docs-assistant-conversations'
const TITLES_STORAGE_KEY = 'docs-assistant-conversation-titles'

export type ConversationTitles = Record<string, string>

export function useConversationHistory() {
  const [conversationIds, setConversationIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [conversationTitles, setConversationTitles] = useState<ConversationTitles>(() => {
    try {
      const stored = localStorage.getItem(TITLES_STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const ids = stored ? JSON.parse(stored) : []
      return ids.length > 0 ? ids[ids.length - 1] : undefined
    } catch {
      return undefined
    }
  })

  // Sync conversation IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationIds))
    } catch {
      /* ignore */
    }
  }, [conversationIds])

  // Sync titles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TITLES_STORAGE_KEY, JSON.stringify(conversationTitles))
    } catch {
      /* ignore */
    }
  }, [conversationTitles])

  const addConversation = useCallback((conversationId: string) => {
    setConversationIds((prev) => {
      if (prev.includes(conversationId)) {
        return prev
      }
      return [...prev, conversationId]
    })
    setSelectedConversationId(conversationId)
  }, [])

  const moveToTop = useCallback((conversationId: string) => {
    setConversationIds((prev) => {
      const filtered = prev.filter((id) => id !== conversationId)
      return [...filtered, conversationId]
    })
    setSelectedConversationId(conversationId)
  }, [])

  const removeConversation = useCallback(
    (conversationId: string) => {
      setConversationIds((prev) => {
        const newIds = prev.filter((id) => id !== conversationId)
        if (selectedConversationId === conversationId && newIds.length > 0) {
          setSelectedConversationId(newIds[newIds.length - 1])
        } else if (newIds.length === 0) {
          setSelectedConversationId(undefined)
        }
        return newIds
      })
      // Also remove the title
      setConversationTitles((prev) => {
        const newTitles = { ...prev }
        delete newTitles[conversationId]
        return newTitles
      })
    },
    [selectedConversationId]
  )

  const setConversationTitle = useCallback((conversationId: string, title: string) => {
    setConversationTitles((prev) => ({
      ...prev,
      [conversationId]: title,
    }))
  }, [])

  const getConversationTitle = useCallback(
    (conversationId: string): string => {
      return conversationTitles[conversationId] || 'New chat'
    },
    [conversationTitles]
  )

  const clearAllConversations = useCallback(() => {
    setConversationIds([])
    setConversationTitles({})
    setSelectedConversationId(undefined)
  }, [])

  return {
    conversationIds,
    selectedConversationId,
    conversationTitles,
    addConversation,
    moveToTop,
    removeConversation,
    setConversationTitle,
    getConversationTitle,
    clearAllConversations,
  }
}
