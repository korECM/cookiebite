// packages/cookiebite/test/lint.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintTokens } from '../lib/lint.mjs';

test('flags hex in style attributes', () => {
  const violations = lintTokens('<div style="color: #666666">x</div>');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].literal, '#666666');
});

test('flags color literals in svg paint attributes and style blocks', () => {
  const svg = lintTokens('<rect fill="#FF0000"></rect>');
  assert.equal(svg[0].literal, '#FF0000');
  assert.equal(lintTokens('<circle stroke="rgb(10, 20, 30)"></circle>').length, 1);
  assert.equal(lintTokens('<style>.x { background: hsl(20 80% 50%); }</style>').length, 1);
  assert.equal(lintTokens('<path fill="red"></path>').length, 1);
});

test('flags single-quoted and uppercase attributes', () => {
  const sq = lintTokens("<div style='color: #666666'>x</div>");
  assert.equal(sq.length, 1);
  assert.equal(sq[0].literal, '#666666');
  const upper = lintTokens('<rect FILL="#FF0000"></rect>');
  assert.equal(upper.length, 1);
  assert.equal(upper[0].source, 'fill');
});

test('allows tokens, keywords, and non-color hash usage', () => {
  assert.equal(lintTokens('<rect fill="var(--cb-accent)"></rect>').length, 0);
  assert.equal(lintTokens('<div style="gap: calc(var(--cb-space-unit) * 4)">x</div>').length, 0);
  assert.equal(lintTokens('<path fill="none" stroke="currentColor"></path>').length, 0);
  assert.equal(lintTokens('<a href="#section-1">이동</a>').length, 0);
});

test('flags uppercase named colors but ignores property-name contexts', () => {
  assert.equal(lintTokens('<path fill="WHITE"></path>').length, 1);
  assert.equal(lintTokens('<div style="white-space: nowrap">x</div>').length, 0);
});

test('flags length×length calc products, allows unitless multipliers', () => {
  assert.equal(lintTokens('<div style="gap: calc(var(--x) * 4px)">x</div>').length, 1);
  assert.equal(lintTokens('<div style="gap: calc(var(--cb-space-unit) * 4)">x</div>').length, 0);
});

test('flags color literals inside TW arbitrary-value class segments', () => {
  const hex = lintTokens('<div class="bg-[#ff0000]">x</div>');
  assert.equal(hex.length, 1);
  assert.equal(hex[0].source, 'class');
  assert.equal(hex[0].literal, '#ff0000');

  const named = lintTokens('<div class="text-[red]">x</div>');
  assert.equal(named.length, 1);
  assert.equal(named[0].source, 'class');
  assert.equal(named[0].literal, 'red');

  const border = lintTokens('<div class="border-[#00ff00]">x</div>');
  assert.equal(border.length, 1);
  assert.equal(border[0].literal, '#00ff00');

  const rgb = lintTokens('<div class="text-[rgb(1,2,3)]">x</div>');
  assert.equal(rgb.length, 1);
  assert.match(rgb[0].literal, /^rgb\(/i);

  const shadow = lintTokens('<div class="shadow-[0_0_0_1px_#123456]">x</div>');
  assert.equal(shadow.length, 1);
  assert.equal(shadow[0].literal, '#123456');
});

test('allows token class names and non-color arbitrary values', () => {
  assert.equal(lintTokens('<div class="bg-card">x</div>').length, 0);
  assert.equal(lintTokens('<div class="w-[15px]">x</div>').length, 0);
  assert.equal(lintTokens('<div class="grid-cols-[1fr_2fr]">x</div>').length, 0);
});
