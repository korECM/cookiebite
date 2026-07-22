'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { copyText } from '@/lib/clipboard';
import { downloadBlob, svgToPngBlob } from '@/lib/svg-to-png';
import { exportFilename, toCsv, toMarkdown } from '@/lib/serialize-tabular';
import {
  alignOf,
  chartableColumns,
  columnTotals,
  filterRows,
  formatCell,
  toSeriesKeys,
  type ResultColumn,
  type ResultRow,
} from '@/lib/tabular';
import { DataTable, DataTableColumnHeader } from './data-table.tsx';
import { ResultChart, type ResultChartType } from './result-block/chart.tsx';
import {
  ResultProvenance,
  type ResultMeta,
  type ResultQuery,
} from './result-block/provenance.tsx';
import { ResultToolbar, type ResultView } from './result-block/toolbar.tsx';

export type { ResultColumn, ResultRow } from '@/lib/tabular';
export type { ResultMeta, ResultQuery } from './result-block/provenance.tsx';

export interface ResultChartSpec {
  type: ResultChartType;
  /** Categorical column key for the x-axis. */
  x: string;
  /** One measure key, or several for a grouped/multi-series chart. */
  y: string | string[];
  /**
   * `'both'` when the claim is about shape — size, trend, skew, spread.
   * `'toggle'` (the default) when the block is a lookup, a manifest, a record.
   */
  mode?: 'both' | 'toggle';
  /** Set false to pin the reader to the authored axes. */
  axisPicker?: boolean;
  /** Plot height in px. Default 260 — tall enough to read, short enough to sit above a table. */
  height?: number;
}

export interface ResultBlockProps {
  columns: ResultColumn[];
  rows: ResultRow[];
  chart?: ResultChartSpec;
  query?: ResultQuery;
  /** Shown in place of the query line when there is nothing to replay. */
  source?: string;
  meta?: ResultMeta;
  /** Sum row under the numeric columns, over the rows currently shown. */
  totals?: boolean;
  /** Rows drawn before the "show all" fold. Default 50. */
  maxRows?: number;
  /** Defaults to on once the result is big enough to be worth searching. */
  searchable?: boolean;
  /** Names the CSV/PNG downloads and labels the table for screen readers. */
  title?: string;
  className?: string;
}

const SEARCH_THRESHOLD = 12;

/**
 * A result set with its provenance: the numbers, an optional chart, and the
 * query (or source) they came from folded into the footer.
 *
 * Bare by design — drop it inside a `Panel` for the card frame and heading.
 */
