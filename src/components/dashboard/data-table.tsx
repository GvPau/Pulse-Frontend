import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  EllipsisVertical,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteMonitor, listMonitors, updateMonitor } from '@/api/monitors'
import type { ListResponse, MonitorWithStatus } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { fmtTime, StatusBadge, toRequest } from './utils'

type MonitorRow = { [K in keyof MonitorWithStatus]: MonitorWithStatus[K] }

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

  const { data } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => listMonitors({ page: 1, limit: 50 }),
  })

  const monitors = data?.data ?? []

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => <div className="w-full">Nombre</div>,
        cell: ({ row }) => (
          <Link
            to={`/monitores/${row.original.id}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      }),
      columnHelper.accessor('url', {
        cell: ({ row }) => {
          const cellValue = row.getValue<string>('url')
          return (
            <div className="max-w-[240px] truncate font-medium">
              {cellValue}
            </div>
          )
        },
        header: () => <div className="w-full">URL</div>,
        enableSorting: false,
      }),
      columnHelper.accessor('interval_seconds', {
        cell: ({ row }) => {
          const interval = row.getValue<number>('interval_seconds')
          return (
            <div className="text-center tabular-nums">
              {interval >= 60 ? `${Math.round(interval / 60)} m` : `${interval} s`}
            </div>
          )
        },
        header: () => <div className="w-full">Intervalo</div>,
      }),
      columnHelper.accessor('status', {
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            active={row.original.active}
          />
        ),
        header: () => <div className="w-full">Estado</div>,
      }),
      columnHelper.accessor('last_check_at', {
        cell: ({ row }) => {
          const cellValue = row.original.last_check_at
          return (
            <div className="text-muted-foreground">
              {fmtTime(cellValue)}
            </div>
          )
        },
        header: () => <div className="w-full">Actualizado</div>,
        enableSorting: false,
      }),
      columnHelper.accessor('active', {
        cell: ({ row }) => <ActiveSwitch row={row.original} />,
        header: () => <div className="w-full">Activo</div>,
      }),
      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => <RowActions row={row.original} />,
      }),
    ],
    []
  )

  const table = useReactTable({
    data: monitors,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    getRowId: (row) => row.id,
    state: {
      sorting,
      globalFilter,
    },
  })

  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()

  return (
    <Card className="@container/card border-0">
      <CardHeader>
        <CardTitle className="text-2xl">Monitores</CardTitle>
        <CardDescription>
          Visualiza y gestiona los monitores de tu panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between gap-2">
            <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-2">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="down">Caídos</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar monitores"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-48"
              />
            </div>
          </div>
          <TabsContent value="all">
            <div className="overflow-hidden rounded-md border">
              <Table className="md:[& td]:p-4">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="md:px-4"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : (
                            <div>
                              {header.column.getCanSort() &&
                              header.column.id !== 'last_check_at' ? (
                                <button
                                  className="flex items-center gap-1 hover:text-foreground"
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  <ChevronDown className="size-3" />
                                </button>
                              ) : (
                                flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )
                              )}
                            </div>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="odd:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
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
                        No hay monitores todavía.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end gap-2 py-3">
              <div className="text-sm text-muted-foreground">
                Página {pageIndex + 1} de {pageCount}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  className="h-8 w-8"
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
          </TabsContent>
          <TabsContent value="down">
            <p className="text-sm text-muted-foreground">
              Sin monitores caídos por el momento.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}