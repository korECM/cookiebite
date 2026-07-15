import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_CSS, compileTw, compileTwSources } from '../lib/tw-compile.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('bg-card emits CSS that references var(--cb-surface)', async () => {
  const css = await compileTw('<div class="bg-card">card</div>');
  assert.match(css, /var\(--cb-surface\)/);
  assert.match(css, /\.bg-card/);
});

test('bg-red-500 produces no utility CSS when the default palette is wiped', async () => {
  const css = await compileTw('<div class="bg-red-500 text-blue-600">nope</div>');
  assert.equal(css, '');
  assert.doesNotMatch(css, /red|blue|#ef4444|#f00/i);
});

test('markup with no Tailwind utilities returns an empty string', async () => {
  const css = await compileTw('<main><h1>plain</h1></main>');
  assert.equal(css, '');
});

test('rounded-xl maps to theme radius via --radius-xl', async () => {
  const css = await compileTw('<div class="rounded-xl">card</div>');
  assert.match(css, /--radius-xl:\s*var\(--radius\)/);
  assert.match(css, /--radius:\s*var\(--cb-radius\)/);
  assert.match(css, /\.rounded-xl\s*\{[^}]*border-radius:\s*var\(--radius-xl\)/);
});

test('hover:bg-muted/50 emits color-mix against the muted token', async () => {
  const css = await compileTw('<tr class="hover:bg-muted/50">row</tr>');
  assert.match(css, /hover\\:bg-muted\\\/50/);
  assert.match(css, /var\(--color-muted\)|var\(--cb-surface\)/);
  assert.match(css, /color-mix/);
});

// --- v3 compileTwSources ---

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
