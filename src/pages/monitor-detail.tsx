import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteMonitor, getMonitor, listChecks, updateMonitor } from '@/api/monitors'
import type { Check } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fmtMs, fmtTime, StatusBadge, toRequest } from '@/components/dashboard/utils'

const CHECK_STYLE = {
  ok: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  fail: 'bg-red-500/15 text-red-700 dark:text-red-300',
} as const

function fmtCheckTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  const time = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${time} · ${d.toLocaleDateString('es-ES')}`
}

export function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(30)

  const { data: monitor, isLoading, isError } = useQuery({
    queryKey: ['monitors', id],
    queryFn: () => getMonitor(id as string),
    enabled: !!id,
    refetchInterval: 30_000,
  })

  const updateActiveMutation = useMutation({
    mutationFn: (active: boolean) =>
      updateMonitor(monitor!.id, { ...toRequest(monitor!), active }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMonitor(monitor!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
      toast.success('Monitor eliminado')
      navigate('/monitores')
    },
    onError: () => toast.error('No se pudo eliminar el monitor'),
  })

  const { data: checksData, isLoading: checksLoading } = useQuery({
    queryKey: ['monitors', id, 'checks', page],
    queryFn: () => listChecks(id as string, { page, limit: pageSize }),
    enabled: !!id,
    refetchInterval: 30_000,
  })

  const { data: lastCheckData } = useQuery({
    queryKey: ['monitors', id, 'last-check'],
    queryFn: () => listChecks(id as string, { limit: 1 }),
    enabled: !!id,
    refetchInterval: 30_000,
  })

  const checks: Check[] = checksData?.data ?? []
  const lastCheck: Check | undefined = lastCheckData?.data?.[0]
  const totalChecks = checksData?.pagination.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalChecks / pageSize))

  if (isLoading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !monitor) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            render={<Link to="/monitores" />}
            aria-label="Volver"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-semibold">Monitor no encontrado</h1>
        </div>
        <p className="text-muted-foreground">
          No se pudieron cargar los datos de este monitor.
        </p>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            render={<Link to="/monitores" />}
            aria-label="Volver"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-semibold">{monitor.name}</h1>
          <StatusBadge status={monitor.status} />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="active-switch">Activo</Label>
            <Switch
              id="active-switch"
              checked={monitor.active}
              onCheckedChange={(checked) => updateActiveMutation.mutate(checked)}
              aria-label="Activar o pausar"
            />
          </div>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            <Trash2 />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <Card className="@container/card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Configuración</CardTitle>
            <CardDescription>Detalles de configuración del monitor.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>URL</Label>
              <div className="mt-1 text-sm break-all">{monitor.url}</div>
            </div>
            <div>
              <Label>Método</Label>
              <div className="mt-1 text-sm">{monitor.method}</div>
            </div>
            <div>
              <Label>Estado esperado</Label>
              <div className="mt-1 text-sm">{monitor.expected_status}</div>
            </div>
            <div>
              <Label>Intervalo</Label>
              <div className="mt-1 text-sm tabular-nums">
                {monitor.interval_seconds >= 60
                  ? `${Math.round(monitor.interval_seconds / 60)} min`
                  : `${monitor.interval_seconds} s`}
              </div>
            </div>
            <div>
              <Label>Timeout</Label>
              <div className="mt-1 text-sm tabular-nums">
                {monitor.timeout_seconds} s
              </div>
            </div>
            <div>
              <Label>Umbral de fallos</Label>
              <div className="mt-1 text-sm tabular-nums">
                {monitor.failure_threshold}
              </div>
            </div>
            <div>
              <Label>Siguiente comprobación</Label>
              <div className="mt-1 text-sm">{fmtTime(monitor.next_run)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="@container/card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Última actividad</CardTitle>
            <CardDescription>Datos de la última comprobación del monitor.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Comprobación</Label>
              <div className="mt-1 text-sm">
                {lastCheck ? fmtCheckTime(lastCheck.checked_at) : '—'}
              </div>
            </div>
            <div>
              <Label>Código</Label>
              <div className="mt-1 text-sm tabular-nums">
                {lastCheck?.status_code ?? '—'}
              </div>
            </div>
            <div>
              <Label>Latencia</Label>
              <div className="mt-1 text-sm tabular-nums">
                {lastCheck ? fmtMs(lastCheck.response_time_ms) : '—'}
              </div>
            </div>
            <div className="col-span-2">
              <Label>Resultado</Label>
              <div className="mt-1">
                {lastCheck ? (
                  <Badge
                    variant="secondary"
                    className={lastCheck.success ? CHECK_STYLE.ok : CHECK_STYLE.fail}
                  >
                    {lastCheck.success ? 'OK' : lastCheck.error ?? 'Falló'}
                  </Badge>
                ) : (
                  <span className="text-sm">—</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="@container/card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Comprobaciones</CardTitle>
          <CardDescription>Historial de las últimas comprobaciones del monitor.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Comprobación</TableHead>
                  <TableHead className="text-right">Código</TableHead>
                  <TableHead className="text-right">Latencia</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checksLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-24">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ) : checks.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Sin comprobaciones todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  checks.map((check) => {
                    const checkDate = new Date(check.checked_at)
                    return (
                      <TableRow key={check.id} className="odd:bg-muted/50">
                        <TableCell className="font-medium">
                          <div>
                            {checkDate.toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {checkDate.toLocaleDateString('es-ES')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {check.status_code}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtMs(check.response_time_ms)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={check.success ? CHECK_STYLE.ok : CHECK_STYLE.fail}
                          >
                            {check.success ? 'OK' : check.error ?? 'Falló'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-6">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                className="h-8 w-8"
                size="icon"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft />
                <span className="sr-only">Primera página</span>
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft />
                <span className="sr-only">Página anterior</span>
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight />
                <span className="sr-only">Página siguiente</span>
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight />
                <span className="sr-only">Última página</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}