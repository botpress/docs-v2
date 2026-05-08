import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  text: string
  className?: string
}

/**
 * Renders assistant messages as Markdown with GitHub-flavored extensions
 * (tables, fenced code, task lists). Code blocks get a subtle card with a
 * copy button; everything else uses the chat type scale.
 */
export function Markdown({ text, className }: MarkdownProps) {
  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,

          h1: ({ children }) => <h1 className="mt-4 mb-2 text-base font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-4 mb-2 text-sm font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-3 mb-1 text-sm font-semibold">{children}</h3>,

          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc marker:text-muted-foreground/60 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal marker:text-muted-foreground/70 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
            >
              {children}
            </a>
          ),

          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,

          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">{children}</blockquote>
          ),

          hr: () => <hr className="my-3 border-border/60" />,

          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 text-left font-semibold bg-muted/60">{children}</th>
          ),
          td: ({ children }) => <td className="border border-border px-2 py-1 align-top">{children}</td>,

          code: ({ className: _className, children, ...props }) => {
            return (
              <code {...props} className="px-1.5 py-0.5 rounded-md bg-muted text-[0.86em] font-mono">
                {children}
              </code>
            )
          },

          pre: ({ children }) => {
            const child = Array.isArray(children) ? children[0] : children
            const codeProps = (child as { props?: { className?: string; children?: unknown } })?.props
            const className = codeProps?.className || ''
            const lang = (className.match(/language-([\w-]+)/) || [])[1] || ''
            const raw = String(codeProps?.children ?? '').replace(/\n$/, '')
            return <CodeBlock lang={lang} code={raw} />
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="group relative my-2 rounded-lg border border-border/70 bg-muted/60 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 text-[11px] text-muted-foreground">
        <span className="font-mono">{lang || 'code'}</span>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors',
            'hover:bg-background/60 hover:text-foreground'
          )}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 text-[12.5px] leading-5 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  )
}
