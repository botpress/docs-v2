import { ArrowUpRight, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  icon?: ReactNode
  img?: string
  href?: string
  cta?: string
  horizontal?: boolean
  children?: ReactNode
  className?: string
}

export function Card({ title, icon, img, href, cta, horizontal, children, className }: CardProps) {
  const isExternal = href?.startsWith('http')
  const Component = href ? 'a' : 'div'

  return (
    <Component
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={[
        'group relative my-2 block w-full overflow-hidden rounded-2xl border border-stone-950/10 bg-white font-normal ring-2 ring-transparent dark:border-white/10 dark:bg-stone-900',
        href && 'cursor-pointer hover:border-primary dark:hover:border-primary-dark',
        href &&
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-dark',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {img && <img alt={title ?? ''} src={img} className="not-prose w-full object-cover object-center" />}
      <div className={['relative px-6 py-5', horizontal && 'flex items-center gap-x-4'].filter(Boolean).join(' ')}>
        {href && isExternal && (
          <div
            aria-hidden="true"
            className="absolute top-5 right-5 text-stone-400 group-hover:text-primary dark:text-stone-500 dark:group-hover:text-primary-dark"
          >
            <ArrowUpRight className="size-4" />
          </div>
        )}

        {icon && (
          <div className="size-6 fill-stone-800 text-stone-800 dark:fill-stone-100 dark:text-stone-100">{icon}</div>
        )}

        <div className="min-w-0 flex-1">
          {title && (
            <h2
              className={[
                'not-prose text-base font-semibold text-stone-800 dark:text-white',
                icon && !horizontal && 'mt-4',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {title}
            </h2>
          )}
          {children && (
            <div
              className={[
                'mt-1 text-sm font-normal leading-6',
                title ? 'text-stone-600 dark:text-stone-400' : 'text-stone-700 dark:text-stone-300',
                horizontal && 'mt-0',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {children}
            </div>
          )}
          {cta && (
            <div className="mt-8">
              <span className="flex items-center gap-2 text-left text-sm font-medium text-stone-600 group-hover:text-primary dark:text-stone-400 dark:group-hover:text-primary-dark">
                {cta}
                <ChevronRight className="size-4" />
              </span>
            </div>
          )}
        </div>
      </div>
    </Component>
  )
}
