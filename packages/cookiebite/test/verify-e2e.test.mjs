// verify-e2e.test.mjs — end-to-end smoke that drives the real self-verifier
// (agent-browser + runner + classify) over built reports. Slow (a browser boots
// per run), so it runs with --runs 1 and skips entirely when agent-browser is
// absent — CI without a browser still stays green.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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
  // light 390/768/1280 + 파생 dark 1280 — 모든 리포트가 dark를 가진다.
  const widths = result.inventory.viewports.map((v) => v.width).sort((a, b) => a - b);
  assert.deepEqual(widths, [390, 768, 1280, 1280]);
  const themes = result.inventory.viewports.map((v) => v.theme);
  assert.ok(themes.includes('dark'), `expected a dark viewport measurement, got themes=${JSON.stringify(themes)}`);
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

test('non-cookiebite HTML exits 3 (not a report)', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-'));
  const html = path.join(dir, 'not-a-report.html');
  writeFileSync(html, '<html><body>x</body></html>\n');

  const verified = runCli(['verify', html]);
  assert.equal(verified.code, 3, `expected exit 3, got ${verified.code}: ${verified.stderr}`);
  assert.match(verified.stderr, /cookiebite 리포트가 아닙니다/);
});

test('every report runs a dark viewport pass (exit 0)', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-dark-'));
  const html = path.join(dir, 'dark-report.html');
  const out = path.join(dir, 'verification.json');

  // 명시 dark 선언 픽스처 — 파생이 아니라 작성자 dark도 동일하게 다크 패스를 탄다.
  const built = runCli(['build', fixture('dark-report.tsx'), '-o', html]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);

  const verified = runCli(['verify', html, '--runs', '1', '--manual-ok', '-o', out]);
  assert.equal(verified.code, 0, `expected clean verify, got exit ${verified.code}: ${verified.stderr}`);

  const result = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(result.passed, true);
  // light 390/768/1280 + dark 1280 — inventory.viewports[].theme from CB.theme.mode().
  const themes = result.inventory.viewports.map((v) => v.theme);
  assert.ok(themes.includes('dark'), `expected a dark viewport measurement, got themes=${JSON.stringify(themes)}`);
});

test('controls theme toggle flips data-theme via CB.theme.set', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-ctrl-'));
  const html = path.join(dir, 'ok.html');
  const built = runCli(['build', fixture('ok.tsx'), '-o', html]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);

  const session = `cb-ctrl-${process.pid}`;
  const ab = (args) =>
    spawnSync('agent-browser', [...args, '--session', session], { encoding: 'utf8', timeout: 60_000 });

  try {
    const opened = ab(['open', `file://${html}`]);
    assert.equal(opened.status, 0, `open failed: ${opened.stderr}`);
    // core boot + controls script.
    ab(['wait', '500']);
    const before = ab([
      'eval',
      'document.documentElement.getAttribute("data-theme")',
    ]);
    assert.equal(before.status, 0, before.stderr);
    assert.match(before.stdout, /null|""|undefined/, `expected light (no attr), got ${before.stdout}`);

    const clicked = ab(['click', '[data-cb-toggle="theme"]']);
    assert.equal(clicked.status, 0, `click failed: ${clicked.stderr}`);
    ab(['wait', '200']);

    const after = ab(['eval', 'document.documentElement.getAttribute("data-theme")']);
    assert.equal(after.status, 0, after.stderr);
    assert.match(after.stdout, /dark/, `expected data-theme=dark after click, got ${after.stdout}`);

    const pressed = ab([
      'eval',
      'document.querySelector(\'[data-cb-toggle="theme"]\').getAttribute("aria-pressed")',
    ]);
    assert.match(pressed.stdout, /true/);
  } finally {
    ab(['close']);
  }
});

test('density compact shrinks table td padding via --spacing bridge', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-dens-'));
  const html = path.join(dir, 'kitchen-sink.html');
  const built = runCli(['build', fixture('kitchen-sink.tsx'), '-o', html]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);
  const css = readFileSync(html, 'utf8');
  assert.match(css, /--spacing:\s*calc\(0\.25rem\s*\*\s*var\(--density-scale\)\)/);

  const session = `cb-dens-${process.pid}`;
  const ab = (args) =>
    spawnSync('agent-browser', [...args, '--session', session], { encoding: 'utf8', timeout: 60_000 });

  try {
    const opened = ab(['open', `file://${html}`]);
    assert.equal(opened.status, 0, `open failed: ${opened.stderr}`);
    ab(['wait', '500']);

    const padPx = (stdout) => parseFloat(String(stdout).replace(/["'\s]/g, ''));

    const padBefore = ab([
      'eval',
      'getComputedStyle(document.querySelector("td")).paddingTop',
    ]);
    assert.equal(padBefore.status, 0, padBefore.stderr);
    const beforePx = padPx(padBefore.stdout);
    assert.ok(Number.isFinite(beforePx) && beforePx > 0, `expected td padding, got ${padBefore.stdout}`);

    const clicked = ab(['click', '[data-cb-toggle="density"]']);
    assert.equal(clicked.status, 0, `density click failed: ${clicked.stderr}`);
    ab(['wait', '200']);

    const dens = ab(['eval', 'document.documentElement.getAttribute("data-density")']);
    assert.match(dens.stdout, /compact/, `expected compact after first click, got ${dens.stdout}`);

    const padAfter = ab([
      'eval',
      'getComputedStyle(document.querySelector("td")).paddingTop',
    ]);
    assert.equal(padAfter.status, 0, padAfter.stderr);
    const afterPx = padPx(padAfter.stdout);
    assert.ok(afterPx < beforePx, `compact td padding should shrink (${beforePx} → ${afterPx})`);
  } finally {
    ab(['close']);
  }
});
