import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteMonitor, listMonitors, updateMonitor } from '@/api/monitors'
import type { MonitorRequest, MonitorStatus, MonitorWithStatus } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { ApiError } from '@/api/client'

const STATUS_STYLE: Record<MonitorStatus, string> = {
  operational: 'bg-emerald-500/15 text-emerald-700',
  down: 'bg-red-500/15 text-red-700',
  unknown: 'bg-muted text-muted-foreground',
}

const STATUS_LABEL: Record<MonitorStatus, string> = {
  operational: 'Operativo',
  down: 'Caído',
  unknown: 'Sin datos',
}

function StatusBadge({ status }: { status: MonitorStatus }) {
  return (
    <Badge variant="secondary" className={STATUS_STYLE[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

function toRequest(m: MonitorWithStatus): MonitorRequest {
  return {
    name: m.name,
    url: m.url,
    method: m.method,
    expected_status: m.expected_status,
    interval_seconds: m.interval_seconds,
    timeout_seconds: m.timeout_seconds,
    active: m.active,
    failure_threshold: m.failure_threshold,
  }
}

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : '—'

const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`
const fmtMs = (v: number) => (v > 0 ? `${Math.round(v)} ms` : '—')

function MonitorRow({ monitor }: { monitor: MonitorWithStatus }) {
  const queryClient = useQueryClient()

  const toggleActive = useMutation({
    mutationFn: () =>
      updateMonitor(monitor.id, { ...toRequest(monitor), active: !monitor.active }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['monitors'] }),
  })

  const onDelete = useMutation({
    mutationFn: () => deleteMonitor(monitor.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['monitors'] }),
  })

  return (
    <TableRow>
      <TableCell className="font-medium">{monitor.name}</TableCell>
      <TableCell className="text-muted-foreground">{monitor.url}</TableCell>
      <TableCell>
        <StatusBadge status={monitor.status} />
      </TableCell>
      <TableCell className="tabular-nums">{fmtPct(monitor.uptime)}</TableCell>
      <TableCell className="tabular-nums">{fmtMs(monitor.avg_response_ms)}</TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {fmtTime(monitor.last_check_at)}
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {monitor.last_status_code ?? '—'}
      </TableCell>
      <TableCell>
        <Switch
          checked={monitor.active}
          disabled={toggleActive.isPending}
          onCheckedChange={() => toggleActive.mutate()}
          title={monitor.active ? 'Pausar' : 'Activar'}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          disabled={onDelete.isPending}
          onClick={() => {
            if (window.confirm(`¿Eliminar el monitor "${monitor.name}"?`)) {
              onDelete.mutate()
            }
          }}
        >
          Eliminar
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function DashboardPage() {
  const { isAuthenticated } = useAuth()

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => listMonitors({ page: 1, limit: 50 }),
    refetchInterval: 30_000,
    enabled: isAuthenticated,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitores</CardTitle>
        <CardDescription>
          Estado actual, uptime y últimas respuestas de tus monitores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            {(error as ApiError).message}
          </p>
        )}

        {data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Uptime (24h)</TableHead>
                <TableHead>Latencia</TableHead>
                <TableHead>Último check</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No hay monitores todavía.
                  </TableCell>
                </TableRow>
              )}
              {data.data.map((m) => (
                <MonitorRow key={m.id} monitor={m} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}