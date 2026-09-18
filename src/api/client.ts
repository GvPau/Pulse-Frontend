import { getToken } from '@/lib/auth'
import type { ErrorBody } from './types'

const DEFAULT_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly body: ErrorBody | null

  constructor(status: number, body: ErrorBody | null) {
    super(body?.message ?? `request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export interface RequestOptions extends RequestInit {
  auth?: boolean
}

/** Serializes query params, dropping undefined/null values. */
export function toQuery(params: object): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

async function parseBody<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined as T
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...init } = options

  const h = new Headers(headers)
  if (init.body !== undefined && !h.has('content-type')) {
    h.set('content-type', 'application/json')
  }
  if (auth) {
    const token = getToken()
    if (token) h.set('authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${DEFAULT_BASE_URL}${path}`, { ...init, headers: h })
  const data = await parseBody<{ error?: ErrorBody }>(res)

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? null)
  }
  return data as T
}

export const get = <T>(path: string, options?: RequestOptions) =>
  request<T>(path, { ...options, method: 'GET' })

export const post = <T>(path: string, body?: unknown, options?: RequestOptions) =>
  request<T>(path, {
    ...options,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export const put = <T>(path: string, body: unknown, options?: RequestOptions) =>
  request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) })

export const del = <T>(path: string, options?: RequestOptions) =>
  request<T>(path, { ...options, method: 'DELETE' })