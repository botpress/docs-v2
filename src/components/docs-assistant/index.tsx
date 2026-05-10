import {
  WebchatProvider,
  useActiveConversation,
  useConversations,
  useConversationList,
  useUser,
  useWebchatContext,
} from '@botpress/webchat'
import { useStore } from '@nanostores/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatHeader } from './chat-header'
import { Composer } from './composer'
import { EmptyState } from './empty-state'
import { useContextManagement } from './hooks/use-context-management'
import { Messages, type ChatMessage } from './messages'

import { CLIENT_ID, DEFAULT_MODEL } from './config'
import { pendingMessage, panelOpen } from './store'

function AssistantInner() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL.id)
  const isOpen = useStore(panelOpen)
  const pending = useStore(pendingMessage)

  const { messages, sendMessage: sendMessageRaw, status, conversationId } = useActiveConversation()

  const { userCredentials } = useUser()
  const userId = userCredentials?.userId

  const { listConversations, openConversation } = useConversations()
  const { client } = useWebchatContext()

  const {
    conversations,
    isLoading: isListLoading,
    refresh,
  } = useConversationList({
    clientId: CLIENT_ID,
    listConversations,
    userCredentials,
  })

  const isReady = status === 'connected'

  const { currentContext, setCurrentContext, suggestedContext, addSuggestedContext, inputRef } = useContextManagement()

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
        let rawText: string | undefined
        if (block.type === 'text') {
          rawText = block.text
        } else if (block.type === 'bubble' && block.block.type === 'text') {
          rawText = block.block.text
        }
        if (typeof rawText !== 'string') return null

        const match = rawText.match(/\n?<!--SOURCES:([\s\S]+?)-->$/)
        const rawCitations = match ? (JSON.parse(match[1]) as { title: string; url: string }[]) : undefined
        const citations = rawCitations?.filter(
          (s) =>
            s.url.startsWith('http') &&
            !s.title.startsWith('data_source://') &&
            !s.url.includes('raw.githubusercontent.com')
        )
        const text = match ? rawText.slice(0, rawText.length - match[0].length).trim() : rawText

        return {
          id: m.id,
          direction,
          text,
          ...(citations !== undefined && { citations }),
        }
      })
      .filter((m): m is ChatMessage => m !== null)
  }, [messages, userId])

  // Send message wrapper with context + model metadata
  const handleSend = useCallback(
    (text: string) => {
      if (!isReady) return

      const payload = {
        type: 'text' as const,
        text,
        value: JSON.stringify({
          currentContext,
          model: selectedModel,
        }),
      }

      void sendMessageRaw(payload)
      setCurrentContext([])
    },
    [isReady, sendMessageRaw, currentContext, selectedModel, setCurrentContext]
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

  // Focus composer when panel opens
  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [isOpen, inputRef])

  // Fetch conversation title from first user message
  const fetchConversationTitle = useCallback(
    async (id: string): Promise<string | undefined> => {
      if (!client || !userId) return undefined
      type Msg = {
        userId?: string
        createdAt?: string
        payload?: { type?: string; text?: string }
      }
      const all: Msg[] = []
      let nextToken: string | undefined = undefined
      let pages = 0
      do {
        const res = (await client.listConversationMessages({
          conversationId: id,
          ...(nextToken ? { nextToken } : {}),
        })) as { messages: Msg[]; meta?: { nextToken?: string } }
        all.push(...res.messages)
        nextToken = res.meta?.nextToken
        pages += 1
      } while (nextToken && pages < 5)

      all.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())
      const firstUser = all.find((m) => m.userId === userId && m.payload?.type === 'text' && m.payload.text)
      return firstUser?.payload?.text?.slice(0, 60)
    },
    [client, userId]
  )

  const handleSwitchConversation = useCallback(
    (id: string) => {
      openConversation(id)
    },
    [openConversation]
  )

  const handleNewConversation = useCallback(() => {
    openConversation()
    void refresh()
  }, [openConversation, refresh])

  const handleClearAll = useCallback(() => {
    // Clear all localStorage conversation state
    try {
      localStorage.removeItem('docs-bot-conversations')
      localStorage.removeItem('docs-bot-conversation-titles')
      localStorage.removeItem('docs-assistant-conv-titles')
    } catch {}
    handleNewConversation()
  }, [handleNewConversation])

  const hasMessages = chatMessages.length > 0

  return (
    <div className="h-full flex flex-col bg-background">
      <ChatHeader
        conversations={conversations}
        isLoading={isListLoading}
        currentConversationId={conversationId}
        onSwitchConversation={handleSwitchConversation}
        onNewConversation={handleNewConversation}
        onClearAll={handleClearAll}
        getTitle={fetchConversationTitle}
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {hasMessages ? (
          <Messages messages={chatMessages} conversationId={conversationId} />
        ) : (
          <EmptyState onPick={queueMessage} conversationId={conversationId} />
        )}
      </div>

      <div className="shrink-0 px-2 pb-0">
        <Composer
          onSend={queueMessage}
          inputRef={inputRef}
          currentContext={currentContext}
          setCurrentContext={setCurrentContext}
          suggestedContext={suggestedContext}
          addSuggestedContext={addSuggestedContext}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
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
