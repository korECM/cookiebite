import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';
import { lintTokens } from '../lib/lint.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('data components render semantic markup with token-only styling', async () => {
  const result = await renderReport(fixture('data-components.tsx'));
  assert.match(result.markup, /<dl class="cb-kpis">/);
  assert.match(result.markup, /cb-delta cb-tone-success/);
  assert.match(result.markup, /<ol[^>]*>[\s\S]*cb-claim/);
  assert.match(result.markup, /cb-badge">Critical</);
  assert.equal(lintTokens(result.markup).length, 0); // 마크업 토큰 안전
  assert.equal(lintTokens(`<style>${result.collected.css}</style>`).length, 0); // CSS 청크 토큰 안전
  assert.match(result.collected.css, /\.cb-kpis/);
});

test('matrix ramps cells with token color-mix and flips ink past 55%', async () => {
  const result = await renderReport(fixture('data-components.tsx'));
  assert.match(result.markup, /color-mix\(in srgb, var\(--cb-accent\) \d+%, transparent\)/);
  assert.match(result.markup, /color:var\(--cb-on-accent\)|color: var\(--cb-on-accent\)/);
  assert.equal(lintTokens(result.markup).length, 0);
});

test('rangedot renders one svg with capsule, dot, and hidden data table', async () => {
  const result = await renderReport(fixture('data-components.tsx'));
  assert.match(result.markup, /<figure class="cb-rangedot" role="img"/);
  assert.match(result.markup, /stroke="var\(--cb-divider\)"/);
  assert.match(result.markup, /fill="var\(--cb-accent\)"/);
  assert.match(result.markup, /cb-visually-hidden/);
});
