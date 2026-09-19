import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { MetricsPoint } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from 'cn'

function barColor(uptime: number) {
  if (uptime >= 0.999) return 'bg-[--ok]'
  if (uptime > 0) return 'bg-[--warn]'
  return 'bg-[--down]'
}

export function UptimeStrip({
  series,
  fromLabel,
}: {
  series: MetricsPoint[]
  fromLabel: string
}) {
  if (series.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-10 items-end gap-0.5" role="img" aria-label="Uptime por intervalo">
        {series.map((point) => {
          const date = new Date(point.bucket)
          const pct = point.uptime * 100
          return (
            <Tooltip key={point.bucket}>
              <TooltipTrigger
                render={
                  <div
                    className={cn(
                      'flex-1 rounded-[2px]',
                      barColor(point.uptime),
                      pct === 0 && 'min-h-[4px]'
                    )}
                    style={
                      pct > 0
                        ? { height: `${Math.max(6, pct)}%` }
                        : undefined
                    }
                  />
                }
              />
              <TooltipContent side="top">
                {format(date, 'd MMM, HH:mm', { locale: es })} ·{' '}
                {pct.toFixed(2)}% uptime
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{fromLabel}</span>
        <Badge
          variant="outline"
          className="gap-1 border-[--down]/25 bg-[--down]/10 font-normal text-[--down]"
        >
          <span className="size-1.5 rounded-full bg-[--down]" aria-hidden />
          Incidente
        </Badge>
        <span>Ahora</span>
      </div>
    </div>
  )
}