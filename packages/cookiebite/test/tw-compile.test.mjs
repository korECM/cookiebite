import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_CSS, compileTwSources } from '../lib/tw-compile.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('compileTwSources: data-[state=active]:bg-background from source scan', async () => {
  const css = await compileTwSources({
    tsxPath: path.join(fixtures, 'tw-state-bg.tsx'),
  });
  assert.match(css, /data-\\\[state\\=active\\\]\\:bg-background/);
  assert.match(css, /\[data-state="active"\]/);
  assert.match(css, /var\(--background\)|var\(--color-background\)/);
});

test('compileTwSources: bg-red-500 produces no red utility CSS', async () => {
  const css = await compileTwSources({
    tsxPath: path.join(fixtures, 'tw-wiped-palette.tsx'),
  });
  assert.doesNotMatch(css, /\.bg-red-500/);
  assert.doesNotMatch(css, /\.text-blue-600/);
  assert.doesNotMatch(css, /#ef4444|#f00\b/i);
});

test('compileTwSources: bg-card resolves to var(--card)', async () => {
  const css = await compileTwSources({
    tsxPath: path.join(fixtures, 'tw-bg-card.tsx'),
  });
  assert.match(css, /\.bg-card/);
  assert.match(css, /background-color:\s*var\(--card\)/);
});

test('compileTwSources: no utilities returns empty string', async () => {
  // 패키지 src/ui가 스캔 세트에 있으면 항상 유틸이 나오므로,
  // 빈 packageRoot(소스 없음) + plain TSX로 '' 분기를 검증한다.
  const emptyPkg = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-tw-empty-'));
  fs.mkdirSync(path.join(emptyPkg, 'src/ui'), { recursive: true });
  fs.mkdirSync(path.join(emptyPkg, 'src/lib'), { recursive: true });
  const css = await compileTwSources({
    tsxPath: path.join(fixtures, 'tw-plain.tsx'),
    packageRoot: emptyPkg,
  });
  assert.equal(css, '');
});

test('BASE_CSS exposes shadcn border/body expectations without duplicating core reset', () => {
  assert.match(BASE_CSS, /border-color:\s*var\(--border\)/);
  assert.match(BASE_CSS, /background-color:\s*var\(--background\)/);
  assert.match(BASE_CSS, /color:\s*var\(--foreground\)/);
  assert.doesNotMatch(BASE_CSS, /box-sizing/);
});
