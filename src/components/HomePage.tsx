export default function HomePage() {
  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('hc:open-search'))
  }

  return (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto px-4 pt-8">
      <div className="flex w-full max-w-[36rem] flex-col items-start py-12">
        <h1 className="text-2xl font-medium text-stone-500 dark:text-stone-400">Welcome</h1>
        <p className="text-2xl font-medium text-stone-900 dark:text-stone-100">How can we help you?</p>

        <div className="mt-8 w-full">
          <button
            type="button"
            onClick={openSearch}
            className="relative flex h-12 w-full cursor-pointer items-center rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm text-stone-500 shadow-xs transition-[border-color] hover:border-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-stone-600"
          >
            <svg
              className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-400 dark:text-stone-500"
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
            Search docs...
          </button>
        </div>
      </div>
    </div>
  )
}
