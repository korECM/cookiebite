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
