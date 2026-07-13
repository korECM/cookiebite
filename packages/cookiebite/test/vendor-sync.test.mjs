import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(pkgRoot, '../..');

const PAIRS = [
  ['assets/theme-compiler.js', 'vendor/theme-compiler.cjs'],
  ['assets/core/cookiebite-core.css', 'vendor/core/cookiebite-core.css'],
  ['assets/core/cookiebite-core.js', 'vendor/core/cookiebite-core.js'],
  ['assets/capabilities/manifest.json', 'vendor/capabilities/manifest.json'],
  ...['chart', 'table', 'glossary', 'motion', 'export'].map((c) => [
    `assets/capabilities/${c}.js`, `vendor/capabilities/${c}.js`,
  ]),
  ...['persimmon', 'neutral', 'stripe', 'vercel', 'linear', 'notion', 'supabase', 'sentry', 'resend', 'raycast'].map(
    (p) => [`assets/presets/${p}.json`, `vendor/presets/${p}.json`],
  ),
];

// 벤더 복사본이 원본과 갈라지면 이 테스트가 알린다. 원본이 없는 환경(패키지 단독
// 배포)에서는 검사할 대상이 없으므로 skip.
test('vendored assets match their originals byte for byte', (t) => {
  if (!existsSync(path.join(repoRoot, 'assets'))) return t.skip('originals not present');
  for (const [orig, vend] of PAIRS) {
    assert.equal(
      readFileSync(path.join(pkgRoot, vend), 'utf8'),
      readFileSync(path.join(repoRoot, orig), 'utf8'),
      `${vend} drifted from ${orig}`,
    );
  }
});
