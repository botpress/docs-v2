/**
 * Subtle thinking indicator — a small pulsing dot paired with "Thinking…" text.
 */
export function WorkingIndicator() {
  return (
    <div className="flex items-center gap-2.5 px-1 py-2" aria-label="Thinking" role="status">
      <span className="relative flex size-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full size-2.5 bg-primary" />
      </span>
      <span className="text-[13px] leading-6 font-medium text-muted-foreground">Thinking…</span>
    </div>
  )
}
