import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Check } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from 'cn'
import { Segmented, SegmentedItem } from '@/components/dashboard/segmented'
import { fmtRelative } from '@/components/dashboard/utils'

export type CheckFilter = 'all' | 'failures'

const EMPTY_COPY = 'Aún no hay comprobaciones. La primera se ejecutará en menos de 30 s.'

function latencyWidth(ms: number, scope: number) {
  const scale = Math.max(scope * 2, 50)
  return Math.min(100, (ms / scale) * 100)
}

function CheckLatencyMeter({
  ms,
  ok,
  scope,
}: {
  ms: number
  ok: boolean
  scope: number
}) {
  const width = latencyWidth(ms, scope)
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full',
            ok ? 'bg-foreground/35' : 'bg-down/70'
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-16 text-right tabular-nums">{ms > 0 ? `${Math.round(ms)} ms` : '—'}</span>
    </div>
  )
}

export function ChecksTable({
  checks,
  loading,
  page,
  pageSize,
  total,
  showEvenIfEmpty = false,
  scope,
  filter = 'all',
  onFilterChange,
  onPageChange,
}: {
  checks: Check[] | undefined
  loading?: boolean
  page: number
  pageSize: number
  total: number
  showEvenIfEmpty?: boolean
  scope?: { p95: number }
  filter?: CheckFilter
  onFilterChange?: (filter: CheckFilter) => void
  onPageChange?: (page: number) => void
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const data = checks ?? []
  const hasData = data.length > 0

  if (!loading && !hasData && !showEvenIfEmpty) {
    return (
      <Card className="flex min-h-40 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">{EMPTY_COPY}</p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="px-6 pt-4 pb-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <CardTitle>Comprobaciones</CardTitle>
          {onFilterChange ? (
            <CardAction>
              <Segmented label="Filtrar comprobaciones">
                <SegmentedItem
                  active={filter === 'all'}
                  onClick={() => onFilterChange('all')}
                >
                  Todas
                </SegmentedItem>
                <SegmentedItem
                  active={filter === 'failures'}
                  onClick={() => onFilterChange('failures')}
                >
                  Solo fallos
                </SegmentedItem>
              </Segmented>
            </CardAction>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="border-t p-0">
        <Table>
          <TableHeader className="sticky top-[52px] z-10 bg-card">
            <TableRow>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Comprobación
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">
                Código
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">
                Latencia
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">
                Resultado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !hasData
              ? Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-1.5">
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Skeleton className="ml-auto h-4 w-8" />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {hasData
              ? data.map((check) => {
                  const checkedAt = new Date(check.checked_at)
                  const ok = check.success
                  const p95 = scope?.p95 ?? 0
                  return (
                    <TableRow key={check.id}>
                      <TableCell className="py-1.5">
                        <div className="text-sm tabular-nums">
                          <span className="capitalize">
                            {fmtRelative(check.checked_at, now)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {format(checkedAt, 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-right tabular-nums">
                        {check.status_code ?? '—'}
                      </TableCell>
                      <TableCell className="py-1.5" style={{ textAlign: 'right' }}>
                        <CheckLatencyMeter
                          ms={check.response_time_ms ?? 0}
                          ok={ok}
                          scope={p95}
                        />
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        {ok ? (
                          <Badge variant="secondary">Correcta</Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="border-down/25 bg-down/10 text-down"
                          >
                            Fallo
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
            {!loading && !hasData && showEvenIfEmpty ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  {EMPTY_COPY}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>

      <CardContent className="flex items-center justify-between border-t px-6 py-3">
        <span className="text-sm text-muted-foreground tabular-nums">
          {total > 0 ? `${checks?.length ?? 0} de ${total} comprobaciones` : 'Sin comprobaciones'}
        </span>
        {onPageChange ? (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              aria-label="Página siguiente"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}