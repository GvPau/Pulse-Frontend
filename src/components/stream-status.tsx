import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getToken } from '@/lib/auth'
import { useSse } from '@/hooks/use-sse'

function fmtElapsed(seconds: number) {
  if (seconds < 5) return 'justo ahora'
  if (seconds < 60) return `hace ${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours} h`
}

export function AppSseStatus() {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries()
  }, [queryClient])

  const { status, lastActivityAt } = useSse({
    'check.completed': invalidateAll,
    'incident.opened': invalidateAll,
    'incident.resolved': invalidateAll,
    'monitor.created': invalidateAll,
    'monitor.updated': invalidateAll,
    'monitor.deleted': invalidateAll,
  })

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (status !== 'open') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [status])

  const label =
    status === 'open' ? 'En vivo' : status === 'closed' ? 'Reconectando…' : 'Conectando…'
  const dot =
    status === 'open'
      ? 'bg-[--ok] animate-pulse'
      : status === 'closed'
        ? 'bg-[--warn]'
        : 'bg-muted-foreground/50'

  const activity =
    status === 'open' && lastActivityAt != null
      ? ` · última ${fmtElapsed(Math.max(0, Math.round((now - lastActivityAt) / 1000)))}`
      : ''

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground"
      title={getToken() ? undefined : 'Sin sesión: el stream se conectará al iniciar sesión'}
      aria-live="off"
    >
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      <span>
        {label}
        {activity}
      </span>
    </div>
  )
}