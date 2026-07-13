import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';
import { lintTokens } from '../lib/lint.mjs';
import { runCli } from './helpers.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('Chart renders figure host and registers compiled chart call', async () => {
  const result = await renderReport(fixture('chart-report.tsx'));
  assert.match(result.markup, /<figure class="cb-chart">/);
  assert.match(result.markup, /<div id="[^"]+" style="height:320px"/);
  assert.equal(lintTokens(result.markup).length, 0);

  const call = result.collected.calls[0];
  assert.equal(call.capability, 'chart');
  assert.equal(call.options.light.series[0].type, 'bar');
  assert.equal(call.options.light.color[0].toUpperCase(), '#FA4D02');
  assert.deepEqual(call.options.data.columns, ['rule', 'count']);
  assert.deepEqual(call.options.data.rows, [
    ['geo-block', 120],
    ['rate-limit', 75],
    ['ja4-block', 30],
  ]);
  assert.equal(call.options.ariaLabel, '차단 규칙별 건수 막대 차트');

  const hostMatch = result.markup.match(/<div id="([^"]+)" style="height:320px"/);
  assert.ok(hostMatch);
  assert.equal(call.hostId, hostMatch[1]);
  assert.match(result.collected.css, /\.cb-chart/);
});

test('empty Chart ariaLabel fails the build naming ariaLabel', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-chart-')), 'empty-aria.html');
  const result = runCli(['build', fixture('chart-report-empty-aria.tsx'), '-o', out]);
  assert.equal(result.code, 1, result.stderr);
  assert.match(result.stderr, /ariaLabel/);
});

test('build chart-report emits chart module and echarts CDN', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-chart-e2e-')), 'chart.html');
  const result = runCli(['build', fixture('chart-report.tsx'), '-o', out]);
  assert.equal(result.code, 0, result.stderr);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /id="cookiebite-module-chart"/);
  assert.match(html, /cdn\.jsdelivr\.net\/npm\/echarts@5\.5\.1\/dist\/echarts\.min\.js/);
});

// Provider-null 가드(Report 밖 Chart)는 renderReport가 displayName 가드에 먼저
// 걸리므로 단위 테스트로 커버하지 않는다. 코드에는 throw를 유지한다.
