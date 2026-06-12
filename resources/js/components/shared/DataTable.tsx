"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    PaginationState,
} from "@tanstack/react-table"
import { useState, useMemo, useEffect } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DataTablePagination } from "./DataTablePagination"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

export interface FilterableColumn {
    id: string
    label: string
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    showFilter?: boolean
    filterPlaceholder?: string
    filterableColumns?: FilterableColumn[]
    showSelectedRows?: boolean
    actions?: React.ReactNode
}

export function DataTable<TData, TValue>({
    columns,
    data,
    showFilter = false,
    filterPlaceholder = "Search...",
    filterableColumns = [],
    showSelectedRows = true,
    actions,
}: DataTableProps<TData, TValue>) {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [selectedColumn, setSelectedColumn] = useState<string>("global")
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            pagination,
            columnFilters,
            globalFilter,
            rowSelection,
        },
        onPaginationChange: setPagination,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        enableRowSelection: true,
    })

    // Reset to page 0 when filters change
    useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }, [globalFilter, columnFilters])

    // Compute pageCount AFTER table is initialized using filtered rows
    const filteredRowCount = table.getFilteredRowModel().rows.length

    const pageCount = useMemo(
        () => Math.ceil(filteredRowCount / pagination.pageSize),
        [filteredRowCount, pagination.pageSize]
    )

    const activeFilterValue =
        selectedColumn === "global"
            ? globalFilter
            : (table.getColumn(selectedColumn)?.getFilterValue() as string) ?? ""

    const currentFilterValue =
        selectedColumn === "global"
            ? globalFilter
            : (table.getColumn(selectedColumn)?.getFilterValue() as string) ?? ""

    const handleSearch = (value: string) => {
        if (selectedColumn === "global") {
            setGlobalFilter(value)
            setColumnFilters([])
        } else {
            setGlobalFilter("")
            table.getColumn(selectedColumn)?.setFilterValue(value)
        }
    }

    const handleColumnChange = (value: string) => {
        setSelectedColumn(value)
        setGlobalFilter("")
        setColumnFilters([])
    }

    const selectedRowsCount = Object.keys(rowSelection).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                {showFilter && (
                    <div className="flex items-center gap-2">
                        {filterableColumns.length > 0 && (
                            <Select value={selectedColumn} onValueChange={handleColumnChange}>
                                <SelectTrigger className="h-9 w-[160px]">
                                    <SelectValue placeholder="Filter by..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">All Columns</SelectItem>
                                    {filterableColumns.map((col) => (
                                        <SelectItem key={col.id} value={col.id}>
                                            {col.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={
                                    selectedColumn === "global"
                                        ? filterPlaceholder
                                        : `Search by ${filterableColumns.find((c) => c.id === selectedColumn)
                                            ?.label ?? selectedColumn
                                        }...`
                                }
                                value={currentFilterValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-9"
                            />
                        </div>
                    </div>
                )}

                {showSelectedRows && selectedRowsCount > 0 && (
                    <div className="text-sm text-muted-foreground">
                        {selectedRowsCount} of {filteredRowCount} row(s) selected.
                    </div>
                )}

                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>

            <div className="overflow-hidden rounded-xs border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="font-bold">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={cn(
                                        "transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer odd:bg-muted/50"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    {activeFilterValue ? (
                                        <>
                                            No matching results found for:{" "}
                                            <b>"{activeFilterValue}"</b>. Try a different search term.
                                        </>
                                    ) : (
                                        "No results."
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                table={table}
                pagination={pagination}
                totalRows={filteredRowCount}
                pageCount={pageCount}
            />
        </div>
    )
}