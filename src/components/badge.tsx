import type { ReactNode } from 'react'

type BadgeColor = 'gray' | 'blue' | 'green' | 'orange' | 'yellow' | 'red' | 'purple'

const fillStyles: Record<BadgeColor, string> = {
  gray: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
}

const strokeStyles: Record<BadgeColor, string> = {
  gray: 'border-stone-300 text-stone-500 dark:border-stone-600 dark:text-stone-400',
  blue: 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400',
  green: 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-400',
  orange: 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400',
  yellow: 'border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400',
  red: 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400',
  purple: 'border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400',
}

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  stroke?: boolean
  className?: string
}

export function Badge({ children, color = 'gray', stroke, className }: BadgeProps) {
  const variant = stroke ? `border ${strokeStyles[color]}` : fillStyles[color]
  return (
    <span
      className={['inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', variant, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
