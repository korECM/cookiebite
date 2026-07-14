import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateRuns } from '../lib/verify.mjs';
import { runCli } from './helpers.mjs';

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
