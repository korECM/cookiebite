import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { CookiebiteTheme } = require('../assets/theme-compiler.js');
const { createCore, MANIFEST } = require('../assets/core/cookiebite-core.js');

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const document = {
  schemaVersion: 1,
  seed: {
    font: 'Pretendard, sans-serif',
    background: '#FAFAF9', text: '#1A1A1A', accent: '#E8503A',
    spaceUnit: 4, measure: '68ch', radius: 12, surface: 'border',
  },
  dark: { background: '#171717', text: '#F6F6F4' },
  locale: { number: 'ko-KR', currency: 'KRW' },
};

function core(opts = {}) {
  const compiled = CookiebiteTheme.compile(document);
  return createCore({ theme: compiled, locale: document.locale, included: opts.included || [] });
}

test('the built-in manifest matches assets/capabilities/manifest.json exactly', () => {
  const onDisk = JSON.parse(readFileSync(path.join(root, 'assets/capabilities/manifest.json'), 'utf8'));
  assert.deepEqual(MANIFEST, onDisk);
  assert.deepEqual(
    Object.fromEntries(Object.entries(MANIFEST.capabilities).map(([k, v]) => [k, v.call])),
    { chart: 'chart', table: 'sortable', glossary: 'glossary', motion: 'motion', export: 'export' },
  );
});

test('exposes theme state and locale formatting without owning layout', () => {
  const cb = core();
  assert.equal(cb.theme.current().tokens['--cb-accent'], '#E8503A');
  assert.equal(cb.theme.mode(), 'light');
  assert.match(cb.format.number(1234.5), /1,234\.5/);
  assert.match(cb.format.currency(1000), /₩|1,000/);
});

test('theme.set switches only when dark is declared and notifies subscribers', () => {
  const cb = core();
  let seen = null;
  const off = cb.theme.onChange((mode) => { seen = mode; });
  cb.theme.set('dark');
  assert.equal(cb.theme.mode(), 'dark');
  assert.equal(seen, 'dark');
  assert.equal(cb.theme.current().tokens['--cb-background'], '#171717');
  off();

  const compiledNoDark = CookiebiteTheme.compile({ ...document, dark: undefined });
  const lightOnly = createCore({ theme: compiledNoDark, locale: document.locale, included: [] });
  assert.throws(() => lightOnly.theme.set('dark'), /dark/i);
});

test('an omitted capability fails fast and names the marker fix', () => {
  const cb = core({ included: [] });
  assert.throws(() => cb.chart(), /COOKIEBITE:USE/);
  assert.throws(() => cb.sortable(), /COOKIEBITE:USE.*table|table.*COOKIEBITE:USE/i);
});

test('a registered capability runs and every call is recorded for verification', () => {
  const cb = core({ included: ['table'] });
  let got = null;
  cb.register('table', (table, opts, ctx) => {
    got = { table, opts, hasTheme: typeof ctx.theme.current === 'function' };
    ctx.recordAction('table', 'sort');
    return { dispose() {} };
  });
  const handle = cb.sortable('T', { numericColumns: [1] });
  assert.equal(got.table, 'T');
  assert.deepEqual(got.opts, { numericColumns: [1] });
  assert.ok(got.hasTheme);
  assert.ok(typeof handle.dispose === 'function');
  assert.ok(cb.calls.some((c) => c.capability === 'table' && c.type === 'call'));
  assert.ok(cb.calls.some((c) => c.capability === 'table' && c.action === 'sort'));
});

test('an included but unloaded capability reports the missing module, not a marker fix', () => {
  const cb = core({ included: ['chart'] });
  assert.throws(() => cb.chart(), /module|not loaded/i);
});
