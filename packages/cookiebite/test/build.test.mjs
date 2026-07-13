// packages/cookiebite/test/build.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli } from './helpers.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('build produces a self-contained html document', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-build-')), 'ok.html');
  const result = runCli(['build', fixture('ok.tsx'), '-o', out]);
  assert.equal(result.code, 0, result.stderr);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /id="cookiebite-core-js"/);
  assert.match(html, /<h1>결제 성공률 99\.2%로 회복<\/h1>/);
});

test('a prop type error fails the build naming the prop', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-build-')), 'bad.html');
  const result = runCli(['build', fixture('bad-type.tsx'), '-o', out]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /title/);
  assert.doesNotMatch(result.stderr, /\x1b\[/);
  assert.equal(existsSync(out), false);
});

test('a color literal fails the build naming the literal', () => {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'cb-build-')), 'bad.html');
  const result = runCli(['build', fixture('bad-color.tsx'), '-o', out]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /#FF0000/);
  assert.equal(existsSync(out), false);
});

test('-o without a value fails with usage', () => {
  const result = runCli(['build', 'x.tsx', '-o']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /사용법/);
});

test('a non-tsx input is refused to avoid overwriting a source', () => {
  const result = runCli(['build', 'report.ts']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /\.tsx/);
});
