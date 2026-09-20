import type { ReactNode } from 'react'
import { cn } from 'cn'

export function Segmented({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex items-center rounded-4xl border border-border bg-muted p-0.5"
    >
      {children}
    </div>
  )
}

export function SegmentedItem({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-3xl px-3 text-sm font-medium transition-colors',
        active
          ? 'bg-card text-foreground shadow-xs'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}