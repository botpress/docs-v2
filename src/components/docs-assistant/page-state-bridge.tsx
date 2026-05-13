import { useEffect } from 'react'
import { currentPage } from './store'

interface PageStateBridgeProps {
  path: string
  title: string
}

export function PageStateBridge({ path, title }: PageStateBridgeProps) {
  useEffect(() => {
    currentPage.set({ path, title })
  }, [path, title])

  return <></>
}
