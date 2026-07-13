import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../lib/render.mjs';
import { runCli } from './helpers.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('kitchen-sink build wires capabilities end to end', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-cap-')), 'sink.html');
  const result = runCli(['build', fixture('kitchen-sink.tsx'), '-o', out]);
  assert.equal(result.code, 0, result.stderr);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /<!-- COOKIEBITE:USE chart glossary table -->/);
  assert.match(html, /id="cookiebite-module-table"/);
  assert.match(html, /CB\.sortable\(document\.getElementById\(/);
  const summary = JSON.parse(html.match(/id="cookiebite-dependency-summary">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.deepEqual(summary.declared, ['chart', 'glossary', 'table']);
});

test('a non-sortable table registers no capability', async () => {
  const result = await renderReport(fixture('plain-table.tsx'));
  assert.deepEqual(result.collected.calls, []);
  assert.match(result.markup, /<table[^>]*class="cb-table"/);
});

test('empty Glossary definition fails the build naming definition', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-cap-')), 'empty.html');
  const result = runCli(['build', fixture('empty-glossary.tsx'), '-o', out]);
  assert.equal(result.code, 1, result.stderr);
  assert.match(result.stderr, /definition/);
});
