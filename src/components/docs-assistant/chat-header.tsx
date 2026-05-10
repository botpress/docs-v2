import { useEffect, useRef, useState } from 'react'
import { History, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ChatHeaderProps {
  conversations: Array<
    {
      id: string
      createdAt?: string | undefined
      updatedAt?: string | undefined
      lastMessage: {
        sentOn?: string | undefined
        payload?: unknown
        author: { type: string }
      }
    } & Record<string, unknown>
  >
  isLoading: boolean
  currentConversationId?: string
  onSwitchConversation: (id: string) => void
  onNewConversation: () => void
  onClearAll: () => void
  getTitle: (conversationId: string) => Promise<string | undefined>
}

const TITLE_CACHE_KEY = 'docs-assistant-conv-titles'

export function ChatHeader({
  conversations,
  isLoading,
  currentConversationId,
  onSwitchConversation,
  onNewConversation,
  onClearAll,
  getTitle,
}: ChatHeaderProps) {
  const [open, setOpen] = useState(false)
  const [titles, setTitles] = useState<Record<string, string>>(() => loadTitles())
  const titlesRef = useRef(titles)
  titlesRef.current = titles

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      for (const c of conversations) {
        if (cancelled) return
        if (titlesRef.current[c.id]) continue
        try {
          const t = await getTitle(c.id)
          if (cancelled) return
          if (t) {
            setTitles((prev) => {
              const next = { ...prev, [c.id]: t }
              saveTitles(next)
              return next
            })
          }
        } catch {
          /* keep trying others */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, conversations, getTitle])

  const handlePick = (id: string) => {
    setOpen(false)
    if (id !== currentConversationId) onSwitchConversation(id)
  }

  const handleNew = () => {
    setOpen(false)
    onNewConversation()
  }

  const currentTitle = currentConversationId ? titles[currentConversationId] : undefined

  return (
    <header className="relative px-4 pt-3 flex items-center justify-between shrink-0">
      <span className="truncate max-w-[180px] text-sm font-medium text-foreground">{currentTitle || 'New chat'}</span>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-lg" onClick={onNewConversation} aria-label="New conversation">
                <Plus className="size-4" />
              </Button>
            }
          />
          <TooltipContent side="bottom">New conversation</TooltipContent>
        </Tooltip>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label="Conversation history"
                      aria-haspopup="menu"
                      aria-expanded={open}
                    >
                      <History className="size-4" />
                    </Button>
                  }
                />
              }
            />
            <TooltipContent side="bottom">Conversation history</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-64">
            <div className="max-h-[280px] overflow-y-auto py-1">
              {conversations.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {isLoading ? 'Loading…' : 'No conversations yet'}
                </div>
              ) : (
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Recent</DropdownMenuLabel>
                  {conversations.map((c) => {
                    const isActive = c.id === currentConversationId
                    return (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => handlePick(c.id)}
                        className={cn('gap-2', isActive && 'bg-accent')}
                      >
                        <span className="flex-1 truncate text-sm">{titles[c.id] || previewOf(c).title}</span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNew}>
              <Plus className="size-3.5" />
              <span>New conversation</span>
            </DropdownMenuItem>
            {conversations.length > 0 && (
              <DropdownMenuItem onClick={onClearAll} variant="destructive">
                <Trash2 className="size-3.5" />
                <span>Clear all</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function previewOf(c: {
  updatedAt?: string | undefined
  createdAt?: string | undefined
  lastMessage: {
    sentOn?: string | undefined
    payload?: unknown
    author: { type: string }
  }
}): { title: string; subtitle?: string } {
  const time = relativeTime(c.lastMessage.sentOn ?? c.updatedAt ?? c.createdAt)
  const payload = c.lastMessage.payload as
    | { type?: string; text?: string; items?: Array<{ type: string; payload?: { text?: string } }> }
    | undefined
  let text: string | undefined
  if (payload?.type === 'text') {
    text = payload.text
  } else if (payload?.type === 'bloc') {
    const items = payload.items
    text = items?.find((i) => i.type === 'text')?.payload?.text
  }
  if (text) return { title: stripMarkdown(text), subtitle: time }
  return { title: 'New conversation', subtitle: time }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

function relativeTime(iso?: string): string | undefined {
  if (!iso) return undefined
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return undefined
  const diff = Date.now() - t
  const s = Math.round(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function loadTitles(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TITLE_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function saveTitles(titles: Record<string, string>): void {
  try {
    localStorage.setItem(TITLE_CACHE_KEY, JSON.stringify(titles))
  } catch {
    /* ignore */
  }
}
