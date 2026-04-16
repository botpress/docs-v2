type Size = 'sm' | 'lg'

export default function ThemeToggle({ size = 'sm' }: { size?: Size }) {
  const toggle = () => {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('hc-theme', next)
    } catch {}
  }

  const sizeClass = size === 'lg' ? 'h-[2.375rem] w-[4.5rem]' : 'h-[26px] w-[50px]'
  const iconClass = size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3'
  const circleClass = size === 'lg' ? 'left-[3.5px] dark:translate-x-[33px]' : 'left-1 dark:translate-x-[22px]'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={`relative flex cursor-pointer items-center rounded-full bg-stone-200 p-[3px] dark:bg-stone-800 ${sizeClass}`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 h-[calc(100%-6px)] aspect-square rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-stone-600 ${circleClass}`}
      />
      <span className="relative z-10 flex flex-1 items-center justify-center text-stone-700 dark:text-stone-500">
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
      <span className="relative z-10 flex flex-1 items-center justify-center text-stone-400 dark:text-stone-200">
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  )
}
