import { Check, ChevronDown, Copy, ArrowUpRight, FileText, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { askAI } from './docs-assistant/store'
import { currentPage } from './docs-assistant/store'
import { Button } from './ui/button'
import { ButtonGroup } from './ui/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'

interface PageOptionsProps {
  markdownUrl: string
}

interface MenuAction {
  key: string
  icon: ReactNode
  label: string
  description: string
  onSelect?: () => void
  href?: string
  external?: boolean
}

export default function PageOptions({ markdownUrl }: PageOptionsProps) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function copyMarkdown() {
    if (status === 'copying') return

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    setStatus('copying')

    try {
      const response = await fetch(markdownUrl)
      if (!response.ok) throw new Error(`Failed to fetch ${markdownUrl}`)

      const markdown = await response.text()
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')

      await navigator.clipboard.writeText(markdown)
      setStatus('copied')
    } catch {
      setStatus('error')
    }

    resetTimeoutRef.current = setTimeout(() => setStatus('idle'), 2000)
  }

  const isCopied = status === 'copied'
  const label =
    status === 'copying' ? 'Copying...' : isCopied ? 'Copied' : status === 'error' ? 'Retry copy' : 'Copy page'

  const handleAskAI = () => {
    const page = currentPage.get()
    if (page.path && page.title) askAI(page)
  }

  const actions: MenuAction[] = [
    {
      key: 'copy',
      icon: isCopied ? <Check /> : <Copy />,
      label: 'Copy page',
      description: 'Copy as Markdown for LLMs',
      onSelect: copyMarkdown,
    },
    {
      key: 'view',
      icon: <FileText />,
      label: 'View as Markdown',
      description: 'View this page as plain text',
      href: markdownUrl,
      external: true,
    },
  ]

  return (
    <div className="not-prose flex items-center gap-2" aria-live="polite">
      <ButtonGroup>
        <Button
          variant="secondary"
          size="lg"
          onClick={copyMarkdown}
          aria-label={label}
          className="active:translate-y-0! cursor-pointer"
        >
          {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          <span>{label}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="secondary" size="icon-lg" aria-label="More actions" className="cursor-pointer">
                <ChevronDown className="size-3" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={6} className="w-60">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.key}
                onSelect={action.onSelect}
                {...(action.href ? { render: <a href={action.href} target="_blank" rel="noreferrer" /> } : {})}
              >
                {action.icon}
                <div>
                  <div className="flex items-center gap-1 font-medium">
                    {action.label}
                    {action.external && <ArrowUpRight className="size-3" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <Button variant="secondary" size="icon" onClick={handleAskAI} className="active:translate-y-0! cursor-pointer">
        <Sparkles className="size-3.5" />
        {/* <span>Ask AI</span> */}
      </Button>
    </div>
  )
}
