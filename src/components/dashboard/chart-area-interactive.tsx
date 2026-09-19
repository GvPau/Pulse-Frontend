import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { getMetrics, listMonitors } from '@/api/monitors'
import type { MetricsWindow } from '@/api/types'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'

const WINDOWS: MetricsWindow[] = ['24h', '7d', '30d']

const config = {
  latency: {
    label: 'Latencia',
    color: 'var(--primary)',
  },
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [window, setWindow] = useState<MetricsWindow>(isMobile ? '24h' : '7d')
  const [monitorId, setMonitorId] = useState<string>()

  const monitorsQuery = useQuery({
    queryKey: ['monitors'],
    queryFn: () => listMonitors({ page: 1, limit: 50 }),
    refetchInterval: 30_000,
  })
  const monitors = monitorsQuery.data?.data ?? []

  useEffect(() => {
    if (!monitorId && monitors.length > 0) setMonitorId(monitors[0].id)
  }, [monitors, monitorId])

  const metricsQuery = useQuery({
    queryKey: ['metrics', monitorId, window],
    queryFn: () => (monitorId ? getMetrics(monitorId, window) : Promise.resolve(null)),
    enabled: !!monitorId,
    refetchInterval: 30_000,
  })

  const chartData = useMemo(
    () =>
      (metricsQuery.data?.series ?? []).map((point) => ({
        time: new Date(point.bucket).toLocaleString([], {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        latency: point.avg_response_ms,
      })),
    [metricsQuery.data]
  )

  return (
    <Card className="@container/card border-0">
      <CardHeader className="relative">
        <CardTitle>Actividad de monitores</CardTitle>
        <CardDescription>
          Escoge un monitor y un periodo para ver la latencia media.
        </CardDescription>
        <CardAction className="absolute top-4 right-4">
          <div className="flex items-center gap-2">
            <Select
              value={window}
              onValueChange={(value) => {
                if (value) setWindow(value as MetricsWindow)
              }}
            >
              <SelectTrigger size="sm" className="w-fit sm:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom">
                <SelectGroup>
                  {WINDOWS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ToggleGroup
              variant="outline"
              value={[window]}
              onValueChange={(value) => {
                const next = value?.[0]
                if (next) setWindow(next as MetricsWindow)
              }}
              className="hidden sm:flex"
            >
              {WINDOWS.map((w) => (
                <ToggleGroupItem key={w} value={w} className="h-8 w-9">
                  {w}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Select
              value={monitorId}
              onValueChange={(value) => setMonitorId(value ?? undefined)}
            >
              <SelectTrigger size="sm" className="flex w-fit min-w-28">
                <SelectValue placeholder="Elige monitor" />
              </SelectTrigger>
              <SelectContent align="end" side="bottom">
                <SelectGroup>
                  {monitors.map((monitor) => (
                    <SelectItem key={monitor.id} value={monitor.id}>
                      {monitor.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{ left: 12, right: 12, top: 12 }}
          >
            <defs>
              <linearGradient id="fillLatency" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-latency)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-latency)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="latency"
              type="natural"
              fill="url(#fillLatency)"
              stroke="var(--color-latency)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}