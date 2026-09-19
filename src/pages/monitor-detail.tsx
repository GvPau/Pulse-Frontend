import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Copy,
  ExternalLink,
  Gauge,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  Timer,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteMonitor, getMetrics, getMonitor, listChecks, updateMonitor } from '@/api/monitors'
import { listIncidents } from '@/api/incidents'
import type { Incident, MetricsWindow, MonitorRequest, MonitorWithStatus } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ChecksTable, type CheckFilter } from '@/components/monitor/checks-table'
import { KpiCard } from '@/components/monitor/kpi-card'
import { LatencyChart } from '@/components/monitor/latency-chart'
import { MonitorStatusBadge } from '@/components/monitor/status-badge'
import { getMonitorStatus } from '@/components/monitor/status'
import { UptimeStrip } from '@/components/monitor/uptime-strip'
import { fmtMs, fmtPct, toRequest } from '@/components/dashboard/utils'

const WINDOWS: { value: MetricsWindow; label: string }[] = [
  { value: '24h', label: '24 h' },
  { value: '7d', label: '7 d' },
  { value: '30d', label: '30 d' },
]

const WINDOW_DESC: Record<MetricsWindow, string> = {
  '24h': 'últimas 24 horas',
  '7d': 'últimos 7 días',
  '30d': 'últimos 30 días',
  '90d': 'últimos 90 días',
}

const UPTIME_FROM: Record<MetricsWindow, string> = {
  '24h': 'Hace 24 horas',
  '7d': 'Hace 7 días',
  '30d': 'Hace 30 días',
  '90d': 'Hace 90 días',
}

const KPI_SUB: Record<MetricsWindow, string> = {
  '24h': 'en las últimas 24 horas',
  '7d': 'en los últimos 7 días',
  '30d': 'en los últimos 30 días',
  '90d': 'en los últimos 90 días',
}

function fmtInterval(seconds: number) {
  if (seconds < 60) return `${seconds} s`
  if (seconds % 60 === 0) return `${seconds / 60} min`
  return `${seconds / 60} min`
}

function fmtDuration(startedAt: string, resolvedAt: string | null) {
  if (!resolvedAt) return 'En curso'
  const total = Math.round(
    (new Date(resolvedAt).getTime() - new Date(startedAt).getTime()) / 1000
  )
  if (total < 60) return `${total} s`
  if (total < 3600) return `${Math.floor(total / 60)} min`
  return `${Math.floor(total / 3600)} h ${Math.floor((total % 3600) / 60)} min`
}

function NextRunKpi({ nextRun, active }: { nextRun: string | null; active: boolean }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  let value = 'Ahora'
  if (!active) value = 'Pausado'
  else if (nextRun) {
    const diff = new Date(nextRun).getTime() - now
    if (diff > 0) {
      const seconds = Math.round(diff / 1000)
      if (seconds < 60) value = `en ${seconds} s`
      else if (seconds < 3600) value = `en ${Math.floor(seconds / 60)} min`
      else value = `en ${Math.floor(seconds / 3600)} h`
    }
  }

  return (
    <KpiCard
      label="Siguiente comprobación"
      icon={<CalendarClock />}
      value={value}
      sub={active ? 'próxima comprobación programada' : 'el monitor está en pausa'}
    />
  )
}

function ConfigRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <dl className="flex flex-col gap-1 py-2">
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="text-sm tabular-nums">{children}</dd>
    </dl>
  )
}

