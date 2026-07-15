// packages/cookiebite/test/build.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli } from './helpers.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

const BLOCK_ORDER = [
  'id="cookiebite-boot"',
  'id="cookiebite-theme"',
  'id="cookiebite-fonts"',
  'id="cookiebite-base"',
  'id="cookiebite-tw"',
  'id="root"',
  'id="cookiebite-app"',
];

function assertBlockOrder(html) {
  let cursor = -1;
  for (const marker of BLOCK_ORDER) {
    const index = html.indexOf(marker);
    assert.ok(index > cursor, `${marker} appears in order`);
    cursor = index;
  }
}

/** src=/href= 속성의 외부 http(s) 참조 — data:·# 은 허용. */
function assertNoExternalRefs(html) {
  assert.doesNotMatch(html, /<link\s+rel=["']stylesheet["']/i);
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*(["'])([^"']*)\1/gi)) {
    const value = m[2];
    if (value.startsWith('data:') || value.startsWith('#')) continue;
    assert.doesNotMatch(value, /^https?:\/\//i, `external ref: ${value}`);
  }
}

test('e2e: Report + Card fixture builds with block order and no external urls', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-build-')), 'ok.html');
  const result = runCli(['build', fixture('v3-report-card.tsx'), '-o', out]);
  assert.equal(result.code, 0, result.stderr);
  const html = readFileSync(out, 'utf8');
  assertBlockOrder(html);
  assertNoExternalRefs(html);
  assert.match(html, /data-slot="card"/);
  assert.match(html, /리포트 제목|결제/);
  assert.match(html, /hydrateRoot|__COOKIEBITE_HYDRATED__/);
});

test('a prop type error fails the build naming the prop', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-build-')), 'bad.html');
  const result = runCli(['build', fixture('bad-type.tsx'), '-o', out]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /title/);
  assert.doesNotMatch(result.stderr, /\x1b\[/);
  assert.equal(existsSync(out), false);
});

test('raw color in TSX fails the build with a clear message', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-build-')), 'bad.html');
  const result = runCli(['build', fixture('bad-color.tsx'), '-o', out]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /색 리터럴|#FF0000|svg-attr-color|tw-arbitrary/);
  assert.equal(existsSync(out), false);
});

test('low-contrast theme override fails the build with contrast message', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-contrast-'));
  const report = path.join(dir, 'low-contrast.tsx');
  writeFileSync(
    report,
    `import { Report, Section } from 'cookiebite';
export const __theme = {
  seed: {
    font: 'system-ui, sans-serif',
    background: '#FFFFFF',
    text: '#111111',
    accent: '#4F46E5',
    spaceUnit: 4,
    measure: '68ch',
    radius: 8,
    surface: 'border',
  },
  overrides: { '--foreground': '#EEEEEE', '--background': '#FFFFFF' },
};
export default function App() {
  return (
    <Report title="대비 실패">
      <Section id="a" title="A"><p>본문</p></Section>
    </Report>
  );
}
`,
  );
  const out = path.join(dir, 'out.html');
  const result = runCli(['build', report, '-o', out]);
  assert.equal(result.code, 1, result.stderr);
  assert.match(result.stderr, /contrast/i);
  assert.equal(existsSync(out), false);
});

test('-o without a value fails with usage', () => {
  const result = runCli(['build', 'x.tsx', '-o']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /사용법/);
});

test('a non-tsx input is refused to avoid overwriting a source', () => {
  const result = runCli(['build', 'report.ts']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /\.tsx/);
});
