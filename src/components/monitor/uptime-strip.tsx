import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { MetricsPoint } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from 'cn'
import { fmtUptime } from '@/components/dashboard/utils'

type BucketStatus = 'up' | 'degraded' | 'down' | 'none'

const TONE: Record<BucketStatus, string> = {
  up: 'bg-ok',
  degraded: 'bg-warn',
  down: 'bg-down',
  none: 'bg-muted',
}

// uptime llega en 0..1 por punto
function bucketStatus(point: MetricsPoint | undefined): BucketStatus {
  if (!point || point.checks === 0) return 'none'
  if (point.uptime >= 0.999) return 'up'
  if (point.uptime > 0) return 'degraded'
  return 'down'
}

function bucketOpacity(status: BucketStatus) {
  if (status === 'up') return 0.65
  if (status === 'degraded') return 0.45
  if (status === 'down') return 0.25
  return 1
}

function timeMask(expectedBuckets: number) {
  return expectedBuckets <= 360 ? 'd MMM, HH:mm' : 'd MMM'
}

export function UptimeStrip({
  series,
  fromLabel,
  incidentActive = false,
  expectedBuckets = series.length,
}: {
  series: MetricsPoint[]
  fromLabel: string
  incidentActive?: boolean
  expectedBuckets?: number
}) {
  if (series.length === 0) return null

  const padded: (MetricsPoint | undefined)[] = [
    ...Array(Math.max(0, expectedBuckets - series.length)).fill(undefined),
    ...series,
  ]

  return (
    <div className="flex flex-col gap-2">
      <div
        role="img"
        aria-label="Disponibilidad a lo largo del tiempo"
        className="relative flex h-10 items-end gap-[2px] overflow-hidden"
      >
        {padded.map((point, index) => {
          const status = bucketStatus(point)
          return (
            <Tooltip key={point?.bucket ?? `none-${index}`}>
              <TooltipTrigger
                render={
                  <div
                    className={cn(
                      'min-w-[2px] flex-1 rounded-[2px]',
                      TONE[status]
                    )}
                    style={
                      status === 'none'
                        ? { height: '35%' }
                        : {
                            height: `${Math.max(35, Math.round((point?.uptime ?? 0) * 100))}%`,
                            opacity: bucketOpacity(status),
                          }
                    }
                  />
                }
              />
              <TooltipContent side="top">
                {point ? (
                  <>
                    {format(new Date(point.bucket), timeMask(expectedBuckets), {
                      locale: es,
                    })}
                    {' · '}
                    {fmtUptime(point.uptime)}
                  </>
                ) : (
                  'Sin datos'
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{fromLabel}</span>
        {incidentActive && (
          <Badge
            variant="outline"
            className="gap-1 border-down/25 bg-down/10 font-normal text-down"
          >
            <span className="size-1.5 rounded-full bg-down" aria-hidden />
            Incidente
          </Badge>
        )}
        <span>Ahora</span>
      </div>
    </div>
  )
}