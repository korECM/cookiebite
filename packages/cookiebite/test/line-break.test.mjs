import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findAwkwardLineBreaks,
  groupWordsByLine,
} from '../verifier/line-break.mjs';

test('groupWordsByLine groups by top within 2px tolerance', () => {
  const lines = groupWordsByLine([
    { word: '축소와', top: 100 },
    { word: '이탈을', top: 101 },
    { word: '상쇄해', top: 120 },
  ]);
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[0].map((w) => w.word), ['축소와', '이탈을']);
  assert.deepEqual(lines[1].map((w) => w.word), ['상쇄해']);
});

test('findAwkwardLineBreaks flags connective at end of non-final line', () => {
  const hits = findAwkwardLineBreaks([
    { word: '확장', top: 0 },
    { word: '축소와', top: 0 },
    { word: '이탈을', top: 20 },
    { word: '상쇄해', top: 20 },
  ]);
  assert.deepEqual(hits, [{ lineEndWord: '축소와', lineIndex: 0 }]);
});

test('findAwkwardLineBreaks ignores last line even if connective', () => {
  const hits = findAwkwardLineBreaks([
    { word: '설계', top: 0 },
    { word: '및', top: 20 },
  ]);
  assert.deepEqual(hits, []);
});

test('findAwkwardLineBreaks flags 및 / 또는 / 혹은', () => {
  assert.deepEqual(
    findAwkwardLineBreaks([
      { word: '설계', top: 0 },
      { word: '및', top: 0 },
      { word: '검토', top: 20 },
    ]),
    [{ lineEndWord: '및', lineIndex: 0 }],
  );
  assert.deepEqual(
    findAwkwardLineBreaks([
      { word: 'A', top: 0 },
      { word: '또는', top: 0 },
      { word: 'B', top: 20 },
    ]),
    [{ lineEndWord: '또는', lineIndex: 0 }],
  );
  assert.deepEqual(
    findAwkwardLineBreaks([
      { word: 'A', top: 0 },
      { word: '혹은', top: 0 },
      { word: 'B', top: 20 },
    ]),
    [{ lineEndWord: '혹은', lineIndex: 0 }],
  );
});
