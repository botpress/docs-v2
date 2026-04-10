import type { SidebarNode } from '../lib/sidebar-types'
import SidebarTreeView from './sidebar-tree-view'
import ThemeToggle from './theme-toggle'

interface NavItem {
  label: string
  href: string
  icon: 'home'
}

interface SidebarProps {
  currentPath: string
  navItems: NavItem[]
  tree: SidebarNode[]
}

function isActive(currentPath: string, href: string): boolean {
  const norm = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
  const normHref = href.endsWith('/') ? href.slice(0, -1) : href
  if (normHref === '' || normHref === '/') return norm === '' || norm === '/'
  return norm === normHref
}

export default function Sidebar({ currentPath, navItems, tree }: SidebarProps) {
  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col bg-stone-100 dark:bg-stone-950">
      <div className="px-3 pt-2">
        <button
          type="button"
          className="relative flex h-9 w-full cursor-pointer items-center rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-stone-500 shadow-none transition-[color,box-shadow] hover:border-stone-300 dark:border-stone-800 dark:bg-white/5 dark:text-stone-400 dark:hover:border-stone-700"
          onClick={() => window.dispatchEvent(new CustomEvent('hc:open-search'))}
        >
          <svg
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-500 dark:text-stone-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Search...
          <kbd className="pointer-events-none ml-auto inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-sm px-1 font-sans text-[11px] font-medium text-stone-400 select-none bg-stone-100 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-500">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <nav className="px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`flex items-center gap-2 rounded-md pl-4 pr-2 py-1.5 text-sm transition-colors ${
                  isActive(currentPath, item.href)
                    ? 'text-primary bg-primary/10 dark:bg-primary/15 font-medium'
                    : 'text-stone-600 hover:bg-black/5 dark:text-stone-400 dark:hover:bg-white/5'
                }`}
              >
                {item.label === 'Home' && (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                )}
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 mask-[linear-gradient(to_bottom,transparent,white_20px,white_calc(100%-12px),transparent)]"
        style={{ scrollbarGutter: 'stable' }}
      >
        <SidebarTreeView nodes={tree} currentPath={currentPath} />
      </div>

      <div className="border-t border-stone-200 px-4 py-3 dark:border-stone-800">
        <ThemeToggle />
      </div>
    </aside>
  )
}