export function ResultBlock({
  columns,
  rows,
  chart,
  query,
  source,
  meta,
  totals = false,
  maxRows = 50,
  searchable,
  title,
  className,
}: ResultBlockProps) {
  const reactId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Server markup shows every pane; hydration is what introduces the folds, so
  // a report read without JS never loses information.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [view, setView] = useState<ResultView>('table');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [queryOpenState, setQueryOpen] = useState(false);

  const mode: 'none' | 'both' | 'toggle' = chart
    ? (chart.mode ?? 'toggle')
    : 'none';

  const authoredSeries = useMemo(
    () => (chart ? toSeriesKeys(chart.y) : []),
    [chart],
  );
  const { categorical, numeric } = useMemo(
    () => chartableColumns(columns),
    [columns],
  );

  const [axisX, setAxisX] = useState(chart?.x ?? '');
  const [axisY, setAxisY] = useState(authoredSeries[0] ?? '');

  // Picking axes only makes sense for a single measure — swapping Y on a
  // multi-series chart would silently drop the other series.
  const axisPickable =
    !!chart &&
    chart.axisPicker !== false &&
    authoredSeries.length === 1 &&
    (categorical.length > 1 || numeric.length > 1);
  const seriesKeys = axisPickable ? [axisY] : authoredSeries;
  const xKey = axisPickable ? axisX : (chart?.x ?? '');
  const axisIsDefault = xKey === chart?.x && seriesKeys[0] === authoredSeries[0];

  const visibleRows = useMemo(
    () => filterRows(rows, columns, search),
    [rows, columns, search],
  );
  const folded = !expanded && visibleRows.length > maxRows;
  const shownRows = folded ? visibleRows.slice(0, maxRows) : visibleRows;
  const totalsRow = useMemo(
    () => (totals ? columnTotals(shownRows, columns) : null),
    [totals, shownRows, columns],
  );

  const tableColumns = useMemo<ColumnDef<ResultRow>[]>(() => {
    const ordinal: ColumnDef<ResultRow> = {
      id: '__ordinal',
      header: '#',
      enableSorting: false,
      cell: ({ row }) => row.index + 1,
      footer: totals ? '' : undefined,
      meta: { className: 'w-10 text-muted-foreground tabular-nums' },
    };
    const rest = columns.map<ColumnDef<ResultRow>>((column) => {
      const right = alignOf(column) === 'right';
      return {
        accessorKey: column.key,
        header: ({ column: instance }) => (
          <DataTableColumnHeader title={column.label} column={instance} />
        ),
        cell: ({ getValue }) => formatCell(getValue(), column),
        footer: totalsRow
          ? totalsRow[column.key] != null
            ? formatCell(totalsRow[column.key], column)
            : ''
          : undefined,
        meta: {
          className: cn(right && 'text-right', right && 'tabular-nums'),
        },
      };
    });
    return [ordinal, ...rest];
  }, [columns, totals, totalsRow]);

  const showChart =
    mode !== 'none' && (mode === 'both' || !hydrated || view === 'chart');
  const tableHidden = mode === 'toggle' && hydrated && view !== 'table';
  const queryOpen = queryOpenState || !hydrated;
  const showSearch = searchable ?? rows.length >= SEARCH_THRESHOLD;
  const exportName = title ?? 'result';

  const downloadCsv = () => {
    // Always the full original: the fold and the search are ways of reading,
    // not ways of narrowing what the block is.
    // Leading BOM so Excel reads the Korean headers as UTF-8 instead of CP949.
    const blob = new Blob([`\uFEFF${toCsv(columns, rows)}`], {
      type: 'text/csv;charset=utf-8',
    });
    downloadBlob(blob, exportFilename(exportName, 'csv'));
  };

  const downloadPng = async () => {
    const svg = chartRef.current?.querySelector('svg');
    if (!svg) return;
    const background = rootRef.current
      ? getComputedStyle(rootRef.current).backgroundColor
      : undefined;
    const blob = await svgToPngBlob(svg as SVGSVGElement, { background });
    if (blob) downloadBlob(blob, exportFilename(exportName, 'png'));
  };

  return (
    <div
      ref={rootRef}
      data-slot="result-block"
      data-rows={rows.length}
      className={cn('w-full min-w-0', className)}
    >
      <span id={`${reactId}-view`} className="sr-only">
        {title ? `${title} 보기 전환` : '보기 전환'}
      </span>

      <ResultToolbar
        mode={mode}
        view={view}
        onViewChange={setView}
        labelId={`${reactId}-view`}
        axis={
          axisPickable
            ? {
                categorical,
                numeric,
                x: axisX,
                y: axisY,
                onXChange: setAxisX,
                onYChange: setAxisY,
                isDefault: axisIsDefault,
                onReset: () => {
                  setAxisX(chart?.x ?? '');
                  setAxisY(authoredSeries[0] ?? '');
                },
              }
            : undefined
        }
        search={showSearch ? { value: search, onChange: setSearch } : undefined}
      />

      {showChart && chart ? (
        <div ref={chartRef} className={cn(mode === 'both' && 'mb-4')}>
          <ResultChart
            id={`${reactId}-chart`}
            columns={columns}
            rows={shownRows}
            x={xKey}
            y={seriesKeys}
            type={chart.type}
            height={chart.height ?? 260}
          />
        </div>
      ) : null}

      <div data-cb-reveal className={cn(tableHidden && 'hidden')}>
        <DataTable columns={tableColumns} data={shownRows} />
        {folded ? (
          <div className="mt-2 print:hidden">
            <Button variant="outline" size="xs" onClick={() => setExpanded(true)}>
              전체 {visibleRows.length.toLocaleString()}행 보기
            </Button>
          </div>
        ) : null}
      </div>

      <ResultProvenance
        query={query}
        source={source}
        meta={meta}
        totalRows={rows.length}
        queryOpen={queryOpen}
        onToggleQuery={() => setQueryOpen((open) => !open)}
        onDownloadCsv={downloadCsv}
        onCopyMarkdown={() => copyText(toMarkdown(columns, rows)).then(() => undefined)}
        onCopyQuery={() => copyText(query?.text ?? '').then(() => undefined)}
        onDownloadPng={showChart && chart ? downloadPng : undefined}
      />
    </div>
  );
}
