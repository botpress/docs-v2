'use client'

export default function SearchButton() {
  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('hc:open-search'))
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-[0.9rem] font-medium leading-[130%] text-white transition-all hover:opacity-90"
    >
      <img
        src="/homepage-assets/bolt-white-transparent-fill.svg"
        alt=""
        className="pointer-events-none h-[0.9em] w-auto"
      />
      <span>Ask AI</span>
    </button>
  )
}
