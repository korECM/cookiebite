import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';
import { maxEmbeddedRows, EMBEDDED_ROW_WARN_THRESHOLD } from '../lib/build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.resolve(root, 'test/fixtures/result-block.tsx');

let cached;
async function markup() {
  cached ??= (await renderReport(fixture)).markup;
  return cached;
}

test('ResultBlock: declares its embedded row count for the build gate', async () => {
  const html = await markup();
  assert.equal(maxEmbeddedRows(html), 6);
});

test('maxEmbeddedRows: takes the largest block, 0 when none', () => {
  assert.equal(maxEmbeddedRows('<div data-rows="12"></div><div data-rows="900"></div>'), 900);
  assert.equal(maxEmbeddedRows('<div></div>'), 0);
  assert.ok(EMBEDDED_ROW_WARN_THRESHOLD > 0);
});

test('ResultBlock: server markup hides nothing — no-JS readers lose no pane', async () => {
  const html = await markup();
  // Every collapsible region is tagged for the print/no-JS restore rule, and
  // none of them ship pre-collapsed from the server.
  const reveals = html.match(/data-cb-reveal[^>]*/g) ?? [];
  assert.ok(reveals.length >= 4, `expected reveal regions, got ${reveals.length}`);
  for (const region of reveals) {
    assert.doesNotMatch(region, /\bhidden\b/, `SSR pre-collapsed a region: ${region}`);
  }
});

test('ResultBlock: query renders open on the server, with SQL keywords weighted', async () => {
  const html = await markup();
  assert.match(html, /platform_analytics_track_submitcoupon/);
  assert.match(html, /font-semibold text-foreground[^>]*>SELECT</);
});

test('ResultBlock: a sourced block shows provenance instead of a query', async () => {
  const html = await markup();
  assert.match(html, /운영팀 집계 시트/);
});

test('ResultBlock: engine, run time, and duration land in the footer', async () => {
  const html = await markup();
  assert.match(html, /BigQuery/);
  assert.match(html, /2026-07-22 14:17:19/);
  assert.match(html, /6\.4s/);
});

test('ResultBlock: CSV label names the full original row count', async () => {
  const html = await markup();
  assert.match(html, /CSV \(전체 6행\)/);
});

test('ResultBlock: numbers are grouped and right-aligned', async () => {
  const html = await markup();
  assert.match(html, /5,821,157/);
  assert.match(html, /text-right/);
});

test('ResultBlock: totals sum the numeric columns', async () => {
  const html = await markup();
  // 5821157 + 4639922 + 106072 + 81463 + 25479 + 12
  assert.match(html, /10,674,105/);
});

test('ResultBlock: controls are marked so print can drop them', async () => {
  const html = await markup();
  assert.match(html, /data-cb-controls/);
});

test('ResultBlock: only the toggle-mode block ships a chart/table switch', async () => {
  const html = await markup();
  // Scoped to the block's own labelled group — the shell's dark/density
  // controls are also aria-pressed buttons and would otherwise be counted.
  const groups = html.match(/role="group" aria-labelledby="[^"]*-view"/g) ?? [];
  assert.equal(groups.length, 1, 'both-mode and table-only blocks need no switch');
  assert.match(html, /aria-pressed="true"[^>]*>표</);
});

test('ResultBlock: no hex color literals in the new sources', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const files = [
    'src/report/result-block.tsx',
    ...readdirSync(path.join(root, 'src/report/result-block')).map(
      (f) => `src/report/result-block/${f}`,
    ),
  ];
  for (const file of files) {
    const src = readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${file} must not contain hex colors`);
  }
});
