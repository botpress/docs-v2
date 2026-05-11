import { useState } from 'react'
import { History, Maximize2, Minimize2, PanelRightClose, Plus, Trash2 } from 'lucide-react'
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
import { MAX_PANEL_WIDTH, MIN_PANEL_WIDTH, setPanelWidth, closePanel } from './store'
import { cn } from '@/lib/utils'

interface ChatHeaderProps {
  conversationIds: string[]
  currentConversationId?: string
  selectedConversationId?: string
  onSwitchConversation: (id: string) => void
  onNewConversation: () => void
  onClearAll: () => void
  getConversationTitle: (id: string) => string
}

export function ChatHeader({
  conversationIds,
  currentConversationId,
  selectedConversationId,
  onSwitchConversation,
  onNewConversation,
  onClearAll,
  getConversationTitle,
}: ChatHeaderProps) {
  const [open, setOpen] = useState(false)

  const currentTitle = currentConversationId ? getConversationTitle(currentConversationId) : 'New chat'

  const CSS_VAR = '--assistant-panel-width'
  const [isMaxed, setIsMaxed] = useState(() => {
    if (typeof window === 'undefined') return false
    const current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(CSS_VAR))
    return current >= MAX_PANEL_WIDTH
  })

  const handleToggleWidth = () => {
    const root = document.documentElement
    const current = parseFloat(getComputedStyle(root).getPropertyValue(CSS_VAR))
    const nextMaxed = current < MAX_PANEL_WIDTH
    const newWidth = nextMaxed ? MAX_PANEL_WIDTH : MIN_PANEL_WIDTH
    root.style.setProperty(CSS_VAR, `${newWidth}%`)
    setPanelWidth(newWidth)
    setIsMaxed(nextMaxed)
  }

  const handlePick = (id: string) => {
    setOpen(false)
    if (id !== currentConversationId) onSwitchConversation(id)
  }

  const handleNew = () => {
    setOpen(false)
    onNewConversation()
  }

  const handleClear = () => {
    setOpen(false)
    onClearAll()
  }

  return (
    <header className="relative pr-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={closePanel}
          aria-label="Close panel"
          className="cursor-pointer hover:bg-stone-200"
        >
          <PanelRightClose className="size-4 text-stone-500 dark:text-stone-400" />
        </Button>
        <span className="text-sm font-medium text-foreground">{currentTitle}</span>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={handleToggleWidth}
                aria-label={isMaxed ? 'Collapse panel' : 'Expand panel'}
                className="cursor-pointer  hover:bg-stone-200"
              >
                {isMaxed ? (
                  <Minimize2 className="size-4 text-stone-500 dark:text-stone-400" />
                ) : (
                  <Maximize2 className="size-4 text-stone-500 dark:text-stone-400" />
                )}
              </Button>
            }
          />
          <TooltipContent side="bottom">{isMaxed ? 'Collapse panel' : 'Expand panel'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={onNewConversation}
                aria-label="New conversation"
                className="cursor-pointer  hover:bg-stone-200"
              >
                <Plus className="size-4 text-stone-500 dark:text-stone-400" />
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
                      className="cursor-pointer  hover:bg-stone-200"
                    >
                      <History className="size-4 text-stone-500 dark:text-stone-400" />
                    </Button>
                  }
                />
              }
            />
            <TooltipContent side="bottom">Conversation history</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-64">
            <div className="max-h-[280px] overflow-y-auto py-1">
              {conversationIds.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet</div>
              ) : (
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Recent</DropdownMenuLabel>
                  {conversationIds.map((id) => {
                    const isActive = id === currentConversationId
                    return (
                      <DropdownMenuItem
                        key={id}
                        onClick={() => handlePick(id)}
                        className={cn('gap-2', isActive && 'bg-accent')}
                      >
                        <span className="flex-1 truncate text-sm">{getConversationTitle(id)}</span>
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
            {conversationIds.length > 0 && (
              <DropdownMenuItem onClick={handleClear} variant="destructive">
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
