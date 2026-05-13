import { WebchatProvider, useActiveConversation, useConversations, useUser, useWebchatContext } from '@botpress/webchat'
import { useStore } from '@nanostores/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ChatHeader } from './chat-header'
import { Composer } from './composer'
import { EmptyState } from './empty-state'
import { useContextManagement } from './hooks/use-context-management'
import { useConversationHistory } from './hooks/use-conversation-history'
import { Messages, type ChatMessage } from './messages'

import { CLIENT_ID } from './config'
import { currentPage, pendingMessage, panelOpen } from './store'

function AssistantInner() {
  const isOpen = useStore(panelOpen)
  const pending = useStore(pendingMessage)

  const { messages, sendMessage: sendMessageRaw, status, conversationId } = useActiveConversation()

  const { userCredentials } = useUser()
  const userId = userCredentials?.userId

  const { openConversation } = useConversations()
  const { emitter } = useWebchatContext()

  const {
    conversationIds,
    addConversation,
    moveToTop,
    setConversationTitle,
    getConversationTitle,
    clearAllConversations,
  } = useConversationHistory()

  const isReady = status === 'connected'

  const { currentContext, setCurrentContext, suggestedContext, addSuggestedContext, inputRef, lastSentMessagePathRef } =
    useContextManagement()

  // Map BlockMessages → ChatMessage format with citation extraction
  const chatMessages = useMemo(() => {
    return messages
      .map((m) => {
        const direction = m.authorId === userId ? 'outgoing' : 'incoming'
        const block = m.block

        // Custom status message — direct or wrapped in a bubble
        if (block.type === 'custom') {
          return { id: m.id, direction, text: '', status: block.name }
        }
        if (block.type === 'bubble' && block.block.type === 'custom') {
          return { id: m.id, direction, text: '', status: block.block.name }
        }

        // Extract text — direct or wrapped in a bubble
        let text: string | undefined
        if (block.type === 'text') {
          text = block.text
        } else if (block.type === 'bubble' && block.block.type === 'text') {
          text = block.block.text
        }
        if (typeof text !== 'string') return null

        // Citations come from message metadata (knowledge-base sources)
        let citations: { title: string; url: string }[] | undefined
        if (direction === 'incoming' && m.metadata?.citations) {
          type RawCitation = { citation: { source: { title: string; url: string } } }
          const rawCitations = (m.metadata.citations as RawCitation[]).map((c) => ({
            title: c.citation.source.title?.replace(' - Botpress', '') || 'Title not found',
            url: c.citation.source.url,
          }))
          // Deduplicate by URL
          const seen = new Set<string>()
          citations = rawCitations.filter((c) => {
            if (seen.has(c.url)) return false
            seen.add(c.url)
            return true
          })
        }

        return {
          id: m.id,
          direction,
          text,
          ...(citations !== undefined && { citations }),
        }
      })
      .filter((m): m is ChatMessage => m !== null)
  }, [messages, userId])

  // Add conversation to history when user sends their first message
  const trackConversation = useCallback(() => {
    if (conversationId && !conversationIds.includes(conversationId)) {
      addConversation(conversationId)
    }
  }, [conversationId, conversationIds, addConversation])

  // Listen for conversation title events from the bot
  useEffect(() => {
    if (!emitter) return
    const unsubscribe = emitter.on('customEvent', (event: Record<string, unknown>) => {
      if (event.type === 'conversationTitle' && typeof event.title === 'string' && conversationId) {
        setConversationTitle(conversationId, event.title)
      }
    })
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [emitter, conversationId, setConversationTitle])

  // Send message wrapper with context + model metadata
  const handleSend = useCallback(
    (text: string) => {
      if (!isReady) return

      const payload = {
        type: 'text' as const,
        text,
        value: JSON.stringify({
          currentContext,
        }),
      }

      void sendMessageRaw(payload)
      setCurrentContext([])
      lastSentMessagePathRef.current = currentPage.get().path
      trackConversation()
    },
    [isReady, sendMessageRaw, currentContext, setCurrentContext, trackConversation]
  )

  // Queue messages that arrive before webchat connects; flush when ready.
  const pendingRef = useRef<string[]>([])
  const queueMessage = useCallback(
    (text: string) => {
      if (!isReady) {
        pendingRef.current.push(text)
        return
      }
      handleSend(text)
    },
    [isReady, handleSend]
  )

  useEffect(() => {
    if (!isReady || pendingRef.current.length === 0) return
    const queue = pendingRef.current
    pendingRef.current = []
    for (const text of queue) {
      handleSend(text)
    }
  }, [isReady, handleSend])

  // Handle pendingMessage from store (e.g. triggered by Ask AI button)
  useEffect(() => {
    if (!pending) return
    if (!isReady) {
      pendingRef.current.push(pending)
      pendingMessage.set(null)
      return
    }
    handleSend(pending)
    pendingMessage.set(null)
  }, [pending, isReady, handleSend])

  // Focus composer when panel opens or conversation changes
  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [isOpen, conversationId, inputRef])

  const handleSwitchConversation = useCallback(
    (id: string) => {
      moveToTop(id)
      openConversation(id)
    },
    [openConversation, moveToTop]
  )

  const handleNewConversation = useCallback(() => {
    openConversation()
  }, [openConversation])

  const handleClearAll = useCallback(() => {
    clearAllConversations()
    handleNewConversation()
  }, [clearAllConversations, handleNewConversation])

  const hasMessages = chatMessages.length > 0

  return (
    <div className="h-full flex flex-col bg-background p-2 md:p-0">
      <ChatHeader
        conversationIds={conversationIds}
        currentConversationId={conversationId}
        onSwitchConversation={handleSwitchConversation}
        onNewConversation={handleNewConversation}
        onClearAll={handleClearAll}
        getConversationTitle={getConversationTitle}
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {hasMessages ? (
          <Messages messages={chatMessages} conversationId={conversationId} />
        ) : (
          <EmptyState onPick={queueMessage} conversationId={conversationId} />
        )}
      </div>

      <div className="shrink-0 mx-1">
        <Composer
          onSend={queueMessage}
          inputRef={inputRef}
          currentContext={currentContext}
          setCurrentContext={setCurrentContext}
          suggestedContext={suggestedContext}
          addSuggestedContext={addSuggestedContext}
        />
      </div>
    </div>
  )
}

export function DocsAssistant() {
  return (
    <WebchatProvider clientId={CLIENT_ID}>
      <AssistantInner />
    </WebchatProvider>
  )
}
