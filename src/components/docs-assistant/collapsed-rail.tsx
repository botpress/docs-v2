import { PanelRightOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
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
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={handleClick}
        aria-label={`Open assistant (${shortcut})`}
        className="cursor-pointer hover:bg-stone-200"
      >
        <PanelRightOpen />
      </Button>
    </div>
  )
}
