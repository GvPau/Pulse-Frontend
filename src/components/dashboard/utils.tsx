import { Badge } from '@/components/ui/badge'
import type { MonitorRequest, MonitorStatus, MonitorWithStatus } from '@/api/types'

export const STATUS_STYLE: Record<MonitorStatus, string> = {
  operational: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  down: 'bg-red-500/15 text-red-700 dark:text-red-300',
  unknown: 'bg-muted text-muted-foreground',
}

export const STATUS_DOT: Record<MonitorStatus, string> = {
  operational: 'bg-emerald-500',
  down: 'bg-red-500',
  unknown: 'bg-muted-foreground/50',
}

export const STATUS_LABEL: Record<MonitorStatus, string> = {
  operational: 'Operativo',
  down: 'Caído',
  unknown: 'Sin datos',
}

export function StatusBadge({ status }: { status: MonitorStatus }) {
  return (
    <Badge variant="secondary" className={STATUS_STYLE[status]}>
      {STATUS_LABEL[status]}
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