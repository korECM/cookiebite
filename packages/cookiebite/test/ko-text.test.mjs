import { test } from 'node:test';
import assert from 'node:assert/strict';
import { koGlue } from '../src/lib/ko-text.ts';

const WJ = '\u2060';
const NBSP = '\u00A0';

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
  assert.doesNotMatch(out, /\u2060/);
});

test('koGlue: non-string input returns unchanged', () => {
  assert.equal(koGlue(42), 42);
  assert.equal(koGlue(null), null);
  assert.equal(koGlue(undefined), undefined);
});

test('koGlue: glues 와/과 to the following Hangul word with NBSP', () => {
  const out = koGlue('축소와 이탈을 상쇄해');
  assert.ok(out.includes(`축소와${NBSP}이탈을`), out);
  assert.equal(out, `축소와${NBSP}이탈을 상쇄해`);
});

test('koGlue: glues 및 to the following Hangul word with NBSP', () => {
  const out = koGlue('설계 및 검토');
  assert.ok(out.includes(`및${NBSP}검토`), out);
});

test('koGlue: does not glue when the follower is 7+ syllables', () => {
  // 7음절 follower — 거대 unbreakable run 방지
  const long = '가나다라마바사'; // 7
  assert.equal(long.length, 7);
  const outWa = koGlue(`축소와 ${long}`);
  assert.equal(outWa, `축소와 ${long}`);
  assert.ok(!outWa.includes(NBSP), outWa);
  const outMic = koGlue(`및 ${long}`);
  assert.equal(outMic, `및 ${long}`);
  assert.ok(!outMic.includes(NBSP), outMic);
});

test('koGlue: still glues when follower is exactly 6 syllables', () => {
  const six = '가나다라마바'; // 6
  assert.equal(six.length, 6);
  const out = koGlue(`축소와 ${six}`);
  assert.equal(out, `축소와${NBSP}${six}`);
});
