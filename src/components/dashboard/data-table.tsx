import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Header,
  type SortingFn,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronUp,
  EllipsisVertical,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteMonitor, listMonitors, updateMonitor } from '@/api/monitors'
import type { ListResponse, MonitorWithStatus } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from 'cn'
import {
  fmtInterval,
  fmtMs,
  fmtRelative,
  fmtTime,
  fmtUptime,
  StatusBadge,
  toRequest,
  type BadgeStatus,
} from './utils'
import { Segmented, SegmentedItem } from './segmented'

type MonitorRow = MonitorWithStatus
type Beat = 'ok' | 'down' | 'none'
type Segment = 'all' | 'down'

const STRIP_LEN = 30
const PAGE_SIZE = 10

const STATUS_RANK: Record<BadgeStatus, number> = {
  down: 0,
  operational: 1,
  unknown: 2,
  paused: 3,
}

const effectiveStatus = (m: MonitorWithStatus): BadgeStatus =>
  m.active ? m.status : 'paused'

const statusSortingFn: SortingFn<MonitorRow> = (rowA, rowB) =>
  STATUS_RANK[effectiveStatus(rowA.original)] -
  STATUS_RANK[effectiveStatus(rowB.original)]

const fmtCount = (n: number) => `${n} ${n === 1 ? 'monitor' : 'monitores'}`

function HeartbeatStrip({
  beats,
  paused,
}: {
  beats?: MonitorRow['beats']
  paused: boolean
}) {
  const cells: Beat[] = []
  for (const beat of beats ?? []) cells.push(beat === 'down' ? 'down' : 'ok')
  while (cells.length < STRIP_LEN) cells.unshift('none')
  const normalized = cells.slice(-STRIP_LEN)
  const last = normalized.length - 1

  return (
    <div
      role="img"
      aria-label="Últimas comprobaciones"
      title="Últimas comprobaciones"
      className="flex h-6 w-fit items-end gap-[2px]"
    >
      {normalized.map((beat, index) => {
        if (paused) {
          return (
            <span
              key={index}
              className="h-[35%] w-[3px] rounded-full bg-muted-foreground/30"
            />
          )
        }
        if (beat === 'none') {
          return (
            <span
              key={index}
              className="h-[35%] w-[3px] rounded-full bg-border"
            />
          )
        }
        const solid = index === last
        return (
          <span
            key={index}
            className={cn(
              'h-full w-[3px] rounded-full',
              beat === 'ok'
                ? solid
                  ? 'bg-ok'
                  : 'bg-ok/40'
                : solid
                  ? 'bg-down'
                  : 'bg-down/40'
            )}
          />
        )
      })}
    </div>
  )
}

