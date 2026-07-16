import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.resolve(root, 'test/fixtures', name);

test('shell Report SSR: title, kicker, toc anchors, controls aria', async () => {
  const { markup } = await renderReport(fixture('shell-report.tsx'));

  assert.match(markup, /결제 성공률 회복/);
  assert.match(markup, /주간 리포트/);
  assert.match(markup, /배포 롤백 이후/);

  // Stripe editorial: accent-tick kicker + title leading
  assert.match(markup, /rounded-full bg-primary/);
  assert.match(markup, /tracking-\[0\.08em\]/);
  assert.match(markup, /leading-\[1\.15\]/);

  // Section: tick + text-xl, no border-b underline
  assert.match(markup, /text-xl font-semibold tracking-tight/);
  assert.doesNotMatch(markup, /border-b border-border/);

  // Fluid width + right-rail TOC (On this page)
  assert.match(markup, /max-w-\[1800px\]/);
  assert.doesNotMatch(markup, /max-w-\[1080px\]/);
  assert.match(markup, /hidden min-\[1400px\]:block w-52 shrink-0/);
  assert.match(markup, />목차</);
  assert.match(markup, /border-l-2 border-transparent/);
  assert.match(markup, /aria-label="Table of contents"/);
  assert.match(markup, /href="#cause"/);
  assert.match(markup, /href="#next-steps"/);
  assert.match(markup, /id="cause"/);
  assert.match(markup, /id="next-steps"/);

  // Controls cluster chrome
  assert.match(markup, /rounded-lg border bg-card p-0\.5 shadow-xs/);
  assert.match(markup, /aria-label="Toggle dark mode"/);
  assert.match(markup, /aria-label="Cycle density"/);
  assert.match(markup, /aria-label="Report controls"/);

  // Korean word-break: keep-all on Report root (inherits to whole document)
  assert.match(markup, /class="[^"]*\bbreak-keep\b/);

  assert.match(markup, /<ol[\s\S]*pay-gateway logs/);
  assert.match(markup, /<dl[\s\S]*success_rate/);
  assert.match(markup, /retry_cap/);
});

test('shell Sources: koGlue inserts a word joiner before a particle in SSR', async () => {
  const { markup } = await renderReport(fixture('ko-glue.tsx'));

  assert.ok(markup.includes('⁠'), 'SSR markup must carry a word joiner');
  // particle 와 glued to the preceding ')' rather than orphaned at line start
  assert.ok(
    markup.includes(')⁠와'),
    'Sources item label must glue 와 to the closing paren',
  );
});

test('shell Report width="full" drops shell max-width cap', async () => {
  const { markup } = await renderReport(fixture('shell-full-width.tsx'));

  assert.doesNotMatch(markup, /max-w-\[1800px\]/);
  assert.doesNotMatch(markup, /max-w-\[1400px\]/);
  assert.match(markup, /w-full px-6 lg:px-10/);
});

test('shell Report controls={false} and toc={false} omit chrome', async () => {
  const { markup } = await renderReport(fixture('shell-controls-off.tsx'));

  assert.doesNotMatch(markup, /aria-label="Toggle dark mode"/);
  assert.doesNotMatch(markup, /aria-label="Cycle density"/);
  assert.doesNotMatch(markup, /aria-label="Report controls"/);
  assert.doesNotMatch(markup, /aria-label="Table of contents"/);
  assert.match(markup, /id="only"/);
  assert.match(markup, /Only Section/);
});

test('shell Report numbered: 01/02 in headings and TOC; default off unchanged', async () => {
  const numbered = await renderReport(fixture('shell-numbered.tsx'));
  assert.match(
    numbered.markup,
    /text-primary tabular-nums text-sm font-semibold/,
  );
  assert.match(numbered.markup, />01</);
  assert.match(numbered.markup, />02</);
  assert.match(numbered.markup, /href="#alpha"[\s\S]*?>01 알파</);
  assert.match(numbered.markup, /href="#beta"[\s\S]*?>02 베타</);
  // number replaces the accent tick on numbered sections
  const headingBlocks =
    numbered.markup.match(
      /flex items-center gap-2\.5[\s\S]*?<\/h2>/g,
    ) ?? [];
  assert.equal(headingBlocks.length, 2);
  for (const block of headingBlocks) {
    assert.doesNotMatch(block, /h-4 w-1 rounded-full bg-primary/);
  }

  const plain = await renderReport(fixture('shell-report.tsx'));
  assert.match(plain.markup, /href="#cause"[\s\S]*?>원인</);
  assert.doesNotMatch(plain.markup, /href="#cause"[\s\S]*?>01 원인</);
  assert.match(plain.markup, /h-4 w-1 rounded-full bg-primary/);
  assert.doesNotMatch(
    plain.markup,
    /text-primary tabular-nums text-sm font-semibold[\s\S]*?>01</,
  );
});

test('shell exports THEME_STORAGE_KEY and SHELL_CSS', () => {
  const controlsSrc = readFileSync(
    path.join(root, 'src/shell/controls.tsx'),
    'utf8',
  );
  assert.match(controlsSrc, /THEME_STORAGE_KEY = 'cookiebite-theme'/);
  assert.match(controlsSrc, /DENSITY_STORAGE_KEY = 'cookiebite-density'/);
  assert.match(controlsSrc, /data-density="compact"/);
  assert.match(controlsSrc, /--spacing:0\.2rem/);
  assert.match(controlsSrc, /data-density="spacious"/);
  assert.match(controlsSrc, /--spacing:0\.3rem/);

  const indexSrc = readFileSync(path.join(root, 'src/index.ts'), 'utf8');
  assert.match(indexSrc, /THEME_STORAGE_KEY/);
  assert.match(indexSrc, /DENSITY_STORAGE_KEY/);
  assert.match(indexSrc, /SHELL_CSS/);

  const v3Src = readFileSync(path.join(root, 'src/v3.ts'), 'utf8');
  assert.match(v3Src, /export \* from ['"]\.\/index/);
});
