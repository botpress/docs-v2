import type { ReactNode } from 'react'

interface ColumnsProps {
  children?: ReactNode
  cols?: number | string
  className?: string
}

export function Columns({ children, cols = 2, className }: ColumnsProps) {
  const colCount = Number(cols)
  return (
    <div
      className={[
        'prose dark:prose-invert grid gap-4',
        colCount === 1 && 'sm:grid-cols-1',
        colCount === 2 && 'sm:grid-cols-2',
        colCount === 3 && 'sm:grid-cols-3',
        colCount === 4 && 'sm:grid-cols-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
