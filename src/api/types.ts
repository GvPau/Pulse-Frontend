export type ErrorCode =
  | 'invalid_request'
  | 'unauthorized'
  | 'not_found'
  | 'conflict'
  | 'internal_error'

export interface ErrorBody {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

export interface ErrorResponse {
  error: ErrorBody
}

export interface MessageOk {
  message: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  has_more: boolean
}

export interface ListResponse<T> {
  data: T[]
  pagination: Pagination
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface AuthRequest {
  email: string
  password: string
}

export interface TokenResponse {
  token: string
}

export interface MonitorRequest {
  name: string
  url: string
  method: string
  expected_status: number
  interval_seconds: number
  timeout_seconds: number
  active: boolean
  failure_threshold: number
}

export interface Monitor {
  id: string
  user_id: string
  name: string
  url: string
  method: string
  expected_status: number
  interval_seconds: number
  timeout_seconds: number
  active: boolean
  next_run: string
  failure_threshold: number
  created_at: string
  updated_at: string
}

export type MonitorStatus = 'operational' | 'down' | 'unknown'

export interface MonitorWithStatus extends Monitor {
  status: MonitorStatus
  last_check_at: string | null
  last_status_code: number | null
  last_success: boolean | null
  uptime: number
  avg_response_ms: number
  checks: number
  beats?: Array<'ok' | 'down'>
}

export interface Check {
  id: string
  monitor_id: string
  status_code: number
  response_time_ms: number
  success: boolean
  error: string | null
  checked_at: string
}

export type IncidentStatus = 'active' | 'resolved'

export interface Incident {
  id: string
  monitor_id: string
  started_at: string
  resolved_at: string | null
  status: IncidentStatus
  failure_count: number
  created_at: string
}

export type MetricsWindow = '24h' | '7d' | '30d' | '90d'

export interface MetricsSummary {
  checks: number
  successes: number
  failures: number
  uptime: number
  avg_response_ms: number
  p95_response_ms: number
}

export interface MetricsPoint {
  bucket: string
  checks: number
  uptime: number
  avg_response_ms: number
}

export interface Metrics {
  monitor_id: string
  window: MetricsWindow
  summary: MetricsSummary
  series: MetricsPoint[]
}

export const STREAM_EVENT_NAMES = [
  'check.completed',
  'incident.opened',
  'incident.resolved',
  'monitor.created',
  'monitor.updated',
  'monitor.deleted',
] as const

export type StreamEventName = (typeof STREAM_EVENT_NAMES)[number]

export interface StreamEvent {
  event: StreamEventName
  data: unknown
}