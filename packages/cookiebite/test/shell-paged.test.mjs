import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';
import { resolveInitialPageId } from '../src/shell/resolve-page-id.mjs';
import { runCli } from './helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.resolve(root, 'test/fixtures', name);

test('paged SSR: all pages stacked with data-page, no hidden', async () => {
  const { markup } = await renderReport(fixture('shell-paged.tsx'));

  assert.match(markup, /data-page/);
  assert.match(markup, /id="overview"/);
  assert.match(markup, /id="evidence"/);
  assert.match(markup, /id="next"/);
  assert.match(markup, /overview-body/);
  assert.match(markup, /evidence-body/);
  assert.match(markup, /next-body/);

  // 비활성 숨김은 하이드레이션 후 — SSR에는 hidden 없음
  const pageSections = markup.match(/<section[^>]*data-page[^>]*>/g) ?? [];
  assert.equal(pageSections.length, 3);
  for (const tag of pageSections) {
    assert.doesNotMatch(tag, /\bhidden\b/);
    assert.doesNotMatch(tag, /display:\s*none/);
  }
});

test('paged SSR: nav has one item per Page with matching #hrefs', async () => {
  const { markup } = await renderReport(fixture('shell-paged.tsx'));

  assert.match(markup, /aria-label="Pages"/);
  assert.match(markup, /href="#overview"/);
  assert.match(markup, /href="#evidence"/);
  assert.match(markup, /href="#next"/);

  // 모바일+데스크톱 각 1세트 → href는 페이지당 2회
  assert.equal((markup.match(/href="#overview"/g) ?? []).length, 2);
  assert.equal((markup.match(/href="#evidence"/g) ?? []).length, 2);
  assert.equal((markup.match(/href="#next"/g) ?? []).length, 2);
});

test('article layout: Page under article renders as section (tolerant)', async () => {
  const { markup } = await renderReport(
    fixture('shell-paged-under-article.tsx'),
  );

  assert.match(markup, /id="sec"/);
  assert.match(markup, /section-body/);
  assert.match(markup, /id="orphan-page"/);
  assert.match(markup, /orphan-page-body/);
  assert.match(markup, /data-page/);
  assert.doesNotMatch(markup, /aria-label="Pages"/);
});

test('resolveInitialPageId: empty/unknown → first, known → that page', () => {
  const ids = ['overview', 'evidence', 'next'];
  assert.equal(resolveInitialPageId('', ids), 'overview');
  assert.equal(resolveInitialPageId('#', ids), 'overview');
  assert.equal(resolveInitialPageId('#nope', ids), 'overview');
  assert.equal(resolveInitialPageId('evidence', ids), 'evidence');
  assert.equal(resolveInitialPageId('#next', ids), 'next');
  assert.equal(resolveInitialPageId('#overview', []), '');
});

test('e2e: paged fixture builds with all pages + nav', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-paged-')), 'out.html');
  const result = runCli(['build', fixture('shell-paged.tsx'), '-o', out]);
  assert.equal(result.code, 0, result.stderr);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /id="overview"/);
  assert.match(html, /id="evidence"/);
  assert.match(html, /id="next"/);
  assert.match(html, /overview-body/);
  assert.match(html, /evidence-body/);
  assert.match(html, /aria-label="Pages"/);
  assert.match(html, /href="#overview"/);
  assert.match(html, /data-page/);
  assert.match(html, /@media print/);
});
