import type { SidebarNode } from '@/bach/types'
import SidebarTreeView from './sidebar-tree-view'
import ThemeToggle from './theme-toggle'
import { ReactIcon } from './ReactIcon'
import { isPathActive } from '@/bach/nav'

interface NavItem {
  label: string
  href: string
  icon?: string
}

interface SidebarProps {
  currentPath: string
  navItems: NavItem[]
  tree: SidebarNode[]
}

function NavIcon({ icon }: { icon: string }) {
  if (icon.startsWith('lucide:')) {
    return <ReactIcon icon={icon} className="h-4 w-4 shrink-0" />
  }
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  )
}

export default function Sidebar({ currentPath, navItems, tree }: SidebarProps) {
  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col bg-stone-100 dark:bg-stone-950">
      <div className="px-5 pt-2">
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

      <nav className="px-4 mt-7">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                target="_blank"
                href={item.href}
                className={`group flex items-center gap-3 rounded-md px-2 mb-4 text-sm transition-colors ${
                  isPathActive(item.href, currentPath)
                    ? 'text-primary dark:text-primary'
                    : 'text-stone-600 hover:text-primary dark:text-stone-400 dark:hover:text-primary'
                }`}
              >
                {item.icon && (
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isPathActive(item.href, currentPath)
                        ? 'border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
                        : 'border-stone-200 bg-white group-hover:border-primary/30 group-hover:bg-primary/5 dark:border-stone-700 dark:bg-stone-900 dark:group-hover:border-primary/40 dark:group-hover:bg-primary/10'
                    }`}
                  >
                    <NavIcon icon={item.icon} />
                  </span>
                )}
                <span className="font-semibold">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className="min-h-0 flex-1 overflow-y-auto pl-4 pr-2 py-4 mask-[linear-gradient(to_bottom,transparent,white_20px,white_calc(100%-12px),transparent)]"
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
