import type { MonitorStatus as ApiStatus } from '@/api/types'

export type MonitorStatus = 'up' | 'degraded' | 'down' | 'paused'

export const STATUS_META: Record<
  MonitorStatus,
  { label: string; dot: string; text: string; badge: string }
> = {
  up: {
    label: 'Operativo',
    dot: 'bg-[--ok]',
    text: 'text-[--ok]',
    badge: 'border-[--ok]/25 bg-[--ok]/10',
  },
  degraded: {
    label: 'Degradado',
    dot: 'bg-[--warn]',
    text: 'text-[--warn]',
    badge: 'border-[--warn]/25 bg-[--warn]/10',
  },
  down: {
    label: 'Caído',
    dot: 'bg-[--down]',
    text: 'text-[--down]',
    badge: 'border-[--down]/25 bg-[--down]/10',
  },
  paused: {
    label: 'Pausado',
    dot: 'bg-muted-foreground/60',
    text: 'text-muted-foreground',
    badge: 'border-border bg-muted',
  },
}

export function getMonitorStatus(
  status: ApiStatus,
  active: boolean
): MonitorStatus {
  if (!active) return 'paused'
  if (status === 'operational') return 'up'
  if (status === 'down') return 'down'
  return 'degraded'
}