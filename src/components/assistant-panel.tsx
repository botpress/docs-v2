import { useStore } from '@nanostores/react'
import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { CollapsedRail } from '@/components/docs-assistant/collapsed-rail'
import { DocsAssistant } from '@/components/docs-assistant'
import { useKeyboardShortcuts } from '@/components/docs-assistant/hooks/use-keyboard-shortcuts'
import {
  getPanelWidth,
  hydratePanelFromStorage,
  MAX_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  panelOpen,
  setPanelWidth,
} from '@/components/docs-assistant/store'
import { TooltipProvider } from '@/components/ui/tooltip'

const HTML_DATA_ATTR = 'data-assistant-panel-open'
const CSS_VAR = '--assistant-panel-width'

function updateRootStyles(isOpen: boolean) {
  const root = document.documentElement
  if (!root) return
  root.style.setProperty(CSS_VAR, isOpen ? `${getPanelWidth()}px` : '48px')
  root.setAttribute(HTML_DATA_ATTR, isOpen ? 'true' : 'false')
}

export function AssistantPanel() {
  useKeyboardShortcuts()

  const isOpen = useStore(panelOpen)
  const hasMounted = useRef(false)

  useEffect(() => {
    hydratePanelFromStorage()
  }, [])

  // After the initial mount (which matched the inline script in BaseLayout),
  // keep the root CSS variable in sync with nanostore state.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    updateRootStyles(isOpen)
  }, [isOpen])

  // Re-sync after Astro view-transitions.
  useEffect(() => {
    const handler = () => {
      updateRootStyles(panelOpen.get())
    }
    document.addEventListener('astro:after-swap', handler)
    return () => document.removeEventListener('astro:after-swap', handler)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const root = document.documentElement
    if (!root) return

    const startX = e.clientX
    const startWidth = parseFloat(getComputedStyle(root).getPropertyValue(CSS_VAR))

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = startX - moveEvent.clientX
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, startWidth + delta))
      root.style.setProperty(CSS_VAR, `${newWidth}px`)
      root.setAttribute(HTML_DATA_ATTR, 'true')
      panelOpen.set(true)
    }

    const handleUp = () => {
      const finalWidth = parseFloat(getComputedStyle(root).getPropertyValue(CSS_VAR))
      setPanelWidth(finalWidth)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }, [])

  return (
    <TooltipProvider>
      <div className="relative flex h-full w-full flex-col">
        {isOpen && (
          // Invisible resize handle sitting on the right border of <main>
          <div
            className="absolute inset-y-0 left-[-0.5rem] z-10 w-6 cursor-col-resize"
            onPointerDown={handlePointerDown}
            aria-hidden="true"
          />
        )}
        <div
          className={cn(
            'flex-1 overflow-hidden',
            isOpen
              ? 'ml-[calc(var(--spacing)*2)] mr-[calc(var(--spacing)*2)] mb-[calc(var(--spacing)*2)]'
              : 'mb-[calc(var(--spacing)*2)]'
          )}
        >
          {isOpen ? <DocsAssistant /> : <CollapsedRail />}
        </div>
      </div>
    </TooltipProvider>
  )
}
