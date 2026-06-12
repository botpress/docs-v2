import type { TabInfo } from '@/bach/types'
import { withBase } from '@/bach/utils'
import type { NavbarLink } from '../lib/site-config'

interface HeaderProps {
  tabs: TabInfo[]
  activeTab: string | null
  siteName?: string | null
  siteLogo?: string | null
  siteLogoDark?: string | null
  navbarLinks?: readonly NavbarLink[]
}

export default function Header({ tabs, activeTab, siteName, siteLogo, siteLogoDark, navbarLinks = [] }: HeaderProps) {
  const hasLogo = !!(siteLogo || siteLogoDark)
  const hasTabs = tabs.length > 0

  return (
    <header className="hidden lg:flex h-14 shrink-0 items-center bg-stone-100 px-6 dark:bg-stone-950">
      <a href={withBase('/')} className="flex shrink-0 items-center">
        <img
          src={siteLogo ?? siteLogoDark ?? undefined}
          alt={siteName || 'Docs'}
          className={`h-7 w-auto shrink-0 object-contain${siteLogoDark ? ' dark:hidden' : ''}`}
          style={hasLogo ? undefined : { display: 'none' }}
        />
        {siteLogoDark && (
          <img
            src={siteLogoDark}
            alt={siteName || 'Docs'}
            className="hidden h-7 w-auto shrink-0 object-contain dark:block"
          />
        )}
        <span
          className="text-sm font-semibold text-stone-900 dark:text-stone-100"
          style={hasLogo ? { display: 'none' } : undefined}
        >
          {siteName || 'Docs'}
        </span>
      </a>

      <div className="ml-auto flex items-center gap-x-6">
        {hasTabs && (
          <nav className="flex items-center gap-x-6">
            {tabs.map((tab) => {
              const isActive = tab.slug === activeTab
              const externalProps = tab.external ? { target: '_blank' as const, rel: 'noreferrer' } : {}
              return (
                <a
                  key={tab.slug}
                  href={tab.href}
                  {...externalProps}
                  className={`flex items-center self-stretch border-b-2 text-sm transition-colors ${
                    isActive
                      ? 'border-primary font-bold text-stone-900 dark:text-stone-100'
                      : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  {tab.label}
                </a>
              )
            })}
          </nav>
        )}
        {navbarLinks.map((link) => {
          const isExternal = link.external ?? link.href.startsWith('http')
          const externalProps = isExternal ? { target: '_blank' as const, rel: 'noreferrer' } : {}
          return link.type === 'button' ? (
            <a
              key={link.href}
              href={link.href}
              {...externalProps}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {link.label}
            </a>
          ) : (
            <a
              key={link.href}
              href={link.href}
              {...externalProps}
              className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
            >
              {link.label}
            </a>
          )
        })}
      </div>
    </header>
  )
}
