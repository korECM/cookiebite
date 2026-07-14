import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateRuns } from '../lib/verify.mjs';
import { runCli } from './helpers.mjs';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));

test("package.json files includes 'verifier'", () => {
  assert.ok(pkg.files.includes('verifier'));
});

test('npm pack --dry-run includes verifier, vendor theme-compiler, and starter template', () => {
  const packed = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: pkgRoot,
    encoding: 'utf8',
  });
  assert.equal(packed.status, 0, `npm pack failed: ${packed.stderr}`);
  const payload = JSON.parse(packed.stdout);
  const files = (payload[0]?.files ?? []).map((f) => f.path);
  for (const required of [
    'verifier/dom.js',
    'verifier/runner.mjs',
    'verifier/classify.mjs',
    'vendor/theme-compiler.cjs',
    'templates/starter.tsx',
    'assets-tsx/controls.js',
  ]) {
    assert.ok(files.includes(required), `pack files missing ${required}`);
  }
});

test('aggregateRuns: warning in 1 of 3 runs is flaky', () => {
  const warning = {
    ruleId: 'long-document-no-nav',
    severity: 'warning',
    selector: null,
    viewport: 1280,
    theme: 'light',
  };
  const { findings, flaky } = aggregateRuns([[warning], [], []]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].occurrences, 1);
  assert.equal(findings[0].runs, 3);
  assert.equal(flaky.length, 1);
  assert.match(flaky[0], /^long-document-no-nav\|/);
});

test('aggregateRuns: hard present in all 3 runs is stable (not flaky)', () => {
  const hard = {
    ruleId: 'horizontal-overflow',
    severity: 'error',
    selector: null,
    viewport: 390,
    theme: 'light',
  };
  const { findings, flaky } = aggregateRuns([[hard], [hard], [hard]]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].occurrences, 3);
  assert.equal(findings[0].runs, 3);
  assert.deepEqual(flaky, []);
});

test('aggregateRuns: hard in 1 of 3 runs still appears in findings and is flaky', () => {
  const hard = {
    ruleId: 'chart-not-rendered',
    severity: 'error',
    selector: '#c',
    viewport: 1280,
    theme: 'light',
  };
  const { findings, flaky } = aggregateRuns([[], [hard], []]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'error');
  assert.equal(findings[0].occurrences, 1);
  assert.equal(findings[0].runs, 3);
  assert.equal(flaky.length, 1);
  assert.match(flaky[0], /^chart-not-rendered\|#c\|/);
});

test('--runs rejects 0, 11, and non-integer', () => {
  for (const bad of ['0', '11', 'x']) {
    const result = runCli(['verify', 'report.html', '--runs', bad]);
    assert.equal(result.code, 1, `--runs ${bad} should exit 1`);
    assert.match(result.stderr, /--runs|1\.\.10|정수/, `--runs ${bad} should mention runs range`);
  }
});

test('verify without html arg exits 1 with usage', () => {
  const result = runCli(['verify']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /사용법|verify/);
});

test('verify missing file exits 3 with 파일이 없습니다', () => {
  const result = runCli(['verify', path.join(pkgRoot, 'no-such-report.html')]);
  assert.equal(result.code, 3);
  assert.match(result.stderr, /파일이 없습니다/);
});
