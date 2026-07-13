// packages/cookiebite/test/cli.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/cookiebite.mjs');

export function runCli(args, options = {}) {
  try {
    const stdout = execFileSync(process.execPath, [bin, ...args], { encoding: 'utf8', ...options });
    return { code: 0, stdout, stderr: '' };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

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
