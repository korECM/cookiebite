import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fromPreset,
  persimmon,
  neutral,
  stripe,
  vercel,
  linear,
  notion,
  supabase,
  sentry,
  resend,
  raycast,
} from '../src/themes.ts';
import persimmonJson from '../src/presets/persimmon.json' with { type: 'json' };
import neutralJson from '../src/presets/neutral.json' with { type: 'json' };
import { compileTheme } from '../lib/theme-compile.mjs';

test('fromPreset produces a ThemeDocument with seed and font resources', () => {
  const doc = fromPreset(persimmonJson);
  assert.equal(doc.schemaVersion, 1);
  assert.equal(doc.seed.accent, '#FA4D02');
  assert.deepEqual(doc.resources.fontStylesheets, [persimmonJson.font.url]);
  const { css } = compileTheme(doc);
  assert.match(css, /--background:/);
  assert.match(css, /--primary:/);
});

test('fromPreset carries the preset locale through', () => {
  const doc = fromPreset(neutralJson);
  assert.deepEqual(doc.locale, neutralJson.locale);
  assert.deepEqual(doc.resources.fontStylesheets, [neutralJson.font.url]);
  const { css } = compileTheme(doc);
  assert.match(css, /--background:/);
});

test('exported preset constants compile via compileTheme', () => {
  const presets = [
    persimmon,
    neutral,
    stripe,
    vercel,
    linear,
    notion,
    supabase,
    sentry,
    resend,
    raycast,
  ];
  assert.equal(presets.length, 10);
  for (const preset of presets) {
    assert.equal(preset.schemaVersion, 1);
    const { css } = compileTheme(preset);
    assert.match(css, /:root\{/);
    assert.match(css, /\.dark\{/);
  }
});

test('every built-in preset seed font leads with Pretendard Variable', () => {
  const presets = [
    persimmon,
    neutral,
    stripe,
    vercel,
    linear,
    notion,
    supabase,
    sentry,
    resend,
    raycast,
  ];
  for (const preset of presets) {
    assert.match(
      preset.seed.font,
      /^'Pretendard Variable',\s*Pretendard/,
      `${preset.seed.font} should lead with Pretendard Variable`,
    );
  }
});
