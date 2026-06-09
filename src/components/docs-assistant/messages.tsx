import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Markdown } from './markdown'
import { Sources } from './sources'
import { WorkingIndicator } from './working-indicator'

export interface ChatMessage {
  id: string
  direction: 'incoming' | 'outgoing'
  text: string
  citations?: { title: string; url: string }[]
  status?: string
}

interface MessagesProps {
  messages: ChatMessage[]
  conversationId?: string
}

const BOTTOM_THRESHOLD = 5

export function Messages({ messages, conversationId }: MessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const seenRef = useRef<Set<string>>(new Set())
  const lastConvoRef = useRef<string | undefined>(undefined)
  const [streamingId, setStreamingId] = useState<string | undefined>(undefined)

  const isNearBottomRef = useRef(true)
  const shouldForceSnapRef = useRef(false)
  const prevVisibleMessagesRef = useRef<ChatMessage[]>([])

  const incomingMessages = messages.filter((m) => m.direction === 'incoming')
  const latestIncoming = incomingMessages[incomingMessages.length - 1]
  const latestIsStatus = latestIncoming?.status !== undefined

  const indicatorLabel: string | undefined | null = latestIsStatus
    ? latestIncoming.status!
    : messages[messages.length - 1]?.direction === 'outgoing'
      ? undefined
      : null

  // Filter out all status messages from the list; the indicator handles them.
  const visibleMessages = useMemo(() => messages.filter((m) => !m.status), [messages])

  // Group messages into exchanges (user prompt + assistant replies)
  const exchanges = useMemo(() => {
    const result: { user: ChatMessage; assistant: ChatMessage[] }[] = []
    let currentUser: ChatMessage | null = null
    let currentAssistant: ChatMessage[] = []

    for (const m of visibleMessages) {
      if (m.direction === 'outgoing') {
        if (currentUser) {
          result.push({ user: currentUser, assistant: currentAssistant })
        }
        currentUser = m
        currentAssistant = []
      } else {
        currentAssistant.push(m)
      }
    }

    if (currentUser) {
      result.push({ user: currentUser, assistant: currentAssistant })
    }

    return result
  }, [visibleMessages])

  // Track whether the user is near the bottom (for auto-scroll decisions).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      const near = el.scrollTop + el.clientHeight >= el.scrollHeight - BOTTOM_THRESHOLD
      isNearBottomRef.current = near
    }

    // Initial state
    handleScroll()

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [conversationId])

  useEffect(() => {
    if (lastConvoRef.current !== conversationId) {
      lastConvoRef.current = conversationId
      seenRef.current = new Set(messages.map((m) => m.id))
      setStreamingId(undefined)
      isNearBottomRef.current = true
      shouldForceSnapRef.current = false
      return
    }
    const newIncoming = messages.filter((m) => m.direction === 'incoming' && !seenRef.current.has(m.id))
    for (const m of messages) seenRef.current.add(m.id)
    const latest = newIncoming[newIncoming.length - 1]
    if (latest && !latest.status) setStreamingId(latest.id)
  }, [messages, conversationId])

  // Detect new outgoing messages and force snap
  useEffect(() => {
    const prevIds = new Set(prevVisibleMessagesRef.current.map((m) => m.id))
    const newOutgoing = visibleMessages.find((m) => m.direction === 'outgoing' && !prevIds.has(m.id))
    if (newOutgoing) {
      shouldForceSnapRef.current = true
    }
    prevVisibleMessagesRef.current = visibleMessages
  }, [visibleMessages])

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    })
    isNearBottomRef.current = true
  }, [])

  // Stable ref so StreamingMarkdown's effect never needs to restart
  const scrollTickRef = useRef(() => {
    if (isNearBottomRef.current) {
      const el = scrollRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
    }
  })
  useEffect(() => {
    scrollTickRef.current = () => {
      if (isNearBottomRef.current) {
        const el = scrollRef.current
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
      }
    }
  }, [])

  useLayoutEffect(() => {
    const isConvoSwitch = lastConvoRef.current !== conversationId

    if (isConvoSwitch) {
      shouldForceSnapRef.current = false
      scrollToBottom(false)
      return
    }

    if (shouldForceSnapRef.current) {
      shouldForceSnapRef.current = false
      scrollToBottom(false)
      return
    }

    if (isNearBottomRef.current) {
      scrollToBottom(true)
      return
    }

    // User has manually scrolled up — respect it, do nothing.
  }, [visibleMessages, indicatorLabel, conversationId, scrollToBottom])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="w-full">
        {exchanges.map((exchange) => (
          <div key={exchange.user.id} className="mb-4">
            <div className="flex w-full justify-start sticky top-0 px-1 z-10 bg-background">
              <div className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-[14px] leading-6 whitespace-pre-wrap break-words dark:border-stone-800 dark:bg-stone-900">
                {exchange.user.text}
              </div>
            </div>
            {exchange.assistant.map((m) => (
              <AssistantMessageRow
                key={m.id}
                message={m}
                animate={m.id === streamingId}
                scrollTickRef={m.id === streamingId ? scrollTickRef : undefined}
              />
            ))}
          </div>
        ))}
        <div className={cn('px-4', indicatorLabel === null && 'invisible')}>
          <WorkingIndicator label={indicatorLabel ?? undefined} />
        </div>
      </div>
    </div>
  )
}

function AssistantMessageRow({
  message,
  animate,
  scrollTickRef,
}: {
  message: ChatMessage
  animate: boolean
  scrollTickRef?: React.RefObject<() => void>
}) {
  const showFooter = !!message.citations?.length

  return (
    <div className="flex w-full justify-start my-4 last:mb-0 px-4">
      <div className="max-w-full break-words">
        {showFooter && <Sources sources={message.citations!} />}
        {animate ? (
          <StreamingMarkdown text={message.text} scrollTickRef={scrollTickRef} />
        ) : (
          <Markdown text={message.text} />
        )}
      </div>
    </div>
  )
}

function StreamingMarkdown({ text, scrollTickRef }: { text: string; scrollTickRef?: React.RefObject<() => void> }) {
  const charsPerTick = Math.max(6, Math.ceil(text.length / 240))
  const [revealed, setRevealed] = useState(() => text.slice(0, charsPerTick))
  const indexRef = useRef(charsPerTick)

  useEffect(() => {
    indexRef.current = charsPerTick
    setRevealed(text.slice(0, charsPerTick))
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = () => {
      if (cancelled) return
      if (indexRef.current >= text.length) {
        setRevealed(text)
        scrollTickRef?.current?.()
        return
      }
      indexRef.current = Math.min(indexRef.current + charsPerTick, text.length)
      setRevealed(text.slice(0, indexRef.current))
      scrollTickRef?.current?.()
      timer = setTimeout(tick, 16)
    }

    timer = setTimeout(tick, 16)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // scrollTickRef is a stable ref — intentionally excluded from deps
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [text, charsPerTick])

  return <Markdown text={revealed} />
}
