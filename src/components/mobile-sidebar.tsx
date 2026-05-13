import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { isPathActive } from '@/bach/nav'
import type { SidebarNode, TabInfo } from '@/bach/types'
import SidebarTreeView from './sidebar-tree-view'
import ThemeToggle from './theme-toggle'
import { ChevronDownIcon } from 'lucide-react'
import { LUCIDE_NAV_ICONS } from '../lib/nav-icons'
import { navigate } from 'astro:transitions/client'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu'

interface NavItem {
  label: string
  href: string
  icon?: string
}

interface Breadcrumb {
  label: string
  href?: string
}

interface Props {
  navItems: NavItem[]
  tree: SidebarNode[]
  currentPath: string
  siteName?: string | null
  siteLogo?: string | null
  siteLogoDark?: string | null
  breadcrumbs?: Breadcrumb[]
  tabs?: TabInfo[]
  activeTab?: string | null
  allTrees?: Record<string, SidebarNode[]>
}

function NavIcon({ icon }: { icon: string }) {
  if (icon.startsWith('lucide:')) {
    const Icon = LUCIDE_NAV_ICONS[icon.slice(7)]
    return Icon ? <Icon className="h-4 w-4 shrink-0" /> : null
  }
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  )
}

export default function MobileSidebar({
  navItems,
  tree,
  currentPath,
  siteName,
  siteLogo,
  siteLogoDark,
  breadcrumbs,
  tabs = [],
  activeTab = null,
  allTrees,
}: Props) {
  const hasLogo = !!(siteLogo || siteLogoDark)
  const hasTabs = tabs.length > 0
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string | null>(activeTab)

  const currentTree = useMemo(() => {
    if (!hasTabs || !allTrees || !selectedTab) return tree
    return allTrees[selectedTab] ?? tree
  }, [hasTabs, allTrees, selectedTab, tree])

  const selectedTabLabel = useMemo(() => {
    if (!selectedTab) return null
    return tabs.find((t) => t.slug === selectedTab)?.label ?? null
  }, [selectedTab, tabs])

  const handleOpen = useCallback(() => {
    setMounted(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true))
    })
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="flex h-13 items-center justify-between px-[calc(var(--spacing)*4)]">
          <a href="/" className="flex items-center">
            <img
              src={siteLogo ?? siteLogoDark ?? undefined}
              alt={siteName || 'Docs'}
              className={`h-7 w-auto shrink-0 object-contain${siteLogoDark ? ' dark:hidden' : ''}`}
              style={hasLogo ? undefined : { display: 'none' }}
            />
            <img
              src={siteLogoDark ?? undefined}
              alt={siteName || 'Docs'}
              className={`h-7 w-auto shrink-0 object-contain${siteLogoDark ? ' hidden dark:block' : ' hidden'}`}
            />
            <span
              className="text-sm font-semibold text-stone-900 dark:text-stone-100"
              style={hasLogo ? { display: 'none' } : undefined}
            >
              {siteName || 'Docs'}
            </span>
          </a>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('hc:open-assistant'))}
              className="flex h-5 w-5 cursor-pointer items-center justify-center text-stone-500 dark:text-stone-400"
              aria-label="Open AI assistant"
            >
              <svg
                className="h-full w-full"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('hc:open-search'))}
              className="flex h-5 w-5 cursor-pointer items-center justify-center text-stone-500 dark:text-stone-400"
              aria-label="Search"
            >
              <svg
                className="h-full w-full"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21 21-4.34-4.34" />
                <circle cx="11" cy="11" r="8" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-[calc(var(--spacing)*4)] py-4">
          <button
            onClick={handleOpen}
            className="flex h-5 w-5 mr-4 shrink-0 items-center justify-center text-stone-600 dark:text-stone-400"
            aria-label="Open menu"
          >
            <svg
              className="h-full w-full"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h16" />
            </svg>
          </button>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex min-w-0 items-center gap-1 text-sm text-stone-400 dark:text-stone-500">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="shrink-0 mx-0.5">&rsaquo;</span>}
                  {i < breadcrumbs.length - 1 ? (
                    crumb.href ? (
                      <a
                        href={crumb.href}
                        className="shrink-0 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="shrink-0">{crumb.label}</span>
                    )
                  ) : (
                    <span className="truncate font-semibold text-stone-900 dark:text-stone-100">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>
      </div>

      {mounted && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onTransitionEnd={() => {
            if (!open) setMounted(false)
          }}
        >
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-all ease-in-out dark:bg-black/20"
            style={{
              opacity: open ? 1 : 0,
              transitionDuration: open ? '200ms' : '150ms',
            }}
            onClick={handleClose}
          />

          <button
            onClick={handleClose}
            className="absolute top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-500 shadow-md transition-colors hover:text-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            style={{
              right: '1rem',
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              transitionDuration: open ? '200ms' : '150ms',
            }}
            tabIndex={open ? 0 : -1}
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <nav
            className="absolute inset-y-0 left-0 flex w-[85dvw] min-w-[19rem] max-w-[22rem] px-2 flex-col bg-stone-50 transition-transform ease-out dark:bg-stone-950"
            style={{
              transform: open ? 'translateX(0)' : 'translateX(-100%)',
              transitionDuration: open ? '200ms' : '150ms',
            }}
          >
            <div className="flex items-center justify-between px-3 py-6">
              <div className="flex items-center">
                <img
                  src={siteLogo ?? siteLogoDark ?? undefined}
                  alt={siteName || 'Docs'}
                  className={`h-7 w-auto shrink-0 object-contain${siteLogoDark ? ' dark:hidden' : ''}`}
                  style={hasLogo ? undefined : { display: 'none' }}
                />
                <img
                  src={siteLogoDark ?? undefined}
                  alt={siteName || 'Docs'}
                  className={`h-7 w-auto shrink-0 object-contain${siteLogoDark ? ' hidden dark:block' : ' hidden'}`}
                />
                <span
                  className="text-sm font-semibold text-stone-900 dark:text-stone-100"
                  style={hasLogo ? { display: 'none' } : undefined}
                >
                  {siteName || 'Docs'}
                </span>
              </div>
              <ThemeToggle size="lg" />
            </div>

            {hasTabs && (
              <div className="px-3">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-base font-medium text-stone-700 transition-colors hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-600">
                    <span>{selectedTabLabel ?? 'Select section'}</span>
                    <ChevronDownIcon className="h-4 w-4 text-stone-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={4}>
                    <DropdownMenuRadioGroup
                      value={selectedTab ?? ''}
                      onValueChange={(val) => {
                        setSelectedTab(val)
                        const tab = tabs.find((t) => t.slug === val)
                        if (tab) navigate(tab.href)
                      }}
                    >
                      {tabs.map((tab) => (
                        <DropdownMenuRadioItem
                          key={tab.slug}
                          value={tab.slug}
                          className="px-2 py-2 font-medium data-[checked]:text-primary"
                        >
                          {tab.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {navItems.length > 0 && (
              <div className="px-3 mt-7">
                <ul className="space-y-0.5">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className={`flex items-center gap-2 rounded-md px-2 mb-4 text-base transition-colors ${
                          isPathActive(item.href, currentPath)
                            ? 'text-primary bg-primary/10 dark:bg-primary/15 font-medium'
                            : 'text-stone-600 hover:bg-black/5 dark:text-stone-400 dark:hover:bg-white/5'
                        }`}
                      >
                        {item.icon && <NavIcon icon={item.icon} />}
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 mask-[linear-gradient(to_bottom,transparent,white_20px,white_calc(100%-12px),transparent)]">
              <SidebarTreeView nodes={currentTree} currentPath={currentPath} textSize="base" />
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
