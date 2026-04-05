import type { ReactNode } from 'react'

interface AccordionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  icon?: ReactNode | string
  children?: ReactNode
  className?: string
}

export function Accordion({ title, description, defaultOpen = false, children, className }: AccordionProps) {
  return (
    <details
      className={[
        'group/accordion mb-3 cursor-default overflow-hidden rounded-2xl border border-stone-200/70 bg-white dark:border-white/10 dark:bg-[#0b0c0e]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      open={defaultOpen || undefined}
    >
      <summary className="not-prose relative flex w-full cursor-pointer list-none flex-row content-center items-center space-x-2 rounded-t-xl px-5 py-4 hover:bg-stone-100 hover:dark:bg-stone-800 [&::-webkit-details-marker]:hidden">
        <div className="mr-2">
          <svg
            className="size-3 fill-stone-700 transition duration-200 group-open/accordion:-mt-1 group-open/accordion:rotate-90 dark:fill-stone-400"
            viewBox="0 0 256 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-stone-900 dark:text-stone-100">{title}</p>
          {description && <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
        </div>
      </summary>
      <div className="prose prose-stone mx-6 mt-2 mb-4 cursor-default overflow-x-auto dark:prose-invert">
        {children}
      </div>
    </details>
  )
}

interface AccordionGroupProps {
  children?: ReactNode
  className?: string
}

export function AccordionGroup({ children, className }: AccordionGroupProps) {
  return (
    <div
      className={[
        'mt-0 mb-3 overflow-hidden rounded-xl border border-stone-200/70 dark:border-white/10 [&>details+details]:border-t [&>details+details]:border-t-stone-200/70 dark:[&>details+details]:border-t-white/10 [&>details>summary]:rounded-none [&>details]:mb-0 [&>details]:rounded-none [&>details]:border-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
