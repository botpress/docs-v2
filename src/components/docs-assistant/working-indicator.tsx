import { memo } from 'react'

/**
 * Stable morphing square — wrapped in memo so the CSS animation never
 * restarts when the parent re-renders with a different label.
 */
const MorphShape = memo(function MorphShape() {
  return <span className="thinking-morph" aria-hidden />
})

interface WorkingIndicatorProps {
  label?: string
}

export function WorkingIndicator({ label }: WorkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2.5 py-2" aria-label={label || 'Thinking'} role="status">
      <MorphShape />
      <span
        className={`text-[13px] leading-6 font-medium text-muted-foreground docs-assistant-shimmer ${
          label ? '' : 'invisible'
        }`}
      >
        {label || 'Thinking'}
      </span>
    </div>
  )
}
