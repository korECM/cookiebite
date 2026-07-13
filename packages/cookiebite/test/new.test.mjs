// packages/cookiebite/test/new.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runCli } from './helpers.mjs';

test('new then build succeeds end to end', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-new-'));
  const report = path.join(dir, 'weekly.tsx');
  const created = runCli(['new', report]);
  assert.equal(created.code, 0, created.stderr);
  assert.ok(existsSync(report));

  const built = runCli(['build', report]);
  assert.equal(built.code, 0, built.stderr);
  assert.ok(existsSync(path.join(dir, 'weekly.html')));
});

test('new refuses to overwrite an existing file', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-new-'));
  const report = path.join(dir, 'weekly.tsx');
  runCli(['new', report]);
  const second = runCli(['new', report]);
  assert.equal(second.code, 1);
  assert.match(second.stderr, /이미 있습니다/);
});
