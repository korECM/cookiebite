// verify-e2e.test.mjs — end-to-end smoke that drives the real self-verifier
// (agent-browser + runner + classify) over built reports. Slow (a browser boots
// per run), so it runs with --runs 1 and skips entirely when agent-browser is
// absent — CI without a browser still stays green.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli } from './helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(here, 'fixtures', name);

function browserAvailable() {
  const probe = spawnSync('agent-browser', ['--version'], { encoding: 'utf8' });
  return probe.status === 0;
}

const FIVE_MIN = 5 * 60 * 1000;

test('kitchen-sink verifies clean end-to-end (exit 0, no hard findings)', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-'));
  const html = path.join(dir, 'kitchen-sink.html');
  const out = path.join(dir, 'verification.json');

  const built = runCli(['build', fixture('kitchen-sink.tsx'), '-o', html]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);

  const verified = runCli(['verify', html, '--runs', '1', '--manual-ok', '-o', out]);
  assert.equal(verified.code, 0, `expected clean verify, got exit ${verified.code}: ${verified.stderr}`);

  const result = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(result.passed, true);
  assert.equal(result.runs, 1);
  const hard = result.findings.filter((f) => f.severity === 'error');
  assert.deepEqual(hard, [], `unexpected hard findings: ${JSON.stringify(hard)}`);
  // The runner really resizes to each breakpoint, not 1280 three times.
  const widths = result.inventory.viewports.map((v) => v.width).sort((a, b) => a - b);
  assert.deepEqual(widths, [390, 768, 1280]);
});

test('a deliberate 200vw block is caught as a hard horizontal-overflow (exit 1)', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-'));
  const html = path.join(dir, 'overflow.html');
  const out = path.join(dir, 'verification.json');

  const built = runCli(['build', fixture('overflow-violation.tsx'), '-o', html]);
  assert.equal(built.code, 0, `build should pass token lint: ${built.stderr}`);

  const verified = runCli(['verify', html, '--manual-ok', '-o', out]);
  assert.equal(verified.code, 1, `expected exit 1 for overflow, got ${verified.code}: ${verified.stderr}`);

  const result = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(result.passed, false);
  const overflow = result.findings.find((f) => f.ruleId === 'horizontal-overflow' && f.severity === 'error');
  assert.ok(overflow, 'expected a hard horizontal-overflow finding');
});
