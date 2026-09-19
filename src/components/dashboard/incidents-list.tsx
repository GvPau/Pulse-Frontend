import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert } from 'lucide-react'
import { listIncidents } from '@/api/incidents'
import { listMonitors } from '@/api/monitors'
import type { Incident } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fmtTime } from './utils'

const INCIDENT_STYLE: Record<Incident['status'], string> = {
  active: 'bg-red-500/15 text-red-700 dark:text-red-300',
  resolved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
}

const INCIDENT_LABEL: Record<Incident['status'], string> = {
  active: 'Activo',
  resolved: 'Resuelto',
}

function fmtDuration(startedAt: string, resolvedAt: string | null) {
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now()
  const ms = Math.max(0, end - new Date(startedAt).getTime())
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)} h`
  return `${(ms / 86_400_000).toFixed(1)} d`
}

export function IncidentsList() {
  const incidentsQuery = useQuery({
    queryKey: ['incidents'],
    queryFn: () => listIncidents({ page: 1, limit: 20 }),
    refetchInterval: 30_000,
  })

  const monitorsQuery = useQuery({
    queryKey: ['monitors'],
    queryFn: () => listMonitors({ page: 1, limit: 50 }),
    refetchInterval: 30_000,
  })

  const incidents = incidentsQuery.data?.data ?? []

  const monitorName = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of monitorsQuery.data?.data ?? []) map.set(m.id, m.name)
    return (id: string) => map.get(id) ?? id
  }, [monitorsQuery.data])

  return (
    <Card className="@container/card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ShieldAlert className="size-5" />
          Incidentes
        </CardTitle>
        <CardDescription>
          Historial de incidentes, incluidos los que ya se resolvieron.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Monitor</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Fallos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length > 0 ? (
                incidents.map((incident) => (
                  <TableRow key={incident.id} className="odd:bg-muted/50">
                    <TableCell className="font-medium">
                      {monitorName(incident.monitor_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtTime(incident.started_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtTime(incident.resolved_at)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {fmtDuration(incident.started_at, incident.resolved_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={INCIDENT_STYLE[incident.status]}
                      >
                        {INCIDENT_LABEL[incident.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {incident.failure_count}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay incidentes registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}