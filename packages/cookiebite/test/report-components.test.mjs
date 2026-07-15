import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';
import { runCli } from './helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.resolve(root, 'test/fixtures', name);
const reportSrc = path.join(root, 'src/report');

test('report sources contain no hex color literals', () => {
  const files = readdirSync(reportSrc).filter((f) => f.endsWith('.tsx'));
  assert.ok(files.length >= 6, 'expected report component files');
  for (const file of files) {
    const src = readFileSync(path.join(reportSrc, file), 'utf8');
    assert.doesNotMatch(
      src,
      /#[0-9a-fA-F]{3,8}\b/,
      `${file} must not contain hex colors`,
    );
  }
});

test('KpiRow: equal-height grid, tinted delta pill, compare, spark svg, caption mt-auto', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  assert.match(markup, /auto-rows-fr/);
  assert.match(markup, /tabular-nums/);
  assert.match(
    markup,
    /inline-flex items-center gap-0\.5 rounded-md px-1\.5 py-0\.5 text-xs font-medium tabular-nums whitespace-nowrap/,
  );
  assert.match(markup, /bg-success\/10 text-success/);
  assert.match(markup, /bg-destructive\/10 text-destructive/);
  assert.match(markup, /uppercase tracking-wide/);
  assert.match(markup, /mt-auto/);
  assert.match(markup, /Success rate/);
  assert.match(markup, /\+3\.1pp/);
  assert.match(markup, /vs prior week 96\.1%/);
  assert.match(markup, /Recovered after rollback/);
  assert.match(markup, /<svg[\s\S]*?<path/);
  assert.match(markup, /kpi-spark-0/);
});

test('BarList: bar width percent from max value', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  assert.match(markup, /bg-primary\/15/);
  // max=120 → card 100%, wallet 75%, bank ≈33.333%
  assert.match(markup, /width:\s*100%/);
  assert.match(markup, /width:\s*75%/);
  assert.match(markup, /width:\s*33\.3/);
  assert.match(markup, />card</);
  assert.match(markup, />wallet</);
  assert.match(markup, />bank</);
});

test('Tracker: block count and status classes', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  assert.match(markup, /gap-\[3px\]/);
  assert.match(markup, /bg-success\/70/);
  assert.match(markup, /bg-destructive\/70/);
  assert.match(markup, /bg-primary\/40/);
  assert.match(markup, /bg-muted/);
  assert.match(markup, /title="ok"/);
  assert.match(markup, /title="fail"/);
  const blocks = markup.match(/min-w-1\.5 flex-1 rounded-\[4px\]/g) ?? [];
  assert.equal(blocks.length, 4);
});

test('CategoryBar: segment widths sum ~100% and legend rendered', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  assert.match(markup, /bg-chart-1/);
  assert.match(markup, /bg-chart-2/);
  assert.match(markup, /bg-chart-3/);
  assert.match(markup, /width:\s*50%/);
  assert.match(markup, /width:\s*30%/);
  assert.match(markup, /width:\s*20%/);
  assert.match(markup, />new</);
  assert.match(markup, />expand</);
  assert.match(markup, />reactivate</);
  assert.match(markup, /size-2 rounded-full/);
});

test('Claims: no underline, grid row, outline badge', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  assert.doesNotMatch(markup, /underline(?!-offset)/);
  assert.match(markup, /grid-cols-\[1fr_auto\]/);
  assert.match(markup, /Retry loop caused duplicate charges/);
  assert.match(markup, /data-variant="outline"/);
  assert.match(markup, />confirmed</);
});

test('Findings: severity maps to alert variants and icons', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  assert.match(markup, /data-slot="alert"/);
  assert.match(markup, /Retry queue does not await approval/);
  assert.match(markup, /Refund batch runs overnight only/);
  assert.match(markup, /Alert fired within five minutes/);
  // critical → destructive variant on Alert
  assert.match(markup, /text-destructive/);
});

test('Matrix: Check/Minus for booleans, string cells', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  assert.match(markup, /aria-label="yes"/);
  assert.match(markup, /aria-label="no"/);
  assert.match(markup, /payments/);
  assert.match(markup, /Coverage by payment channel/);
});

test('RangeDot: computed value position (50% when centered in domain)', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  // domain 0–1000, value 500 → left: 50%
  assert.match(markup, /left:\s*50%/);
  assert.match(markup, /bg-primary/);
  assert.match(markup, /approve_api/);
});

test('DataTable: all rows in SSR markup, sortable header button', async () => {
  const { markup } = await renderReport(fixture('report-components.tsx'));

  assert.match(markup, /bank_transfer/);
  assert.match(markup, /wallet/);
  assert.match(markup, />card</);
  assert.match(markup, /data-slot="button"/);
  assert.match(markup, /Channel/);
  assert.match(markup, /12040/);
  assert.match(markup, /9012/);
});

test('e2e: KpiRow + DataTable inside Report builds', () => {
  const out = path.join(
    mkdtempSync(path.join(tmpdir(), 'cb-report-')),
    'report.html',
  );
  const result = runCli(['build', fixture('report-kpi-datatable.tsx'), '-o', out]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /Success rate/);
  assert.match(html, /tabular-nums|99\.2/);
  assert.match(html, /wallet|card/);
  assert.match(html, /hydrateRoot|__COOKIEBITE_HYDRATED__/);
});
