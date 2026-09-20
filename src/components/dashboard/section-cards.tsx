import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  CheckCircle2,
  Radio,
  RefreshCcw,
  ShieldAlert,
  Timer,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import { listMonitors } from '@/api/monitors'
import type { MonitorWithStatus } from '@/api/types'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fmtMs, fmtPct } from './utils'

type MonitorCardProps = {
  label: string
  value: string
  badge: ReactNode
  footerTitle: ReactNode
  footerDetail: string
}

function MonitorCard({
  label,
  value,
  badge,
  footerTitle,
  footerDetail,
}: MonitorCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>{badge}</CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">{footerTitle}</div>
        <div className="text-muted-foreground">{footerDetail}</div>
      </CardFooter>
    </Card>
  )
}

type Counts = {
  total: number
  operational: number
  down: number
  unknown: number
  latencyCount: number
  avgLatency: number | null
}

function computeCounts(monitors: MonitorWithStatus[]): Counts {
  const total = monitors.length
  let operational = 0
  let down = 0
  let unknown = 0
  let latencySum = 0
  let latencyCount = 0

  for (const m of monitors) {
    if (m.status === 'operational') operational++
    else if (m.status === 'down') down++
    else unknown++

    if (typeof m.avg_response_ms === 'number' && m.avg_response_ms > 0) {
      latencySum += m.avg_response_ms
      latencyCount++
    }
  }

  return {
    total,
    operational,
    down,
    unknown,
    latencyCount,
    avgLatency: latencyCount > 0 ? latencySum / latencyCount : null,
  }
}

export function SectionCards() {
  const { data } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => listMonitors({ page: 1, limit: 50 }),
  })

  const monitors = data?.data ?? []
  const { total, operational, down, unknown, latencyCount, avgLatency } =
    computeCounts(monitors)
  const availability = total > 0 ? operational / total : null

  return (
    <div className="*:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <MonitorCard
        label="Disponibilidad"
        value={availability !== null ? fmtPct(availability) : '—'}
        badge={
          <Badge variant={down > 0 ? 'destructive' : 'outline'}>
            {down > 0 ? <TriangleAlert /> : <CheckCircle2 />}
            {down > 0 ? `${down} caído${down > 1 ? 's' : ''}` : 'Sin incidencias'}
          </Badge>
        }
        footerTitle={
          <>
            {operational} monitores operativos <Activity className="size-4" />
          </>
        }
        footerDetail={`de ${total} configurados`}
      />
      <MonitorCard
        label="Monitores configurados"
        value={String(total)}
        badge={
          <Badge variant="outline">
            <Zap />
            {unknown > 0 ? `${unknown} sin datos` : 'Con datos'}
          </Badge>
        }
        footerTitle={
          <>
            Actualización automática <RefreshCcw className="size-4" />
          </>
        }
        footerDetail="estado y latencia de los últimos 30 s"
      />
      <MonitorCard
        label="Monitores caídos"
        value={String(down)}
        badge={
          <Badge variant={down > 0 ? 'destructive' : 'secondary'}>
            <ShieldAlert />
            {down > 0 ? 'Alerta activa' : 'Sin alertas'}
          </Badge>
        }
        footerTitle={
          <>
            {down > 0 ? 'Requieren atención' : 'Todo en línea'}{' '}
            <TriangleAlert className="size-4" />
          </>
        }
        footerDetail="monitores con incidencias activas"
      />
      <MonitorCard
        label="Latencia media"
        value={avgLatency !== null ? fmtMs(avgLatency) : '—'}
        badge={
          <Badge variant="outline">
            <Timer />
            {latencyCount} muestras
          </Badge>
        }
        footerTitle={
          <>
            Media de respuesta <Radio className="size-4" />
          </>
        }
        footerDetail="promedio de las latencias registradas"
      />
    </div>
  )
}