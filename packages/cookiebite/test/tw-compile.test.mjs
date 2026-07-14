import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileTw } from '../lib/tw-compile.mjs';

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
