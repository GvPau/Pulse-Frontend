import { useQuery } from '@tanstack/react-query'
import { Activity, Radio, ShieldAlert, Zap } from 'lucide-react'
import { listMonitors } from '@/api/monitors'
import type { MonitorWithStatus } from '@/api/types'
import type { ReactNode } from 'react'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fmtMs, fmtPct } from './utils'

type CardProps = {
  label: string
  value: string
  detail: string
  icon: ReactNode
}

function MonitorCard({ label, value, detail, icon }: CardProps) {
  return (
    <Card className="*:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs">
      <CardHeader>
        <CardDescription className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1">
            {icon}
            {label}
          </span>
          <CardAction>
            <span className="text-2xl font-medium tabular-nums tracking-tight">
              {value}
            </span>
          </CardAction>
        </CardDescription>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {detail}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

type Counts = {
  total: number
  operational: number
  down: number
  unknown: number
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
    avgLatency: latencyCount > 0 ? latencySum / latencyCount : null,
  }
}

export function SectionCards() {
  const { data } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => listMonitors({ page: 1, limit: 50 }),
    refetchInterval: 30_000,
  })

  const monitors = data?.data ?? []
  const { total, operational, down, avgLatency } =
    computeCounts(monitors)
  const availability = total > 0 ? operational / total : null

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-linear-to-t grid grid-cols-1 gap-4 px-4 *:rounded-lg lg:px-6 @5xl/main:grid-cols-4 @4xl/main:grid-cols-2">
      <MonitorCard
        label="Disponibilidad"
        value={availability !== null ? fmtPct(availability) : '—'}
        detail="Monitores operativos"
        icon={<Activity className="size-4" />}
      />
      <MonitorCard
        label="Súper activos"
        value={String(total)}
        detail="Monitores configurados"
        icon={<Zap className="size-4" />}
      />
      <MonitorCard
        label="Incidentes"
        value={String(down)}
        detail="Monitores caídos"
        icon={<ShieldAlert className="size-4" />}
      />
      <MonitorCard
        label="Latencia"
        value={avgLatency !== null ? fmtMs(avgLatency) : '—'}
        detail="Media de respuesta"
        icon={<Radio className="size-4" />}
      />
    </div>
  )
}