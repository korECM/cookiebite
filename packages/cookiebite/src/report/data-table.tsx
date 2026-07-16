'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
}

/** Sortable header button — authors can use this in ColumnDef.header. */
export function DataTableColumnHeader({
  title,
  column,
}: {
  title: string;
  column: {
    getCanSort: () => boolean;
    toggleSorting: (desc?: boolean) => void;
    getIsSorted: () => false | 'asc' | 'desc';
  };
}) {
  if (!column.getCanSort()) {
    return <span>{title}</span>;
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {title}
      <ArrowUpDown className="size-4" aria-hidden />
    </Button>
  );
}

function metaClassName<TData, TValue>(
  column: Column<TData, TValue>,
): string | undefined {
  const meta = column.columnDef.meta as { className?: string } | undefined;
  return meta?.className;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  className,
}: DataTableProps<TData, TValue>) {
  // Empty initial sort keeps SSR row order identical to first client paint.
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const leafCount = table.getAllLeafColumns().length;
  const showFooter = table
    .getAllLeafColumns()
    .some((column) => column.columnDef.footer != null);
  // Footer groups are deepest-first (inverse of header groups).
  const leafFooterGroup = table
    .getFooterGroups()
    .find((group) => group.headers.every((h) => h.subHeaders.length === 0));

  return (
    <div className={cn('w-full min-w-0 overflow-x-auto rounded-md border border-border', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  rowSpan={header.rowSpan > 0 ? header.rowSpan : undefined}
                  className={metaClassName(header.column)}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={metaClassName(cell.column)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={leafCount}
                className="h-24 text-center text-muted-foreground"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {showFooter && leafFooterGroup ? (
          <TableFooter>
            <TableRow key={leafFooterGroup.id}>
              {leafFooterGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  colSpan={header.colSpan}
                  className={metaClassName(header.column)}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext(),
                      )}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  );
}
