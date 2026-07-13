import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleDocument } from '../lib/assemble.mjs';
import { persimmon } from '../src/themes.ts';

const base = { markup: '<main><h1>제목</h1></main>', theme: persimmon, title: '테스트 <리포트>', lang: 'ko' };

test('assembled document carries the canonical block ids in order', () => {
  const html = assembleDocument(base);
  const order = [
    'id="cookiebite-theme"',
    'id="cookiebite-theme-css"',
    'id="cookiebite-core-css"',
    '<main><h1>제목</h1></main>',
    'id="cookiebite-dependency-summary"',
    'id="cookiebite-core-js"',
  ];
  let cursor = -1;
  for (const marker of order) {
    const index = html.indexOf(marker);
    assert.ok(index > cursor, `${marker} appears in order`);
    cursor = index;
  }
  assert.match(html, /^<!doctype html>\n<html lang="ko">/);
  assert.match(html, /<title>테스트 &lt;리포트&gt;<\/title>/);
  assert.match(html, /--cb-accent:/);
  assert.match(html, /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr[^"]*pretendard[^"]*">/);
});

test('theme block round-trips as a JSON object', () => {
  const html = assembleDocument(base);
  const theme = JSON.parse(html.match(/id="cookiebite-theme">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.equal(typeof theme, 'object');
  assert.equal(theme.schemaVersion, 1);
  assert.equal(theme.seed.accent, persimmon.seed.accent);
});

test('dependency summary is core mode with no modules', () => {
  const html = assembleDocument(base);
  const summary = JSON.parse(html.match(/id="cookiebite-dependency-summary">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.deepEqual(
    { schemaVersion: summary.schemaVersion, mode: summary.mode, declared: summary.declared, includedModules: summary.includedModules },
    { schemaVersion: 1, mode: 'core', declared: [], includedModules: [] },
  );
});

test('lang is attribute-escaped so it cannot inject markup', () => {
  const html = assembleDocument({ ...base, lang: 'ko" onload="x' });
  assert.doesNotMatch(html, /<html lang="ko" onload="x">/);
  assert.match(html, /<html lang="ko&quot; onload=&quot;x">/);
});

test('a dark seed emits a data-theme scoped block', () => {
  const theme = { ...persimmon, dark: { background: '#111111', text: '#EDEDED' } };
  const html = assembleDocument({ ...base, theme });
  assert.match(html, /:root\[data-theme="dark"\] \{/);
});

test('collected capabilities emit marker, module, script, and summary', () => {
  const collected = {
    calls: [
      { capability: 'table', hostId: 't1', options: { numericColumns: [1] } },
      { capability: 'glossary', hostId: 'g1', options: { definition: '용어 </script> 정의' } },
    ],
    css: '.cb-kpis { border-color: var(--cb-divider); }',
  };
  const html = assembleDocument({ ...base, collected });
  assert.match(html, /<!-- COOKIEBITE:USE glossary table -->/);
  assert.match(html, /id="cookiebite-components-css">[\s\S]*--cb-divider/);
  assert.match(html, /id="cookiebite-module-table"/);
  assert.match(html, /id="cookiebite-module-glossary"/);
  const script = html.match(/id="cookiebite-report-script">([\s\S]*?)<\/script>/)[1];
  assert.match(script, /CB\.sortable\(document\.getElementById\("t1"\), \{"numericColumns":\[1\]\}\)/);
  assert.match(script, /CB\.glossary\(/);
  assert.doesNotMatch(script, /<\/script>/i);
  const summary = JSON.parse(html.match(/id="cookiebite-dependency-summary">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.deepEqual(summary.declared, ['glossary', 'table']);
  assert.deepEqual(summary.includedModules, ['glossary', 'table']);
  // 순서: summary → core-js → module → report-script.
  // 요약 JSON은 core boot이 includedModules를 읽어야 하므로 core-js보다 앞서야 한다.
  const order = ['id="cookiebite-dependency-summary"', 'id="cookiebite-core-js"', 'id="cookiebite-module-glossary"', 'id="cookiebite-module-table"', 'id="cookiebite-report-script"'];
  let cursor = -1;
  for (const marker of order) {
    const index = html.indexOf(marker);
    assert.ok(index > cursor, `${marker} in order`);
    cursor = index;
  }
});

test('omitted collected keeps the phase 1 document shape', () => {
  const html = assembleDocument(base);
  assert.match(html, /<!-- COOKIEBITE:USE -->/);
  assert.doesNotMatch(html, /cookiebite-components-css|cookiebite-module-|cookiebite-report-script/);
});
