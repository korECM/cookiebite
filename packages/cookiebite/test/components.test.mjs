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

test('matrix ramps cells with a tokened accent overlay, ink stays --cb-text', async () => {
  const result = await renderReport(fixture('data-components.tsx'));
  // 강도는 accent 오버레이 불투명도로. td 자체 배경은 투명이라 대비 계측이 잉크 대 페이지 배경을 읽는다.
  assert.match(result.markup, /<span class="cb-heat" style="opacity:[0-9.]+" aria-hidden="true">/);
  assert.match(result.collected.css, /\.cb-heat \{[^}]*background: var\(--cb-accent\)/);
  assert.doesNotMatch(result.markup, /color-mix/);
  assert.doesNotMatch(result.markup, /--cb-on-accent/);
  assert.equal(lintTokens(result.markup).length, 0);
});

test('rangedot renders one svg with capsule, dot, and hidden data table', async () => {
  const result = await renderReport(fixture('data-components.tsx'));
  assert.match(result.markup, /<figure class="cb-rangedot" role="img"/);
  assert.match(result.markup, /stroke="var\(--cb-divider\)"/);
  assert.match(result.markup, /fill="var\(--cb-accent\)"/);
  assert.match(result.markup, /cb-visually-hidden/);
  // value label uses a thin space (U+2009) before the unit: "190 ms"
  assert.match(result.markup, /190\u2009ms/);
});

test('Section id pins section and h2 anchors for Claims evidence', async () => {
  const result = await renderReport(fixture('section-id.tsx'));
  assert.match(result.markup, /<section id="cause"/);
  assert.match(result.markup, /id="cause-title"/);
  assert.match(result.markup, /aria-labelledby="cause-title"/);
});
