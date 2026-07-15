// packages/cookiebite/test/lint.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { lintSources } from '../lib/lint.mjs';

function writeTemp(name, source) {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-lint-'));
  const file = path.join(dir, name);
  writeFileSync(file, source);
  return file;
}

test('lintSources flags tw-arbitrary-color with rule id and line', () => {
  const file = writeTemp(
    'tw.tsx',
    `export default function R() {\n  return <div className="bg-[#312e81]">x</div>;\n}\n`,
  );
  const { violations } = lintSources({ files: [file] });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'tw-arbitrary-color');
  assert.equal(violations[0].line, 2);
  assert.equal(violations[0].file, file);
  assert.match(violations[0].snippet, /bg-\[#312e81\]/);
});

test('lintSources flags inline-style-color with rule id and line', () => {
  const file = writeTemp(
    'style.tsx',
    `export default function R() {\n  return <div style={{ color: '#ff0000' }}>x</div>;\n}\n`,
  );
  const { violations } = lintSources({ files: [file] });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'inline-style-color');
  assert.equal(violations[0].line, 2);
});

test('lintSources flags svg-attr-color with rule id and line', () => {
  const file = writeTemp(
    'svg.tsx',
    `export default function R() {\n  return <rect fill="rgb(1, 2, 3)" />;\n}\n`,
  );
  const { violations } = lintSources({ files: [file] });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'svg-attr-color');
  assert.equal(violations[0].line, 2);
});

test('lintSources allows var(--chart-2) in TW arbitrary brackets', () => {
  const file = writeTemp(
    'var-tw.tsx',
    `export default function R() {\n  return <div className="bg-[var(--chart-2)] text-[var(--foreground)]">x</div>;\n}\n`,
  );
  assert.equal(lintSources({ files: [file] }).violations.length, 0);
});

test('lintSources allows hex inside __theme export', () => {
  const file = writeTemp(
    'theme-export.tsx',
    `export const __theme = {\n  seed: { background: '#ffffff', text: '#111111', accent: '#e11d48' },\n};\nexport default <div className="bg-card">ok</div>;\n`,
  );
  assert.equal(lintSources({ files: [file] }).violations.length, 0);
});

test('lintSources allows hex inside __theme object literal', () => {
  const file = writeTemp(
    'theme-export-prop.tsx',
    `export const __theme = { seed: { background: '#0a0a0a', text: '#fafafa', accent: '#22c55e' } };\nexport default function App() {\n  return (\n  <Report title="t">\n    <div className="bg-background">ok</div>\n  </Report>\n  );\n}\n`,
  );
  assert.equal(lintSources({ files: [file] }).violations.length, 0);
});

test('lintSources allows currentColor, transparent, none everywhere', () => {
  const file = writeTemp(
    'safe.tsx',
    `export default function R() {\n  return (\n    <svg>\n      <path fill="none" stroke="currentColor" />\n      <rect fill="transparent" style={{ color: 'currentColor', background: 'transparent' }} />\n      <div className="bg-[transparent] text-[currentColor] border-[none]" />\n    </svg>\n  );\n}\n`,
  );
  assert.equal(lintSources({ files: [file] }).violations.length, 0);
});

test('lintSources allows content arbitrary values with color-like text', () => {
  const file = writeTemp(
    'content-tw.tsx',
    `export default function R() {\n  return (\n    <>\n      <div className="content-['red']" />\n      <div className="after:content-['green']" />\n    </>\n  );\n}\n`,
  );
  assert.equal(lintSources({ files: [file] }).violations.length, 0);
});

test('lintSources ignores data-fill and data-stroke but flags real svg paint attrs', () => {
  const clean = writeTemp(
    'data-attrs.tsx',
    `export default function R() {\n  return (\n    <>\n      <div data-fill='red' />\n      <div data-stroke='blue' />\n    </>\n  );\n}\n`,
  );
  assert.equal(lintSources({ files: [clean] }).violations.length, 0);

  const file = writeTemp(
    'path-fill.tsx',
    `export default function R() {\n  return <path fill='#fff' />;\n}\n`,
  );
  const { violations } = lintSources({ files: [file] });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'svg-attr-color');
});
