import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { CookiebiteTheme } = require('../assets/theme-compiler.js');

const persimmon = {
  schemaVersion: 1,
  seed: {
    font: 'Pretendard Variable, Pretendard, sans-serif',
    background: '#FAFAF9',
    text: '#1A1A1A',
    accent: '#E8503A',
    spaceUnit: 4,
    measure: '68ch',
    radius: 12,
    surface: 'border',
  },
  locale: { number: 'ko-KR', currency: 'KRW' },
};

test('compiles the canonical Persimmon seed to stable semantic tokens', () => {
  const compiled = CookiebiteTheme.compile(persimmon);

  assert.deepEqual(compiled.tokens, {
    '--cb-background': '#FAFAF9',
    '--cb-surface': '#FFFFFF',
    '--cb-surface-raised': '#FFFFFF',
    '--cb-text': '#1A1A1A',
    '--cb-text-muted': '#666666',
    '--cb-divider': '#D8D8D8',
    '--cb-accent': '#E8503A',
    '--cb-accent-strong': '#C14230',
    '--cb-on-accent': '#1A1A1A',
    '--cb-focus': '#993526',
    '--cb-space-unit': '4px',
    '--cb-measure': '68ch',
    '--cb-radius': '12px',
    '--cb-font': 'Pretendard Variable, Pretendard, sans-serif',
    '--cb-rhythm': '28px',
  });
  assert.match(compiled.css, /^:root \{/);
  assert.equal(compiled.metadata.schemaVersion, 1);
});

test('picks white or black on-accent so mid-tone and dark accents stay accessible', () => {
  for (const accent of ['#5E6AD2', '#533AFD', '#171717', '#3ECF8E', '#FA4D02']) {
    const compiled = CookiebiteTheme.compile({ ...persimmon, seed: { ...persimmon.seed, accent } });
    const onAccent = compiled.tokens['--cb-on-accent'];
    assert.ok(
      CookiebiteTheme.contrast(onAccent, compiled.tokens['--cb-accent']) >= 4.5,
      `on-accent ${onAccent} must reach 4.5:1 against accent ${accent}`,
    );
  }
});

test('rejects unsafe and inaccessible authored seed values without modifying them', () => {
  assert.throws(
    () => CookiebiteTheme.validate({ ...persimmon, seed: { ...persimmon.seed, text: '#777777' } }),
    /text.*4\.5:1/i,
  );
  assert.throws(
    () => CookiebiteTheme.validate({ ...persimmon, seed: { ...persimmon.seed, measure: '68px' } }),
    /measure/i,
  );
  assert.throws(
    () => CookiebiteTheme.validate({ ...persimmon, seed: { ...persimmon.seed, font: 'ui; color:red' } }),
    /font/i,
  );
});

test('accepts real font stylesheet URLs with query semicolons but rejects unsafe ones', () => {
  const googleFonts = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  const compiled = CookiebiteTheme.compile({ ...persimmon, resources: { fontStylesheets: [googleFonts] } });
  assert.deepEqual(compiled.resources.fontStylesheets, [googleFonts]);
  assert.throws(
    () => CookiebiteTheme.validate({ ...persimmon, resources: { fontStylesheets: ['https://evil.test/"><script>'] } }),
    /fontStylesheets/i,
  );
  assert.throws(
    () => CookiebiteTheme.validate({ ...persimmon, resources: { fontStylesheets: ['http://insecure.test/a.css'] } }),
    /fontStylesheets/i,
  );
});

test('inherits partial dark values and only permits semantic overrides', () => {
  const compiled = CookiebiteTheme.compile({
    ...persimmon,
    dark: { background: '#171717', text: '#F6F6F4' },
    overrides: { textMuted: '#CACAC4' },
  });

  assert.equal(compiled.dark.tokens['--cb-background'], '#171717');
  assert.equal(compiled.dark.tokens['--cb-accent'], '#E8503A');
  assert.equal(compiled.dark.tokens['--cb-text-muted'], '#CACAC4');
  assert.throws(
    () => CookiebiteTheme.validate({ ...persimmon, overrides: { cardPadding: '20px' } }),
    /override/i,
  );
});

test('escapes embedded JSON and exposes the same compiler through the CLI', () => {
  const escaped = CookiebiteTheme.escapeJsonForHtml({ value: '</script>\u2028\u2029' });
  assert.doesNotMatch(escaped, /<\/script>/i);
  assert.doesNotMatch(escaped, /\u2028|\u2029/);

  const output = execFileSync('node', ['scripts/compile-theme.mjs', '--stdin'], {
    cwd: new URL('..', import.meta.url),
    input: JSON.stringify(persimmon),
    encoding: 'utf8',
  });
  assert.match(output, /--cb-accent: #E8503A;/);
});
