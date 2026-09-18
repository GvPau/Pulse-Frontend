import { toQuery, get } from './client'
import type { Incident, IncidentStatus, ListResponse, PaginationParams } from './types'

export interface IncidentListParams extends PaginationParams {
  monitor_id?: string
  status?: IncidentStatus
}

export const listIncidents = (params: IncidentListParams = {}) =>
  get<ListResponse<Incident>>(`/incidents${toQuery(params)}`)