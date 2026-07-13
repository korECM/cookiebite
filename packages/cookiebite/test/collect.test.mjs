import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('renderReport collects capability calls and deduped css', async () => {
  const result = await renderReport(fixture('with-capability.tsx'));
  assert.deepEqual(result.collected.calls, [
    { capability: 'table', hostId: 'probe-table', options: { numericColumns: [1] } },
  ]);
  assert.match(result.collected.css, /--cb-text-muted/);
  assert.doesNotMatch(result.collected.css, /SHOULD-BE-DEDUPED/);
});

test('a capability-free report collects nothing', async () => {
  const result = await renderReport(fixture('ok.tsx'));
  assert.deepEqual(result.collected, { calls: [], css: '' });
});
