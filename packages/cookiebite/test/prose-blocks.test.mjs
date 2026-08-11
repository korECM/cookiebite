import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.resolve(root, 'test/fixtures', name);

test('shell sources contain no hex color literals', () => {
  const dir = path.join(root, 'src/shell');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
    assert.doesNotMatch(
      readFileSync(path.join(dir, file), 'utf8'),
      /#[0-9a-fA-F]{3,8}\b/,
      `${file} must not contain hex colors`,
    );
  }
});

test('Verdict: accent rail by default, destructive rail on caution', async () => {
  const { markup } = await renderReport(fixture('prose-blocks.tsx'));
  assert.match(markup, /border-l-2[^"]*border-primary/);
  assert.match(markup, /border-l-2[^"]*border-destructive/);
  // 데이터 카드와 구분되는 표면 — Panel의 bg-card를 재사용하지 않는다
  assert.match(markup, /rounded-r-lg border-l-2 bg-muted/);
});

test('Verdict: a string child becomes a paragraph', async () => {
  const { markup } = await renderReport(fixture('prose-blocks.tsx'));
  assert.match(markup, /<p>문자열 자식은 문단으로 감싼다\.<\/p>/);
});

test('Aside: prose column and data column sit side by side from md', async () => {
  const { markup } = await renderReport(fixture('prose-blocks.tsx'));
  assert.match(markup, /md:grid-cols-\[minmax\(0,1fr\)_minmax\(0,1\.1fr\)\]/);
  // side="right"는 순서만 뒤집고 마크업 순서는 산문 우선 (모바일에서 산문이 먼저 쌓이도록)
  assert.match(markup, /md:order-2/);
  assert.match(markup, /md:order-1/);
});

test('Steps: key column is fixed-width and rows are divided', async () => {
  const { markup } = await renderReport(fixture('prose-blocks.tsx'));
  assert.match(markup, /divide-y divide-border/);
  assert.match(markup, /md:grid-cols-\[minmax\(0,200px\)_minmax\(0,1fr\)\]/);
  // kicker/summary도 koGlue를 탄다 — 숫자와 한글 사이에 워드 조이너(U+2060)가 들어간다
  assert.match(markup, /0⁠단계 · 선행/);
  assert.match(markup, /\+11\.1 cores/);
});

test('prose containers let authors write paragraphs, not captions', async () => {
  const { markup } = await renderReport(fixture('prose-blocks.tsx'));
  // 회귀 방지: 산문 자리가 한 줄 prop 슬롯뿐이면 저자가 캡션만 쓰게 된다.
  // 픽스처의 Prose/Verdict/Aside/Steps는 모두 문단을 두 개 이상 담을 수 있어야 한다.
  const paragraphs = markup.match(/<p[^>]*>/g) ?? [];
  assert.ok(paragraphs.length >= 10, `expected many paragraphs, got ${paragraphs.length}`);
});
