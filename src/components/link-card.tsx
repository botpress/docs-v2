import { ChevronRight, MessageSquare, Plug } from 'lucide-react'
import type { ReactNode } from 'react'

interface LinkCardProps {
  href: string
  icon: ReactNode
  title: string
  description: string
}

function LinkCard({ href, icon, title, description }: LinkCardProps) {
  return (
    <a href={href} className="group block cursor-pointer">
      <div className="relative flex items-center gap-x-4 px-6 py-5">
        <div className="size-6 shrink-0 fill-stone-800 text-stone-800 dark:fill-stone-100 dark:text-stone-100">
          {icon}
        </div>
        <div>
          <h2 className="not-prose flex items-center gap-1 text-base font-semibold text-stone-800 dark:text-white">
            {title}
            <ChevronRight className="size-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
          </h2>
          <div className="mt-0 text-sm font-normal leading-6 text-stone-600 dark:text-stone-400">{description}</div>
        </div>
      </div>
    </a>
  )
}

export function WebchatCard() {
  return (
    <LinkCard
      href="/webchat/introduction"
      icon={<MessageSquare className="size-6" />}
      title="Webchat"
      description="Custom frontend for your AI agent."
    />
  )
}

export function IntegrationsCard() {
  return (
    <LinkCard
      href="/integrations/introduction"
      icon={<Plug className="size-6" />}
      title="Integrations"
      description="Channels to deploy or interact with your agent."
    />
  )
}
