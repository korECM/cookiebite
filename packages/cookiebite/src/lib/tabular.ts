// Pure tabular helpers shared by ResultBlock's table, chart, and exports.
// No DOM, no React — everything here is unit-tested from node:test.

export type ResultColumnType = 'text' | 'number' | 'date';

export interface ResultColumn {
  key: string;
  label: string;
  /** Drives alignment, chart eligibility, and totals. Default `'text'`. */
  type?: ResultColumnType;
  /** Display-only override. Exports always serialize the raw value. */
  format?: (value: unknown) => string;
}

export type ResultRow = Record<string, unknown>;

export function isNumeric(column: ResultColumn): boolean {
  return column.type === 'number';
}

/** Numbers and dates read right; everything else reads left. */
export function alignOf(column: ResultColumn): 'left' | 'right' {
  return isNumeric(column) ? 'right' : 'left';
}

/**
 * Raw cell value as a plain string — the shape exports use. Keeps `null` and
 * `undefined` as empty rather than the string "null", which would poison a CSV.
 */
export function rawText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/**
 * Display string for a cell. Numbers get grouped digits so a column of counts
 * stays scannable; `column.format` wins when the author supplies one.
 */
export function formatCell(
  value: unknown,
  column: ResultColumn,
  locale?: string,
): string {
  if (column.format) return column.format(value);
  if (isNumeric(column) && typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString(locale);
  }
  return rawText(value);
}

/**
 * Case-insensitive substring match across every column's *displayed* text, so
 * searching "5,821" finds a formatted number the reader can actually see.
 */
export function filterRows(
  rows: ResultRow[],
  columns: ResultColumn[],
  term: string,
  locale?: string,
): ResultRow[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    columns.some((column) =>
      formatCell(row[column.key], column, locale).toLowerCase().includes(needle),
    ),
  );
}

/**
 * Column sums keyed by column key. Non-numeric columns are absent from the
 * result rather than zero — a zero would read as a real total.
 */
export function columnTotals(
  rows: ResultRow[],
  columns: ResultColumn[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const column of columns) {
    if (!isNumeric(column)) continue;
    let sum = 0;
    for (const row of rows) {
      const value = row[column.key];
      if (typeof value === 'number' && Number.isFinite(value)) sum += value;
    }
    totals[column.key] = sum;
  }
  return totals;
}

/**
 * Columns a chart can use: categories on one axis, measures on the other.
 * Dates count as categorical so a time series can sit on the x-axis.
 */
export function chartableColumns(columns: ResultColumn[]): {
  categorical: ResultColumn[];
  numeric: ResultColumn[];
} {
  return {
    categorical: columns.filter((c) => !isNumeric(c)),
    numeric: columns.filter(isNumeric),
  };
}

/** Author-supplied `y` may be one key or several; normalize to a list. */
export function toSeriesKeys(y: string | string[]): string[] {
  return Array.isArray(y) ? y : [y];
}

export function findColumn(
  columns: ResultColumn[],
  key: string,
): ResultColumn | undefined {
  return columns.find((c) => c.key === key);
}
