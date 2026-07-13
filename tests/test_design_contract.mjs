import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);

function read(relativePath) {
  return readFileSync(new URL(relativePath, root), 'utf8');
}

test('DESIGN.md freezes the freeform theme, primitive, assembly, and verification contracts', () => {
  const design = read('DESIGN.md');

  for (const expected of [
    'schemaVersion: 1',
    '--cb-background',
    '--cb-on-accent',
    'CookiebiteTheme.validate',
    'CookiebiteTheme.compile',
    'CB.chart',
    'CB.sortable',
    'CB.glossary',
    'CB.motion',
    'CB.export',
    'COOKIEBITE:USE',
    'cookiebite-dependency-summary',
    'verification.json',
    'manual review',
  ]) {
    assert.match(design, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

test('primitive showcase is explicit core composition without framework chrome', () => {
  const showcase = read('docs/examples/freeform-primitives.html');

  assert.match(showcase, /<!--\s*COOKIEBITE:USE\s+chart table glossary motion export\s*-->/i);
  assert.match(showcase, /<main\b/i);
  assert.match(showcase, /<table\b/i);
  assert.match(showcase, /<dfn\b/i);
  assert.match(showcase, /data-cb-export-region/i);
  assert.doesNotMatch(showcase, /\b(?:kpi|stat-card|bento|sidebar|toc)\b/i);
});
