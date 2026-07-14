import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveDarkSeed, resolveTheme } from '../lib/resolve-theme.mjs';
import { compileChartOptions } from '../lib/chart-compile.mjs';
import { assembleDocument } from '../lib/assemble.mjs';
import {
  persimmon,
  neutral,
  stripe,
  vercel,
  linear,
  notion,
  supabase,
  sentry,
  resend,
  raycast,
} from '../src/themes.ts';

const require = createRequire(import.meta.url);
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { CookiebiteTheme } = require(path.join(pkgRoot, 'vendor/theme-compiler.cjs'));

const PRESETS = {
  persimmon,
  neutral,
  stripe,
  vercel,
  linear,
  notion,
  supabase,
  sentry,
  resend,
  raycast,
};

const barSpec = {
  type: 'Bar Chart',
  data: [
    { rule: 'geo-block', count: 120 },
    { rule: 'rate-limit', count: 75 },
  ],
  semanticTypes: { rule: 'Category', count: 'Quantity' },
  encodings: { x: 'rule', y: 'count' },
};

test('resolveTheme derives dark for every preset and compile accepts it', () => {
  for (const [name, doc] of Object.entries(PRESETS)) {
    assert.equal(doc.dark, undefined, `${name} preset starts without dark`);
    const resolved = resolveTheme(doc);
    assert.ok(resolved.dark, `${name}: dark filled`);
    assert.notEqual(resolved.dark.background, doc.seed.background);
    assert.notEqual(resolved.dark.text, doc.seed.text);
    assert.equal(resolved.dark.surface, 'tonal', `${name}: dark uses tonal surface`);
    assert.ok(resolved.dark.accent, `${name}: dark accent present`);
    assert.doesNotThrow(() => CookiebiteTheme.compile(resolved), `${name} compile`);
    const compiled = CookiebiteTheme.compile(resolved);
    assert.ok(compiled.dark, `${name}: compiled.dark present`);
    assert.notEqual(
      compiled.dark.tokens['--cb-background'],
      compiled.tokens['--cb-background'],
      `${name}: dark background token differs`,
    );
    assert.notEqual(
      compiled.dark.tokens['--cb-text'],
      compiled.tokens['--cb-text'],
      `${name}: dark text token differs`,
    );
    // border/shadow면 #FFFFFF가 되면 안 된다 — tonal 혼합 surface.
    assert.notEqual(
      compiled.dark.tokens['--cb-surface'].toUpperCase(),
      '#FFFFFF',
      `${name}: dark surface must not be white`,
    );
    // accent-strong이 다크 bg에서 배지 텍스트로 쓰이므로 4.5:1을 넘겨야 한다.
    const strong = compiled.dark.tokens['--cb-accent-strong'];
    const bg = compiled.dark.tokens['--cb-background'];
    assert.ok(
      CookiebiteTheme.contrast(strong, bg) >= 4.5,
      `${name}: accent-strong ${strong} on ${bg} must be ≥4.5`,
    );
  }
});

test('explicit dark is preserved verbatim', () => {
  const declared = { background: '#0A0A0C', text: '#F5F5F7' };
  const doc = { ...persimmon, dark: declared };
  const resolved = resolveTheme(doc);
  assert.equal(resolved, doc);
  assert.deepEqual(resolved.dark, declared);
});

test('derived dark yields chart options distinct from light', () => {
  const { light, dark } = compileChartOptions(barSpec, resolveTheme(persimmon));
  assert.notDeepEqual(dark, light);
  assert.notDeepEqual(dark.textStyle, light.textStyle);
});

test('assemble always emits a dark-scoped CSS block after resolve', () => {
  // assemble이 resolveTheme을 경유하므로 프리셋(dark 미선언)도 블록이 생긴다.
  const html = assembleDocument({
    markup: '<main><h1>제목</h1></main>',
    theme: persimmon,
    title: '다크 파생',
    lang: 'ko',
    collected: { calls: [], css: '' },
  });
  assert.match(html, /:root\[data-theme="dark"\] \{/);
  const theme = JSON.parse(html.match(/id="cookiebite-theme">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.ok(theme.dark);
  assert.equal(theme.dark.background, deriveDarkSeed(persimmon.seed).background);
});
