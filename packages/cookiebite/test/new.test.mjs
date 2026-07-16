// packages/cookiebite/test/new.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

test('new scaffolds components.json and tsconfig.json next to the report', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-new-scaffold-'));
  const report = path.join(dir, 'weekly.tsx');
  const created = runCli(['new', report]);
  assert.equal(created.code, 0, created.stderr);

  const componentsJson = path.join(dir, 'components.json');
  const tsconfigJson = path.join(dir, 'tsconfig.json');
  assert.ok(existsSync(componentsJson));
  assert.ok(existsSync(tsconfigJson));

  const cj = JSON.parse(readFileSync(componentsJson, 'utf8'));
  assert.equal(cj.style, 'new-york');
  assert.equal(cj.rsc, false);
  assert.equal(cj.aliases.ui, '@/components/ui');
  assert.equal(cj.aliases.utils, '@/lib/utils');

  const tc = JSON.parse(readFileSync(tsconfigJson, 'utf8'));
  assert.deepEqual(tc.compilerOptions.paths['@/*'], ['./*']);
});

test('new skips existing components.json', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-new-skip-'));
  const componentsJson = path.join(dir, 'components.json');
  writeFileSync(componentsJson, '{"kept":true}\n');
  const report = path.join(dir, 'weekly.tsx');
  const created = runCli(['new', report]);
  assert.equal(created.code, 0, created.stderr);
  assert.deepEqual(JSON.parse(readFileSync(componentsJson, 'utf8')), { kept: true });
});
