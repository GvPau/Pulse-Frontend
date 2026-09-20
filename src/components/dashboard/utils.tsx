import { Badge } from '@/components/ui/badge'
import type { MonitorRequest, MonitorStatus, MonitorWithStatus } from '@/api/types'

export type BadgeStatus = MonitorStatus | 'paused'

export const STATUS_STYLE: Record<BadgeStatus, string> = {
  operational: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  down: 'bg-red-500/15 text-red-700 dark:text-red-300',
  unknown: 'bg-muted text-muted-foreground',
  paused: 'bg-muted text-muted-foreground',
}

export const STATUS_LABEL: Record<BadgeStatus, string> = {
  operational: 'Operativo',
  down: 'Caído',
  unknown: 'Sin datos',
  paused: 'Pausado',
}

export function StatusBadge({
  status,
  active,
}: {
  status: MonitorStatus
  active?: boolean
}) {
  const effective: BadgeStatus = active === false ? 'paused' : status
  return (
    <Badge variant="secondary" className={STATUS_STYLE[effective]}>
      {STATUS_LABEL[effective]}
    </Badge>
  )
}

export const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`

export const fmtMs = (v: number) => (v > 0 ? `${Math.round(v)} ms` : '—')

export const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : '—'

export const toRequest = (m: MonitorWithStatus): MonitorRequest => ({
  name: m.name,
  url: m.url,
  method: m.method,
  expected_status: m.expected_status,
  interval_seconds: m.interval_seconds,
  timeout_seconds: m.timeout_seconds,
  failure_threshold: m.failure_threshold,
  active: m.active,
})