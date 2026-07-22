// CSV and Markdown serialization for ResultBlock exports. Pure — the download
// side (Blob, anchor click) lives in the component.

import { rawText, type ResultColumn, type ResultRow } from './tabular.ts';

/** RFC 4180: quote when the field holds a delimiter, quote, or newline. */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * CSV over the *raw* values, not the formatted ones — a spreadsheet should get
 * `5821157`, not `5,821,157`, or every number lands as text. CRLF because that
 * is what Excel expects.
 */
export function toCsv(columns: ResultColumn[], rows: ResultRow[]): string {
  const lines = [columns.map((c) => csvField(c.label)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => csvField(rawText(row[c.key]))).join(','));
  }
  return lines.join('\r\n');
}

/** Pipe cells would split a column, so escape them rather than dropping them. */
function mdCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * GitHub-flavored table for pasting into Slack, Notion, or a PR body. Numeric
 * columns get a right-aligned delimiter so the paste keeps its shape.
 */
export function toMarkdown(columns: ResultColumn[], rows: ResultRow[]): string {
  const header = `| ${columns.map((c) => mdCell(c.label)).join(' | ')} |`;
  const rule = `| ${columns
    .map((c) => (c.type === 'number' ? '---:' : '---'))
    .join(' | ')} |`;
  const body = rows.map(
    (row) => `| ${columns.map((c) => mdCell(rawText(row[c.key]))).join(' | ')} |`,
  );
  return [header, rule, ...body].join('\n');
}

/** Slugged filename stem so two blocks in one report do not collide. */
export function exportFilename(base: string, extension: string): string {
  const stem =
    base
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'result';
  return `${stem}.${extension}`;
}
