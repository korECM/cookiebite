import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('v3 renderReport: Card markup has data-slot and text; theme null without __theme', async () => {
  const result = await renderReport(fixture('hydration-card.tsx'));
  assert.match(result.markup, /data-slot="card"/);
  assert.match(result.markup, /hydration-fixture-text/);
  assert.equal(result.theme, null);
});

test('v3 renderReport: returns __theme when exported', async () => {
  const result = await renderReport(fixture('hydration-card-theme.tsx'));
  assert.match(result.markup, /data-slot="card"/);
  assert.deepEqual(result.theme, { seed: { accent: '#112233' } });
});

test('v3 renderReport: local components/ui/card.tsx shadows package', async () => {
  const result = await renderReport(fixture('shadow-card/report.tsx'));
  assert.match(result.markup, /data-slot="shadowed-card"/);
  assert.doesNotMatch(result.markup, /data-slot="card"/);
});

test('v3 renderReport: general @/ resolves report-local blocks and data', async () => {
  const result = await renderReport(fixture('general-alias/report.tsx'));
  assert.match(result.markup, /data-slot="local-callout"/);
  assert.match(result.markup, /helper-ok/);
  assert.match(result.markup, /data-slot="card"/);
});

test('v3 renderReport: Radix Tabs SSR has data-slot and trigger text', async () => {
  const result = await renderReport(fixture('hydration-tabs.tsx'));
  assert.match(result.markup, /data-slot="tabs"/);
  assert.match(result.markup, /tab-one-label/);
  assert.equal(result.theme, null);
});

test('v3 renderReport: unknown @/ alias rejects with report-local-first rule', async () => {
  await assert.rejects(
    () => renderReport(fixture('unknown-alias.tsx')),
    /report-local first|built-in @\/components\/ui\/\*|@\/lib\/\*/i,
  );
});

test('v3 renderReport: non-component default export fails clearly', async () => {
  await assert.rejects(
    () => renderReport(fixture('not-report.tsx')),
    /default export must be a React component/,
  );
});
