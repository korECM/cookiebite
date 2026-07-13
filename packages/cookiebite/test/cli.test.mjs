// packages/cookiebite/test/cli.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from './helpers.mjs';

test('--version prints the package version', () => {
  const result = runCli(['--version']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /^\d+\.\d+\.\d+\n$/);
});

test('unknown command exits 1 with usage', () => {
  const result = runCli(['frobnicate']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /사용법/);
});
