import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  alignOf,
  chartableColumns,
  columnTotals,
  filterRows,
  formatCell,
  rawText,
  toSeriesKeys,
} from '../src/lib/tabular.ts';
import {
  exportFilename,
  toCsv,
  toMarkdown,
} from '../src/lib/serialize-tabular.ts';
import { tokenizeSql } from '../src/lib/sql-highlight.ts';

const columns = [
  { key: 'game', label: '게임', type: 'text' },
  { key: 'users', label: '사용자', type: 'number' },
];

const rows = [
  { game: 'ck', users: 5821157 },
  { game: 'crg', users: 4639922 },
  { game: 'mars', users: 12 },
];

test('rawText: nullish becomes empty, not the string "null"', () => {
  assert.equal(rawText(null), '');
  assert.equal(rawText(undefined), '');
  assert.equal(rawText(0), '0');
  assert.equal(rawText(NaN), '');
});

test('formatCell: numbers get grouped, text passes through', () => {
  assert.equal(formatCell(5821157, columns[1], 'en-US'), '5,821,157');
  assert.equal(formatCell('ck', columns[0], 'en-US'), 'ck');
});

test('formatCell: author format wins over the default', () => {
  const column = { key: 'pct', label: '비율', type: 'number', format: (v) => `${v}%` };
  assert.equal(formatCell(42, column), '42%');
});

test('alignOf: numbers read right, everything else left', () => {
  assert.equal(alignOf(columns[1]), 'right');
  assert.equal(alignOf(columns[0]), 'left');
});

test('filterRows: matches the displayed text, including grouped digits', () => {
  assert.equal(filterRows(rows, columns, 'crg', 'en-US').length, 1);
  assert.equal(filterRows(rows, columns, '5,821', 'en-US').length, 1);
  assert.equal(filterRows(rows, columns, '', 'en-US').length, 3);
  assert.equal(filterRows(rows, columns, 'zzz', 'en-US').length, 0);
});

test('filterRows: case-insensitive', () => {
  assert.equal(filterRows(rows, columns, 'CK').length, 1);
});

test('columnTotals: sums numeric columns only', () => {
  const totals = columnTotals(rows, columns);
  assert.equal(totals.users, 5821157 + 4639922 + 12);
  assert.equal('game' in totals, false);
});

test('columnTotals: ignores non-finite cells rather than producing NaN', () => {
  const totals = columnTotals([{ users: 5 }, { users: null }, { users: NaN }], columns);
  assert.equal(totals.users, 5);
});

test('chartableColumns: splits categories from measures', () => {
  const { categorical, numeric } = chartableColumns(columns);
  assert.deepEqual(categorical.map((c) => c.key), ['game']);
  assert.deepEqual(numeric.map((c) => c.key), ['users']);
});

test('toSeriesKeys: normalizes one key or many', () => {
  assert.deepEqual(toSeriesKeys('users'), ['users']);
  assert.deepEqual(toSeriesKeys(['users', 'posts']), ['users', 'posts']);
});

test('toCsv: raw values, not formatted ones', () => {
  const csv = toCsv(columns, rows);
  assert.match(csv, /^게임,사용자\r\n/);
  assert.match(csv, /ck,5821157/);
  assert.doesNotMatch(csv, /5,821,157/);
});

test('toCsv: quotes fields holding a comma, quote, or newline', () => {
  const csv = toCsv(
    [{ key: 'a', label: 'A' }],
    [{ a: 'x,y' }, { a: 'say "hi"' }, { a: 'one\ntwo' }],
  );
  assert.match(csv, /"x,y"/);
  assert.match(csv, /"say ""hi"""/);
  assert.match(csv, /"one\ntwo"/);
});

test('toMarkdown: right-aligns numeric columns', () => {
  const md = toMarkdown(columns, rows);
  const [header, rule] = md.split('\n');
  assert.equal(header, '| 게임 | 사용자 |');
  assert.equal(rule, '| --- | ---: |');
});

test('toMarkdown: escapes pipes so a cell cannot split a column', () => {
  const md = toMarkdown([{ key: 'a', label: 'A' }], [{ a: 'x|y' }]);
  assert.match(md, /x\\\|y/);
});

test('exportFilename: slugs and falls back', () => {
  assert.equal(exportFilename('게임별 쿠폰 사용자', 'csv'), '게임별-쿠폰-사용자.csv');
  assert.equal(exportFilename('  ', 'png'), 'result.png');
});

test('tokenizeSql: round-trips the source exactly', () => {
  const sql = "SELECT a FROM t -- note\nWHERE x = 'y' AND n = 42";
  const tokens = tokenizeSql(sql);
  assert.equal(tokens.map((t) => t.text).join(''), sql);
});

test('tokenizeSql: classifies keywords, strings, numbers, comments', () => {
  const tokens = tokenizeSql("SELECT 1 FROM t WHERE x = 'y' -- c");
  const kind = (text) => tokens.find((t) => t.text === text)?.kind;
  assert.equal(kind('SELECT'), 'keyword');
  assert.equal(kind('FROM'), 'keyword');
  assert.equal(kind('1'), 'number');
  assert.equal(kind("'y'"), 'string');
  assert.equal(kind('-- c'), 'comment');
});

test('tokenizeSql: a keyword inside a string stays a string', () => {
  const tokens = tokenizeSql("WHERE name = 'select from'");
  assert.equal(tokens.filter((t) => t.kind === 'keyword').length, 1);
  assert.ok(tokens.some((t) => t.kind === 'string' && t.text === "'select from'"));
});

test('tokenizeSql: identifiers are not keywords', () => {
  const tokens = tokenizeSql('SELECT gameCode');
  assert.equal(tokens.find((t) => t.text.includes('gameCode'))?.kind, 'plain');
});
