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
  // Report controls 기본 true → flags/css에 controls가 실림.
  assert.deepEqual(result.collected.flags, ['controls']);
  assert.match(result.collected.css, /\.cb-controls/);
});

test('a capability-free report still collects default controls', async () => {
  const result = await renderReport(fixture('ok.tsx'));
  assert.deepEqual(result.collected.calls, []);
  assert.deepEqual(result.collected.flags, ['controls']);
  assert.match(result.collected.css, /\.cb-controls/);
  assert.match(
    result.collected.css,
    /@media\s*\(\s*max-width:\s*640px\s*\)[^{]*\{[^}]*\.cb-controls\s*\{[^}]*position:\s*static/,
  );
  assert.match(result.markup, /data-cb-toggle="theme"/);
  assert.match(result.markup, /data-cb-toggle="density"/);
  assert.match(result.markup, /aria-pressed/);
});

test('controls={false} omits flag, css chunk, and toggle markup', async () => {
  const result = await renderReport(fixture('controls-off.tsx'));
  assert.deepEqual(result.collected.flags, []);
  assert.doesNotMatch(result.collected.css, /\.cb-controls/);
  assert.doesNotMatch(result.markup, /data-cb-toggle/);
  assert.doesNotMatch(result.markup, /cb-controls/);
});
