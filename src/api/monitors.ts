import { toQuery, del, get, post, put } from './client'
import type {
  Check,
  ListResponse,
  MessageOk,
  Metrics,
  MetricsWindow,
  MonitorRequest,
  MonitorWithStatus,
  PaginationParams,
} from './types'

export interface MonitorListParams extends PaginationParams {
  q?: string
  active?: boolean
  sort?: 'name' | 'created_at' | 'interval_seconds'
  order?: 'asc' | 'desc'
}

export interface CheckListParams extends PaginationParams {
  success?: boolean
}

export const listMonitors = (params: MonitorListParams = {}) =>
  get<ListResponse<MonitorWithStatus>>(`/monitors${toQuery(params)}`)

export const getMonitor = (id: string) => get<MonitorWithStatus>(`/monitors/${id}`)

export const createMonitor = (body: MonitorRequest) => post<MonitorWithStatus>('/monitors', body)

export const updateMonitor = (id: string, body: MonitorRequest) =>
  put<MessageOk>(`/monitors/${id}`, body)

export const deleteMonitor = (id: string) => del<MessageOk>(`/monitors/${id}`)

export const listChecks = (monitorId: string, params: CheckListParams = {}) =>
  get<ListResponse<Check>>(`/monitors/${monitorId}/checks${toQuery(params)}`)

export const getMetrics = (monitorId: string, window: MetricsWindow = '24h') =>
  get<Metrics>(`/monitors/${monitorId}/metrics${toQuery({ window })}`)