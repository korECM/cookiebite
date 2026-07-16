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
  assert.match(markup, /max-w-\[1400px\]/);
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

test('shell Report controls={false} and toc={false} omit chrome', async () => {
  const { markup } = await renderReport(fixture('shell-controls-off.tsx'));

  assert.doesNotMatch(markup, /aria-label="Toggle dark mode"/);
  assert.doesNotMatch(markup, /aria-label="Cycle density"/);
  assert.doesNotMatch(markup, /aria-label="Report controls"/);
  assert.doesNotMatch(markup, /aria-label="Table of contents"/);
  assert.match(markup, /id="only"/);
  assert.match(markup, /Only Section/);
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
