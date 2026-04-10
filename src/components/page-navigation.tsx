import { Card, CardHeader, CardTitle, CardDescription } from './ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdjacentPage {
  title: string
  href: string
}

interface Props {
  prev: AdjacentPage | null
  next: AdjacentPage | null
}

export default function PageNavigation({ prev, next }: Props) {
  if (!prev && !next) return null

  return (
    <nav className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {prev ? (
        <a href={prev.href} className="no-underline sm:col-start-1">
          <Card className="h-full transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50">
            <CardHeader>
              <CardDescription className="flex items-center gap-1 text-xs">
                <ChevronLeft className="size-3.5" />
                Previous
              </CardDescription>
              <CardTitle>{prev.title}</CardTitle>
            </CardHeader>
          </Card>
        </a>
      ) : (
        <div />
      )}
      {next ? (
        <a href={next.href} className="no-underline sm:col-start-2">
          <Card className="h-full transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50">
            <CardHeader className="items-end text-right">
              <CardDescription className="flex w-full items-center justify-end gap-1 text-xs">
                Next
                <ChevronRight className="size-3.5" />
              </CardDescription>
              <CardTitle>{next.title}</CardTitle>
            </CardHeader>
          </Card>
        </a>
      ) : (
        <div />
      )}
    </nav>
  )
}
