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
    'id="cookiebite-core-js"',
    'id="cookiebite-dependency-summary"',
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

test('a dark seed emits a data-theme scoped block', () => {
  const theme = { ...persimmon, dark: { background: '#111111', text: '#EDEDED' } };
  const html = assembleDocument({ ...base, theme });
  assert.match(html, /:root\[data-theme="dark"\] \{/);
});
