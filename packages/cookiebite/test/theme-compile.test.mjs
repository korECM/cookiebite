import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileTheme } from '../lib/theme-compile.mjs';
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

function blockVars(css, selector) {
  const re = new RegExp(`${selector.replace('.', '\\.')}\\{([^}]+)\\}`);
  const m = css.match(re);
  assert.ok(m, `missing ${selector} block`);
  /** @type {Record<string, string>} */
  const vars = {};
  for (const part of m[1].split(';')) {
    if (!part) continue;
    const i = part.indexOf(':');
    if (i < 0) continue;
    vars[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return vars;
}

test('all 10 presets compile without throw and light differs from dark', () => {
  for (const [name, doc] of Object.entries(PRESETS)) {
    const { css, warnings } = compileTheme(doc);
    assert.equal(typeof css, 'string', `${name}: css string`);
    assert.ok(Array.isArray(warnings), `${name}: warnings array`);
    assert.match(css, /^:root\{/);
    assert.match(css, /\n\.dark\{/);

    const light = blockVars(css, ':root');
    const dark = blockVars(css, '.dark');
    assert.notEqual(light['--background'], dark['--background'], `${name}: bg differs`);
    assert.notEqual(light['--foreground'], dark['--foreground'], `${name}: fg differs`);
    assert.equal(light['--radius'], `${doc.seed.radius}px`);
    assert.equal(light['--primary'].toUpperCase(), doc.seed.accent.toUpperCase());
  }
});

test('overrides value appears in output css', () => {
  const custom = 'oklch(0.72 0.15 40)';
  const { css } = compileTheme({
    ...persimmon,
    overrides: {
      '--card': custom,
      '.dark': { '--card': '#1A1A20' },
    },
  });
  const light = blockVars(css, ':root');
  const dark = blockVars(css, '.dark');
  assert.equal(light['--card'], custom);
  assert.equal(dark['--card'], '#1A1A20');
});

test('low-contrast override throws with pair name', () => {
  assert.throws(
    () =>
      compileTheme({
        ...persimmon,
        overrides: {
          // background 근처로 foreground를 내려 대비 붕괴
          '--foreground': '#F5F5F5',
        },
      }),
    (err) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /--foreground\/--background/);
      assert.match(err.message, /contrast gate failed/);
      return true;
    },
  );
});

test('--chart-1 through --chart-5 present in both blocks and are 5 distinct values', () => {
  const { css } = compileTheme(persimmon);
  for (const selector of [':root', '.dark']) {
    const vars = blockVars(css, selector);
    const charts = [1, 2, 3, 4, 5].map((n) => vars[`--chart-${n}`]);
    for (const [i, value] of charts.entries()) {
      assert.ok(value, `${selector} --chart-${i + 1} present`);
    }
    assert.equal(new Set(charts).size, 5, `${selector}: 5 distinct chart colors`);
  }
});
