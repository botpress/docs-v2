import { PanelRightOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { focusComposer, openPanel } from './store'

export function CollapsedRail() {
  const handleClick = () => {
    openPanel()
    focusComposer()
  }

  const [shortcut, setShortcut] = useState('Ctrl+I')

  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().includes('MAC')
    setShortcut(isMac ? '⌘I' : 'Ctrl+I')
  }, [])

  return (
    <div className="flex h-full items-center justify-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClick}
              aria-label={`Open assistant (${shortcut})`}
              className="cursor-pointer"
            >
              <PanelRightOpen />
            </Button>
          }
        />
        <TooltipContent side="left">
          <span>
            Ask AI <span className="ml-1 text-muted-foreground">{shortcut}</span>
          </span>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
