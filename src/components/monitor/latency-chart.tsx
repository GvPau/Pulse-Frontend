import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

const config = {
  latency: {
    label: 'Latencia',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig

export function LatencyChart({
  data,
  height = 220,
}: {
  data: { time: string; latency: number }[]
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
        margin={{ left: 0, right: 12, top: 12 }}
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
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}