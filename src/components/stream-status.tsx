import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getToken } from '@/lib/auth'
import { useSse } from '@/hooks/use-sse'
import type {
  Check,
  ListResponse,
  MonitorWithStatus,
  StreamEventName,
} from '@/api/types'

const EVENT_QUERY_KEYS: Record<string, string[][]> = {
  'incident.opened': [['incidents'], ['monitors']],
  'incident.resolved': [['incidents'], ['monitors']],
  'monitor.created': [['monitors']],
  'monitor.updated': [['monitors']],
  'monitor.deleted': [['monitors']],
}

const DEBOUNCE_MS = 300

function getMonitorId(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null
  const id = (data as { monitor_id?: unknown }).monitor_id
  return typeof id === 'string' && id !== '' ? id : null
}

function patchMonitorCheck(queryClient: QueryClient, check: Check) {
  const { monitor_id: monitorId, checked_at, status_code, success } = check

  const resolveStatus = (current: MonitorWithStatus): MonitorWithStatus['status'] => {
    if (current.status === 'unknown') {
      return 'operational'
    }
    return current.status
  }

  queryClient.setQueryData<ListResponse<MonitorWithStatus>>(
    ['monitors'],
    (old) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.map((m) =>
          m.id === monitorId
            ? {
                ...m,
                status: resolveStatus(m),
                last_check_at: checked_at,
                last_status_code: status_code,
                last_success: success,
              }
            : m
        ),
      }
    }
  )

  queryClient.setQueryData<MonitorWithStatus>(['monitors', monitorId], (old) => {
    if (!old) return old
    return {
      ...old,
      status: resolveStatus(old),
      last_check_at: checked_at,
      last_status_code: status_code,
      last_success: success,
    }
  })
}

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

  const pendingKeysRef = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushPending = useCallback(() => {
    timerRef.current = null
    const keys = [...pendingKeysRef.current]
    pendingKeysRef.current = new Set()
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key.split('/') })
    }
  }, [queryClient])

  const invalidateLater = useCallback(
    (keys: string[][]) => {
      for (const key of keys) pendingKeysRef.current.add(key.join('/'))
      if (timerRef.current == null) {
        timerRef.current = setTimeout(flushPending, DEBOUNCE_MS)
      }
    },
    [flushPending]
  )

  const invalidate = useCallback((eventName: StreamEventName) => {
    const keys = EVENT_QUERY_KEYS[eventName]
    if (!keys) return
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key })
    }
  }, [queryClient])

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries()
  }, [queryClient])

  const { status, lastActivityAt } = useSse({
    'check.completed': (data) => {
      const monitorId = getMonitorId(data)
      if (monitorId == null) return
      const check = data as Check
      patchMonitorCheck(queryClient, check)
      invalidateLater([
        ['metrics', monitorId],
        ['checks', monitorId],
      ])
    },
    'incident.opened': () => invalidate('incident.opened'),
    'incident.resolved': () => invalidate('incident.resolved'),
    'monitor.created': () => invalidateLater([['monitors']]),
    'monitor.updated': () => invalidate('monitor.updated'),
    'monitor.deleted': () => invalidate('monitor.deleted'),
  })

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const [now, setNow] = useState(() => Date.now())
  const prevStatusRef = useRef(status)

  useEffect(() => {
    if (status !== 'open') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [status])

  useEffect(() => {
    if (prevStatusRef.current === 'closed' && status === 'open') {
      invalidateAll()
    }
    prevStatusRef.current = status
  }, [status, invalidateAll])

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