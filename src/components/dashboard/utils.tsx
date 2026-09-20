import { Badge } from '@/components/ui/badge'
import { cn } from 'cn'
import type { MonitorRequest, MonitorStatus, MonitorWithStatus } from '@/api/types'

export type BadgeStatus = MonitorStatus | 'paused'

export const STATUS_STYLE: Record<BadgeStatus, string> = {
  operational: 'text-ok-fg bg-ok/12 border-ok/25',
  down: 'text-down-fg bg-down/12 border-down/28',
  unknown: 'text-muted-foreground bg-muted border-transparent',
  paused: 'text-muted-foreground bg-muted border-transparent',
}

export const STATUS_DOT: Record<BadgeStatus, string> = {
  operational: 'bg-ok',
  down: 'bg-down',
  unknown: 'bg-muted-foreground/50',
  paused: 'ring-1 ring-inset ring-muted-foreground',
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
  className,
}: {
  status: MonitorStatus
  active?: boolean
  className?: string
}) {
  const effective: BadgeStatus = active === false ? 'paused' : status
  return (
    <Badge
      variant="secondary"
      className={cn('shadow-none', STATUS_STYLE[effective], className)}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', STATUS_DOT[effective])}
      />
      {STATUS_LABEL[effective]}
    </Badge>
  )
}

const nfPct = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// uptime llega en 0..1; se expande a 0..100 y se trunca a 2 decimales
export const fmtUptime = (v: number | null | undefined): string => {
  if (v == null) return '—'
  const pct = v >= 0 && v <= 1 ? v * 100 : v
  return `${nfPct.format(Math.floor(pct * 100) / 100)} %`
}

export const fmtInterval = (sec: number) =>
  sec >= 60 ? `${Math.round(sec / 60)} min` : `${sec} s`

export const fmtRelative = (iso: string | null, now: number): string => {
  if (!iso) return '—'
  const elapsed = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (elapsed < 60) return `hace ${elapsed} s`
  const minutes = Math.floor(elapsed / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} d`
}

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