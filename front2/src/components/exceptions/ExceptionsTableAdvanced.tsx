import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from '@tanstack/react-table'
import { Exception } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/formatters'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface ExceptionsTableAdvancedProps {
  exceptions: Exception[]
  isLoading: boolean
  onExcludeFromAnalytics: (ids: string[], exclude: boolean) => Promise<void>
}


export function ExceptionsTableAdvanced({
  exceptions,
  isLoading,
  onExcludeFromAnalytics,
}: ExceptionsTableAdvancedProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [isExcluding, setIsExcluding] = useState(false)

  // Get unique values for select filters
  const uniqueCategories = useMemo(
    () => Array.from(new Set(exceptions.map((e) => e.category))),
    [exceptions]
  )
  const uniqueTypes = useMemo(
    () => Array.from(new Set(exceptions.map((e) => e.type))),
    [exceptions]
  )
  const uniqueExceptionTypes = useMemo(
    () => Array.from(new Set(exceptions.map((e) => e.exceptionType))),
    [exceptions]
  )
  const uniqueCriticalities = useMemo(
    () => Array.from(new Set(exceptions.map((e) => e.criticality))),
    [exceptions]
  )
  const uniqueStates = useMemo(
    () => Array.from(new Set(exceptions.map((e) => e.state))),
    [exceptions]
  )

  // Always show all exceptions
  const filteredData = exceptions

  const handleToggleExclude = async (id: string, currentStatus: boolean) => {
    setIsExcluding(true)
    try {
      await onExcludeFromAnalytics([id], !currentStatus)
    } finally {
      setIsExcluding(false)
    }
  }

  const columns = useMemo<ColumnDef<Exception>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Tout sélectionner"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Sélectionner la ligne"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'analytics',
        header: 'Analyses',
        cell: ({ row }) => {
          const exception = row.original
          return (
            <button
              onClick={() => handleToggleExclude(exception.id, exception.excludeFromAnalytics)}
              disabled={isExcluding}
              className="p-1 hover:bg-muted rounded transition-colors"
              title={exception.excludeFromAnalytics ? 'Inclure dans les analyses' : 'Exclure des analyses'}
            >
              {exception.excludeFromAnalytics ? (
                <EyeOff className="w-5 h-5 text-orange-600" />
              ) : (
                <Eye className="w-5 h-5 text-green-600" />
              )}
            </button>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => {
          return (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4"
              >
                Catégorie
                {column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
                    </div>
          )
        },
        cell: ({ row }) => <Badge variant="outline">{row.getValue('category')}</Badge>,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => {
          return (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4"
              >
                Type
                {column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
                    </div>
          )
        },
        cell: ({ row }) => row.getValue('type'),
      },
      {
        accessorKey: 'exceptionType',
        header: ({ column }) => {
          return (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4"
              >
                Type d'exception
                {column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
                    </div>
          )
        },
        cell: ({ row }) => {
          const type = row.getValue('exceptionType') as string
          const variant = type === 'Manquant' ? 'destructive' : type === 'Doublon' ? 'default' : 'secondary'
          return <Badge variant={variant}>{type}</Badge>
        },
      },
      {
        accessorKey: 'criticality',
        header: ({ column }) => {
          return (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4"
              >
                Criticité
                {column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
                    </div>
          )
        },
        cell: ({ row }) => {
          const criticality = row.getValue('criticality') as string
          const color = criticality === 'Élevé' ? 'text-red-600' : criticality === 'Moyen' ? 'text-orange-600' : 'text-yellow-600'
          return <span className={`font-semibold ${color}`}>{criticality}</span>
        },
      },
      {
        accessorKey: 'description',
        header: ({ column }) => {
          return (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4"
              >
                Description
                {column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
                    </div>
          )
        },
        cell: ({ row }) => (
          <div className="max-w-md truncate" title={row.getValue('description')}>
            {row.getValue('description')}
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => {
          return (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4"
              >
                Montant
                {column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
                    </div>
          )
        },
        cell: ({ row }) => {
          const exception = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              {exception.sign === 'Entrée' ? (
                <ArrowUp className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={
                  exception.sign === 'Entrée'
                    ? 'text-green-600 font-semibold'
                    : 'text-red-600 font-semibold'
                }
              >
                {formatCurrency(Math.abs(exception.amount))}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'reference',
        header: ({ column }) => {
          return (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4"
              >
                Référence
                {column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
                    </div>
          )
        },
        cell: ({ row }) => {
          const exception = row.original
          if (!exception.reference) {
            return <span className="text-muted-foreground">-</span>
          }
          return (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{exception.reference}</span>
                {exception.odooLink && (
                  <a href={exception.odooLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </a>
                )}
              </div>
              {exception.referenceState && (
                <div className="text-xs text-muted-foreground">{exception.referenceState}</div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'state',
        header: ({ column }) => {
          return (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4"
              >
                État
                {column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
                    </div>
          )
        },
        cell: ({ row }) => <Badge>{row.getValue('state')}</Badge>,
      },
    ],
    [uniqueCategories, uniqueTypes, uniqueExceptionTypes, uniqueCriticalities, uniqueStates]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map((row) => row.original.id)

  const handleExclude = async (exclude: boolean) => {
    setIsExcluding(true)
    try {
      await onExcludeFromAnalytics(selectedIds, exclude)
      setRowSelection({})
    } finally {
      setIsExcluding(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-4">
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExclude(true)}
              disabled={isExcluding}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Exclure des analyses
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExclude(false)}
              disabled={isExcluding}
            >
              <Eye className="w-4 h-4 mr-2" />
              Inclure dans analyses
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-4 text-left font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
                    Aucune exception trouvée
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-muted/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} exception(s) au total
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
