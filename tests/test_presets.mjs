import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { CookiebiteTheme } = require('../assets/theme-compiler.js');

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const presetsDir = path.join(root, 'assets', 'presets');
const files = readdirSync(presetsDir).filter((name) => name.endsWith('.json')).sort();
const LEGACY_FIELDS = ['name', 'label', 'font', 'colors', 'locale'];

test('every preset carries a canonical seed that compiles to accessible tokens', () => {
  assert.ok(files.length >= 10, 'expected the shipped preset catalog');
  for (const file of files) {
    const preset = JSON.parse(readFileSync(path.join(presetsDir, file), 'utf8'));
    assert.ok(preset.seed, `${file} must declare a seed`);
    const compiled = CookiebiteTheme.compile({ schemaVersion: 1, seed: preset.seed });
    assert.ok(
      CookiebiteTheme.contrast(compiled.tokens['--cb-on-accent'], compiled.tokens['--cb-accent']) >= 4.5,
      `${file} on-accent must stay accessible`,
    );
  }
});

test('preset migration preserves the legacy fields apply-theme.py depends on', () => {
  for (const file of files) {
    const preset = JSON.parse(readFileSync(path.join(presetsDir, file), 'utf8'));
    for (const field of LEGACY_FIELDS) assert.ok(field in preset, `${file} must retain legacy '${field}'`);
    assert.ok(preset.colors.accent && preset.colors.bg, `${file} must keep its legacy color palette`);
  }
});

test('the generated preset bundle is checked in and up to date', () => {
  execFileSync('node', ['scripts/build-preset-bundle.mjs', '--check'], { cwd: root, encoding: 'utf8' });
  const catalog = require('../assets/presets.generated.js');
  assert.deepEqual(Object.keys(catalog).sort(), files.map((f) => f.replace(/\.json$/, '')).sort());
});