function MonitorConfigCard({ monitor }: { monitor: MonitorWithStatus }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4">
        <ConfigRow term="URL">
          <span className="inline-flex min-w-0 max-w-full items-center gap-1">
            {monitor.url}
          </span>
        </ConfigRow>
        <ConfigRow term="Método">{monitor.method}</ConfigRow>
        <ConfigRow term="Estado esperado">{monitor.expected_status}</ConfigRow>
        <ConfigRow term="Intervalo">{fmtInterval(monitor.interval_seconds)}</ConfigRow>
        <ConfigRow term="Tiempo de espera">{monitor.timeout_seconds} s</ConfigRow>
        <ConfigRow term="Umbral de fallos">
          {monitor.failure_threshold === 1
            ? '1 fallo'
            : `${monitor.failure_threshold} fallos seguidos`}
        </ConfigRow>
        <ConfigRow term="Estado">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${
                monitor.active ? 'bg-[--ok]' : 'bg-muted-foreground/60'
              }`}
              aria-hidden
            />
            {monitor.active ? 'Activo' : 'En pausa'}
          </span>
        </ConfigRow>
        <ConfigRow term="Creado">
          {new Date(monitor.created_at).toLocaleDateString('es', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </ConfigRow>
      </CardContent>
    </Card>
  )
}

function LastIncidentCard({ incident }: { incident: Incident | null }) {
  if (!incident) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Último incidente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sin incidentes registrados. El monitor no ha fallado recientemente.
          </p>
        </CardContent>
      </Card>
    )
  }

  const open = incident.status === 'active'
  return (
    <Card>
      <CardHeader>
        <CardTitle>Último incidente</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {open ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-[--down]/25 bg-[--down]/10 text-sm font-medium text-[--down]"
            >
              <span className="size-1.5 rounded-full bg-[--down] motion-safe:animate-pulse" aria-hidden />
              Activo
            </Badge>
          ) : (
            <Badge variant="secondary">Resuelto</Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {new Date(incident.started_at).toLocaleString('es', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="grid grid-cols-2">
          <ConfigRow term="Duración">
            {fmtDuration(incident.started_at, incident.resolved_at)}
          </ConfigRow>
          <ConfigRow term="Comprobaciones fallidas">{incident.failure_count}</ConfigRow>
        </div>
      </CardContent>
    </Card>
  )
}

function IncidentCard({ incident }: { incident: Incident }) {
  const open = incident.status === 'active'
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {new Date(incident.started_at).toLocaleString('es', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {open ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-[--down]/25 bg-[--down]/10 text-[--down]"
            >
              <span className="size-1.5 rounded-full bg-[--down] motion-safe:animate-pulse" aria-hidden />
              Activo
            </Badge>
          ) : (
            <Badge variant="secondary">Resuelto</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 text-sm text-muted-foreground">
          <span>
            Duración:{' '}
            <span className="text-foreground tabular-nums">
              {fmtDuration(incident.started_at, incident.resolved_at)}
            </span>
          </span>
          <span>
            Fallos:{' '}
            <span className="text-foreground tabular-nums">{incident.failure_count}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function MonitorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState('resumen')
  const [window, setWindow] = useState<MetricsWindow>('7d')
  const [checksPage, setChecksPage] = useState(1)
  const [filter, setFilter] = useState<CheckFilter>('all')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  const monitorQuery = useQuery({
    queryKey: ['monitors', id],
    queryFn: () => getMonitor(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  })
  const monitor = monitorQuery.data

  const metricsQuery = useQuery({
    queryKey: ['metrics', id, window],
    queryFn: () => getMetrics(id!, window),
    enabled: !!id,
    refetchInterval: 30_000,
  })
  const metrics = metricsQuery.data

  const checksQuery = useQuery({
    queryKey: ['checks', id, checksPage, filter],
    queryFn: () =>
      listChecks(id!, {
        page: checksPage,
        limit: 30,
        success: filter === 'failures' ? false : undefined,
      }),
    enabled: !!id,
    refetchInterval: 30_000,
  })

  const incidentsQuery = useQuery({
    queryKey: ['incidents', id],
    queryFn: () => listIncidents({ monitor_id: id, page: 1, limit: 20 }),
    enabled: !!id,
    refetchInterval: 30_000,
  })
  const incidents = incidentsQuery.data?.data ?? []
  const lastIncident = incidents[0] ?? null

  const updateMutation = useMutation({
    mutationFn: (body: MonitorRequest) => updateMonitor(id!, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['monitors', id] })
      void queryClient.invalidateQueries({ queryKey: ['monitors'] })
      void queryClient.invalidateQueries({ queryKey: ['metrics', id] })
      toast.success(monitor?.active ? 'Monitor pausado' : 'Monitor reanudado')
    },
    onError: () => toast.error('No se pudo actualizar el monitor'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMonitor(id!),
    onSuccess: () => {
      setDeleteOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['monitors'] })
      void queryClient.invalidateQueries({ queryKey: ['incidents', id] })
      toast.success('Monitor eliminado')
      navigate('/monitores')
    },
    onError: () => toast.error('No se pudo eliminar el monitor'),
  })

  const checkNow = () => {
    void queryClient.invalidateQueries({ queryKey: ['checks', id] })
    void queryClient.invalidateQueries({ queryKey: ['metrics', id] })
    toast.success('Comprobación solicitada')
  }

  const copyUrl = async () => {
    if (!monitor) return
    await navigator.clipboard.writeText(monitor.url)
    toast.success('URL copiada al portapapeles')
  }

  const chartData = useMemo(
    () =>
      (metrics?.series ?? []).map((point) => ({
        time: new Date(point.bucket).toLocaleString([], {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        latency: point.avg_response_ms,
      })),
    [metrics]
  )

  if (monitorQuery.isError) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4">
        <Card className="flex min-h-40 items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-medium">Monitor no encontrado</p>
            <p className="text-sm text-muted-foreground">
              Puede que haya sido eliminado o que el enlace sea incorrecto.
            </p>
            <Button variant="outline" onClick={() => navigate('/monitores')}>
              <ArrowLeft /> Volver a monitores
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (monitorQuery.isPending) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[380px]" />
      </div>
    )
  }

  if (!monitor) return null

  const status = getMonitorStatus(monitor.status, monitor.active)
  const windowDesc = WINDOW_DESC[window]
  const kpiSub = KPI_SUB[window]

  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit gap-1.5 px-2 text-muted-foreground"
          onClick={() => navigate('/monitores')}
        >
          <ArrowLeft className="size-4" />
          Monitores
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {monitor.name}
            </h1>
            <MonitorStatusBadge status={status} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                updateMutation.mutate({
                  ...toRequest(monitor),
                  active: !monitor.active,
                })
              }
              disabled={updateMutation.isPending}
            >
              {monitor.active ? <Pause /> : <Play />}
              {monitor.active ? 'Pausar' : 'Reanudar'}
            </Button>
            <Button variant="outline" onClick={checkNow}>
              <RefreshCw />
              Comprobar ahora
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9"
                    aria-label="Acciones del monitor"
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void copyUrl()}>
                  <Copy />
                  Copiar URL
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTab('configuracion')}>
                  <Settings2 />
                  Editar configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                  <Trash2 />
                  Eliminar monitor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
          <a
            href={monitor.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 max-w-full items-center gap-1 truncate text-foreground hover:text-primary hover:underline"
          >
            <span className="truncate">{monitor.url}</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {monitor.method} cada {fmtInterval(monitor.interval_seconds)}
          </span>
        </p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value)}>
        <TabsList variant="line">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="comprobaciones">Comprobaciones</TabsTrigger>
          <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Disponibilidad"
              icon={<Activity />}
              value={
                metrics ? (
                  fmtPct(metrics.summary.uptime)
                ) : (
                  <Skeleton className="h-7 w-16" />
                )
              }
              sub={metrics ? kpiSub : undefined}
            />
            <KpiCard
              label="Latencia media"
              icon={<Gauge />}
              value={
                metrics ? (
                  fmtMs(metrics.summary.avg_response_ms)
                ) : (
                  <Skeleton className="h-7 w-16" />
                )
              }
              sub={metrics ? kpiSub : undefined}
            />
            <KpiCard
              label="p95"
              icon={<Timer />}
              value={
                metrics ? (
                  fmtMs(metrics.summary.p95_response_ms)
                ) : (
                  <Skeleton className="h-7 w-16" />
                )
              }
              sub={metrics ? kpiSub : undefined}
            />
            <NextRunKpi nextRun={monitor.next_run} active={monitor.active} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Latencia</CardTitle>
              <CardDescription>
                Latencia media · {windowDesc}
              </CardDescription>
              <CardAction>
                <ToggleGroup
                  variant="outline"
                  size="sm"
                  value={[window]}
                  onValueChange={(value) => {
                    const next = value?.[0]
                    if (next) setWindow(next as MetricsWindow)
                  }}
                >
                  {WINDOWS.map((w) => (
                    <ToggleGroupItem key={w.value} value={w.value} className="h-7 w-9">
                      {w.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 px-2 sm:px-6">
              {metrics ? (
                <LatencyChart data={chartData} />
              ) : (
                <Skeleton className="h-[220px]" />
              )}
              <Separator />
              {metrics && metrics.series.length > 0 ? (
                <UptimeStrip series={metrics.series} fromLabel={UPTIME_FROM[window]} />
              ) : (
                <Skeleton className="h-12" />
              )}
            </CardContent>
          </Card>

          <div className="grid items-start gap-4 xl:grid-cols-[1.55fr_1fr]">
            <ChecksTable
              checks={checksQuery.data?.data}
              loading={checksQuery.isFetching}
              page={checksPage}
              pageSize={30}
              total={checksQuery.data?.pagination.total ?? 0}
              scope={{ p95: metrics?.summary.p95_response_ms ?? 0 }}
              filter={filter}
              onFilterChange={(next) => {
                setFilter(next)
                setChecksPage(1)
              }}
              onPageChange={(next) => setChecksPage(next)}
            />
            <div className="flex flex-col gap-4">
              <MonitorConfigCard monitor={monitor} />
              <LastIncidentCard incident={lastIncident} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comprobaciones" className="flex flex-col gap-4">
          <ChecksTable
            checks={checksQuery.data?.data}
            loading={checksQuery.isFetching}
            page={checksPage}
            pageSize={30}
            total={checksQuery.data?.pagination.total ?? 0}
            showEvenIfEmpty
            scope={{ p95: metrics?.summary.p95_response_ms ?? 0 }}
            filter={filter}
            onFilterChange={(next) => {
              setFilter(next)
              setChecksPage(1)
            }}
            onPageChange={(next) => setChecksPage(next)}
          />
        </TabsContent>

        <TabsContent value="incidentes" className="flex flex-col gap-4">
          {incidents.length === 0 ? (
            <Card className="flex min-h-40 items-center justify-center p-6">
              <p className="text-sm text-muted-foreground">
                Sin incidentes registrados en este monitor.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {incidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alertas" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>
                Recibirás un correo cuando este monitor deje de estar operativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <span>
                  La configuración de alertas por correo está gestionada desde tu cuenta. Por
                  ahora no puedes personalizarla desde aquí.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracion" className="flex flex-col gap-4">
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <MonitorConfigCard monitor={monitor} />
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Zona de peligro</CardTitle>
                <CardDescription>
                  Eliminar este monitor borra de forma permanente su historial de
                  comprobaciones e incidentes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 />
                  Eliminar monitor
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar monitor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará{' '}
              <span className="font-medium text-foreground">{monitor.name}</span> y su
              historial de forma permanente, sin posibilidad de deshacerla. Escribe el
              nombre del monitor para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-delete">Nombre del monitor</Label>
            <Input
              id="confirm-delete"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={monitor.name}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteOpen(false)
                setConfirmName('')
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirmName !== monitor.name || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar monitor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}