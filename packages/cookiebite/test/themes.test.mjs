import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromPreset, persimmon, neutral } from '../src/themes.ts';
import persimmonJson from '../vendor/presets/persimmon.json' with { type: 'json' };
import neutralJson from '../vendor/presets/neutral.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { CookiebiteTheme } = require(path.join(pkgRoot, 'vendor/theme-compiler.cjs'));

test('fromPreset produces a compilable ThemeDocument', () => {
  const doc = fromPreset(persimmonJson);
  assert.equal(doc.schemaVersion, 1);
  assert.equal(doc.seed.accent, '#FA4D02');
  assert.deepEqual(doc.resources.fontStylesheets, [persimmonJson.font.url]);
  const compiled = CookiebiteTheme.compile(doc);
  assert.match(compiled.css, /--cb-accent:/);
});

test('fromPreset carries the preset locale through', () => {
  const doc = fromPreset(neutralJson);
  assert.deepEqual(doc.locale, neutralJson.locale);
  assert.deepEqual(doc.resources.fontStylesheets, [neutralJson.font.url]);
  const compiled = CookiebiteTheme.compile(doc);
  assert.match(compiled.css, /--cb-accent:/);
});

test('exported preset constants are compilable ThemeDocuments', () => {
  for (const preset of [persimmon, neutral]) {
    assert.equal(preset.schemaVersion, 1);
    const compiled = CookiebiteTheme.compile(preset);
    assert.match(compiled.css, /--cb-accent:/);
  }
});
