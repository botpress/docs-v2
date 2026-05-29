import { icons } from 'lucide-react'
import { toPascalCase } from '@/lib/icon-utils'

interface Props {
  icon: string
  className?: string
}

/**
 * React-compatible icon component mirroring the Icon.astro interface.
 * Accepts `lucide:icon-name`, `icon-name` (kebab), or `PascalCase` names.
 */
export function ReactIcon({ icon, className }: Props) {
  const name = icon.startsWith('lucide:') ? icon.slice(7) : icon
  const Icon = icons[toPascalCase(name) as keyof typeof icons]
  if (!Icon) return null
  return <Icon className={className} />
}
