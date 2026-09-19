import { useEffect, useRef, useState } from 'react'
import { getToken } from '@/lib/auth'
import { STREAM_EVENT_NAMES, type StreamEvent, type StreamEventName } from '@/api/types'

const DEFAULT_URL = import.meta.env.VITE_SSE_URL ?? '/api/stream'

export type StreamStatus = 'connecting' | 'open' | 'closed'

type Handlers = Partial<Record<StreamEventName, (data: unknown) => void>>

function parseData(raw: string): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return raw
  }
}

/**
 * Connects to the `/stream` SSE endpoint using the JWT via `?token=`
 * (EventSource cannot send headers). EventSource reconnects automatically;
 * `status` reflects the current connection state.
 */
export function useSse(handlers?: Handlers) {
  const [status, setStatus] = useState<StreamStatus>('connecting')
  const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null)
  const [lastActivityAt, setLastActivityAt] = useState<number | null>(null)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const token = getToken()
    const url = token ? `${DEFAULT_URL}?token=${encodeURIComponent(token)}` : DEFAULT_URL
    const es = new EventSource(url)

    es.onopen = () => {
      setStatus('open')
      setLastActivityAt(Date.now())
    }
    es.onerror = () => setStatus('closed')

    const dispatch = (event: StreamEventName) => (e: MessageEvent) => {
      const data = parseData(e.data)
      const ev = { event, data } satisfies StreamEvent
      setLastEvent(ev)
      setLastActivityAt(Date.now())
      handlersRef.current?.[event]?.(data)
    }

    for (const name of STREAM_EVENT_NAMES) {
      es.addEventListener(name, dispatch(name))
    }
    es.onmessage = (e) => {
      const ev = { event: 'check.completed', data: parseData(e.data) } satisfies StreamEvent
      setLastEvent(ev)
      setLastActivityAt(Date.now())
      handlersRef.current?.['check.completed']?.(ev.data)
    }

    return () => es.close()
  }, [])

  return { status, lastEvent, lastActivityAt }
}