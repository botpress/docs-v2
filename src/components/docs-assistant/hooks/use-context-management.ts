import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'
import { composerRef, type ContextItem, currentPage, pendingContext } from '../store'

const isLandingPage = (path: string) => path === '/' || path === '/index' || path.endsWith('/index.html')

const shouldSuggestContext = (currentContext: ContextItem[], path: string) => {
  if (!path) return false
  if (isLandingPage(path)) return false
  if (currentContext.length > 0) return false
  return true
}

export function useContextManagement() {
  const [currentContext, setCurrentContext] = useState<ContextItem[]>([])
  const [suggestedContext, setSuggestedContext] = useState<ContextItem | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const page = useStore(currentPage)
  const pending = useStore(pendingContext)
  const lastSentMessagePathRef = useRef<string | null>(null)

  useEffect(() => {
    composerRef.current = inputRef.current
    return () => {
      if (composerRef.current === inputRef.current) {
        composerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!page.path) return
    if (lastSentMessagePathRef.current === page.path) {
      setSuggestedContext(null)
      return
    }
    if (shouldSuggestContext(currentContext, page.path)) {
      setSuggestedContext({ title: page.title, path: page.path })
    } else {
      setSuggestedContext(null)
    }
  }, [page.path, page.title, currentContext])

  useEffect(() => {
    if (!pending) return
    setCurrentContext((prev) => {
      if (prev.some((item) => item.path === pending.path)) return prev
      return [...prev, pending]
    })
    setSuggestedContext(null)
    pendingContext.set(null)
  }, [pending])

  const addSuggestedContext = () => {
    if (!suggestedContext) return
    setCurrentContext((prev) => {
      if (prev.some((item) => item.path === suggestedContext.path)) return prev
      return [...prev, suggestedContext]
    })
    setSuggestedContext(null)
    inputRef.current?.focus()
  }

  return {
    currentContext,
    setCurrentContext,
    suggestedContext,
    setSuggestedContext,
    addSuggestedContext,
    inputRef,
    lastSentMessagePathRef,
  }
}
