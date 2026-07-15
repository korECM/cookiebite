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
  assert.equal(result.title, undefined);
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

test('v3 renderReport: unknown @/ alias rejects with supported prefixes', async () => {
  await assert.rejects(
    () => renderReport(fixture('unknown-alias.tsx')),
    /@\/components\/ui\/\*|@\/lib\/\*|Supported prefixes/i,
  );
});
