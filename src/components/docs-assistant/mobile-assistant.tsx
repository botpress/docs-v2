import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { DocsAssistant } from '.'
import { panelOpen, closePanel } from './store'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}

export function MobileAssistant() {
  const isOpen = useStore(panelOpen)
  const isMobile = useIsMobile()

  useEffect(() => {
    const handler = () => {
      panelOpen.set(true)
    }
    window.addEventListener('hc:open-assistant', handler)
    return () => window.removeEventListener('hc:open-assistant', handler)
  }, [])

  if (!isMobile) return null

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closePanel()
      }}
      direction="bottom"
    >
      <DrawerContent className="h-[95dvh]! max-h-[95dvh]! rounded-t-xl bg-secondary dark:bg-background [&>div:first-child]:bg-stone-200 [&>div:first-child]:dark:bg-stone-600">
        <DrawerHeader className="sr-only">
          <DrawerTitle>AI Assistant</DrawerTitle>
        </DrawerHeader>
        <div className="flex h-full flex-col overflow-hidden">
          <DocsAssistant />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
