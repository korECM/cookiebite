import { test } from 'node:test';
import assert from 'node:assert/strict';
import { koGlue } from '../src/lib/ko-text.ts';

const WJ = '⁠';

test('koGlue: glues a particle after a closing paren', () => {
  const out = koGlue('분해(reception, devplay-admin-server)와 집계');
  assert.ok(out.includes(`)${WJ}와`), out);
});

test('koGlue: glues a particle after a Latin letter', () => {
  const out = koGlue('100ms를 넘지');
  assert.ok(out.includes(`s${WJ}를`), out);
});

test('koGlue: leaves a 3+ syllable Hangul run after Latin breakable', () => {
  const out = koGlue('server라이브러리');
  assert.doesNotMatch(out, /⁠/);
});

test('koGlue: non-string input returns unchanged', () => {
  assert.equal(koGlue(42), 42);
  assert.equal(koGlue(null), null);
  assert.equal(koGlue(undefined), undefined);
});
