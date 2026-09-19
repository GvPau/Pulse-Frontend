import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

export function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon ? (
          <span className="text-muted-foreground [&>svg]:size-4" aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
    </Card>
  )
}