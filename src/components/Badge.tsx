import type { ReactNode } from 'react'

type BadgeColor = 'gray' | 'blue' | 'green' | 'orange' | 'yellow' | 'red' | 'purple'

const colorStyles: Record<BadgeColor, string> = {
  gray: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
}

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  className?: string
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span
      className={['inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', colorStyles[color], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
