import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import type { MetricsWindow } from '@/api/types'

const config = {
  latency: {
    label: 'Latencia',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig

const pad2 = (n: number) => String(n).padStart(2, '0')

function formatTick(epochMs: number, window: MetricsWindow) {
  const date = new Date(epochMs)
  if (window === '24h' || window === '7d') {
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)} ${pad2(
      date.getHours()
    )}:${pad2(date.getMinutes())}`
  }
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`
}

export function LatencyChart({
  data,
  window,
  height = 160,
}: {
  data: { time: number; latency: number }[]
  window: MetricsWindow
  height?: number
}) {
  const chartData = useMemo(
    () => data.filter((d) => d.latency > 0),
    [data]
  )

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <AreaChart
        data={chartData}
        margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fillLatency" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-latency)"
              stopOpacity={0.18}
            />
            <stop
              offset="100%"
              stopColor="var(--color-latency)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeOpacity={0.6}
        />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(v: number) => formatTick(v, window)}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) => `${v} ms`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(epoch) => {
                const ts =
                  typeof epoch === 'number'
                    ? epoch
                    : typeof epoch === 'string'
                      ? Number(epoch)
                      : Number(epoch)
                return new Date(ts).toLocaleString('es-ES')
              }}
              formatter={(value) => [
                `${Math.round(Number(value))} ms`,
                'Latencia',
              ]}
            />
          }
        />
        <Area
          dataKey="latency"
          type="natural"
          fill="url(#fillLatency)"
          stroke="var(--color-latency)"
          strokeWidth={1.75}
        />
      </AreaChart>
    </ChartContainer>
  )
}