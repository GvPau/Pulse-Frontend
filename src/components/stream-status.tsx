import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getToken } from '@/lib/auth'
import type { StreamEventName } from '@/api/types'
import { useSse } from '@/hooks/use-sse'

const EVENT_LABELS: Record<StreamEventName, string> = {
  'check.completed': 'check',
  'incident.opened': 'incidente',
  'incident.resolved': 'incidente resuelto',
  'monitor.created': 'monitor creado',
  'monitor.updated': 'monitor actualizado',
  'monitor.deleted': 'monitor eliminado',
}

export function AppSseStatus() {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries()
  }, [queryClient])

  const { status, lastEvent } = useSse({
    'check.completed': invalidateAll,
    'incident.opened': invalidateAll,
    'incident.resolved': invalidateAll,
    'monitor.created': invalidateAll,
    'monitor.updated': invalidateAll,
    'monitor.deleted': invalidateAll,
  })

  const label = status === 'open' ? 'En vivo' : status === 'closed' ? 'Reconectando…' : 'Conectando…'
  const dot =
    status === 'open'
      ? 'bg-emerald-500'
      : status === 'closed'
        ? 'bg-amber-500'
        : 'bg-muted-foreground/50'

  const last = lastEvent ? EVENT_LABELS[lastEvent.event] : null

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" title={getToken() ? undefined : 'Sin sesión: el stream se conectará al iniciar sesión'}>
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      <span>{label}</span>
      {last && <span className="hidden sm:inline">· {last}</span>}
    </div>
  )
}