function SortableHeader({ header }: { header: Header<MonitorRow, unknown> }) {
  const sorted = header.column.getIsSorted()
  if (!header.column.getCanSort()) {
    return flexRender(header.column.columnDef.header, header.getContext())
  }
  return (
    <button
      type="button"
      onClick={header.column.getToggleSortingHandler()}
      data-sorted={sorted ? '' : undefined}
      className="group inline-flex max-w-full items-center gap-1 font-medium hover:text-foreground"
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {sorted === 'asc' ? (
        <ChevronUp className="size-3 opacity-100" />
      ) : sorted === 'desc' ? (
        <ChevronDown className="size-3 opacity-100" />
      ) : (
        <ChevronsUpDown className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}

const columnHelper = createColumnHelper<MonitorRow>()

function RowActions({ row }: { row: MonitorRow }) {
  const queryClient = useQueryClient()

  const deleteMonitorMutation = useMutation({
    mutationFn: () => deleteMonitor(row.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['monitors'] })
      const previous = queryClient.getQueryData<ListResponse<MonitorWithStatus>>(
        ['monitors']
      )
      queryClient.setQueryData<ListResponse<MonitorWithStatus>>(
        ['monitors'],
        (old) => (old ? { ...old, data: old.data.filter((m) => m.id !== row.id) } : old)
      )
      return { previous }
    },
    onSuccess: () => toast.success('Monitor eliminado'),
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['monitors'], ctx.previous)
      toast.error('No se pudo eliminar el monitor')
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-open:bg-muted"
            size="icon"
          />
        }
      >
        <EllipsisVertical />
        <span className="sr-only">Más</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          variant="destructive"
          onClick={() => deleteMonitorMutation.mutate()}
        >
          <Trash2 />
          <span>Eliminar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ActiveSwitch({ row }: { row: MonitorRow }) {
  const queryClient = useQueryClient()

  const updateMonitorMutation = useMutation({
    mutationFn: (active: boolean) =>
      updateMonitor(row.id, { ...toRequest(row), active }),
    onMutate: async (active) => {
      await queryClient.cancelQueries({ queryKey: ['monitors'] })
      const previous = queryClient.getQueryData<ListResponse<MonitorWithStatus>>(
        ['monitors']
      )
      queryClient.setQueryData<ListResponse<MonitorWithStatus>>(
        ['monitors'],
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map((m) =>
                  m.id === row.id ? { ...m, active } : m
                ),
              }
            : old
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['monitors'], ctx.previous)
      toast.error('No se pudo actualizar el monitor')
    },
  })

  return (
    <Switch
      checked={row.active}
      onCheckedChange={(checked) => updateMonitorMutation.mutate(checked)}
      aria-label="Activar o pausar"
    />
  )
}

export function DataTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [segment, setSegment] = useState<Segment>('all')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const { data } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => listMonitors({ page: 1, limit: 50 }),
  })

  const monitors = data?.data ?? []
  const totalCount = monitors.length
  const downCount = monitors.filter((m) => effectiveStatus(m) === 'down').length
  const visibleData =
    segment === 'down'
      ? monitors.filter((m) => effectiveStatus(m) === 'down')
      : monitors

  const columns = useMemo(
    () => [
      columnHelper.accessor((m) => effectiveStatus(m), {
        id: 'status',
        header: () => 'Estado',
        sortingFn: statusSortingFn,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} active={row.original.active} />
        ),
      }),
      columnHelper.accessor((m) => m.name, {
        id: 'name',
        header: () => 'Monitor',
        cell: ({ row }) => (
          <div className="flex max-w-[320px] flex-col">
            <Link
              to={`/monitores/${row.original.id}`}
              className="truncate font-medium underline-offset-4 hover:underline"
            >
              {row.original.name}
            </Link>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {row.original.url}
            </span>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'beats',
        header: () => <span className="sr-only">Rendimiento</span>,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <HeartbeatStrip beats={row.original.beats} paused={!row.original.active} />
        ),
      }),
      columnHelper.accessor((m) => m.uptime, {
        id: 'uptime',
        header: () => 'Uptime 24 h',
        enableGlobalFilter: false,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtUptime(getValue<number>())}</span>
        ),
      }),
      columnHelper.accessor((m) => m.avg_response_ms, {
        id: 'latency',
        header: () => 'Latencia',
        enableGlobalFilter: false,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtMs(getValue<number>())}</span>
        ),
      }),
      columnHelper.accessor((m) => m.interval_seconds, {
        id: 'interval',
        header: () => 'Intervalo',
        enableGlobalFilter: false,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtInterval(getValue<number>())}</span>
        ),
      }),
      columnHelper.accessor((m) => m.last_check_at, {
        id: 'last_check_at',
        header: () => 'Última',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span
            className="text-muted-foreground"
            title={fmtTime(row.original.last_check_at)}
          >
            {fmtRelative(row.original.last_check_at, now)}
          </span>
        ),
      }),
      columnHelper.accessor((m) => m.active, {
        id: 'active',
        header: () => 'Activo',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => <ActiveSwitch row={row.original} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableGlobalFilter: false,
        cell: ({ row }) => <RowActions row={row.original} />,
      }),
    ],
    [now]
  )

  const table = useReactTable({
    data: visibleData,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    getRowId: (row) => row.id,
    initialState: {
      sorting: [{ id: 'status', desc: false }],
      pagination: { pageSize: PAGE_SIZE },
    },
    state: {
      sorting,
      globalFilter,
    },
  })

  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()
  const rowCount = table.getFilteredRowModel().rows.length

  const emptyMessage =
    monitors.length === 0
      ? 'No hay monitores todavía.'
      : segment === 'down'
        ? 'Sin monitores caídos por el momento.'
        : 'Sin resultados para la búsqueda.'

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <Segmented label="Filtrar monitores">
          {(Object.keys({ all: '', down: '' }) as Segment[]).map((tab) => {
            const active = segment === tab
            const count = tab === 'all' ? totalCount : downCount
            return (
              <SegmentedItem
                key={tab}
                active={active}
                onClick={() => {
                  setSegment(tab)
                  table.setPageIndex(0)
                }}
              >
                {tab === 'all' ? 'Todos' : 'Caídos'}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </SegmentedItem>
            )
          })}
        </Segmented>
        <div className="relative w-full sm:min-w-52 sm:max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              table.setPageIndex(0)
            }}
            placeholder="Buscar por nombre o URL…"
            aria-label="Buscar monitores"
            className="w-full pl-8"
          />
        </div>
      </div>

      <Table className="md:[&_td]:px-4">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-10 text-xs text-muted-foreground md:px-4">
                  <SortableHeader header={header} />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rowCount > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  effectiveStatus(row.original) === 'down'
                    ? 'bg-down/5 hover:bg-down/10'
                    : 'hover:bg-muted/50'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-4 border-t px-4 py-2.5">
        <p className="text-sm text-muted-foreground">{fmtCount(rowCount)}</p>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Página {pageIndex + 1} de {pageCount}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={pageIndex === 0}
              >
                <ChevronsLeft />
                <span className="sr-only">Primera página</span>
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={pageIndex === 0}
              >
                <ChevronLeft />
                <span className="sr-only">Página anterior</span>
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={pageIndex >= pageCount - 1}
              >
                <ChevronRight />
                <span className="sr-only">Página siguiente</span>
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={pageIndex >= pageCount - 1}
              >
                <ChevronsRight />
                <span className="sr-only">Última página</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}