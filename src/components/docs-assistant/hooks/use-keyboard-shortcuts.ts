import { useEffect } from 'react'
import { closePanel, panelOpen, togglePanel } from '../store'

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (e.key === 'Escape' && panelOpen.get()) {
        e.preventDefault()
        closePanel()
        return
      }

      if (modifier && e.key.toLowerCase() === 'i' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        togglePanel()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
