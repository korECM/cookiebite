import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('renderReport returns markup and Report props', async () => {
  const result = await renderReport(fixture('ok.tsx'));
  assert.equal(result.title, '결제 성공률 리포트');
  assert.equal(result.lang, 'ko');
  assert.equal(result.theme.seed.accent, '#FA4D02');
  assert.match(result.markup, /^<main>/);
  assert.match(result.markup, /<h1>결제 성공률 99\.2%로 회복<\/h1>/);
  assert.match(result.markup, /<section aria-labelledby="[^"]+"><h2 id="[^"]+">원인<\/h2>/);
});

test('renderReport rejects a non-Report default export', async () => {
  await assert.rejects(() => renderReport(fixture('not-report.tsx')), /<Report>/);
});
