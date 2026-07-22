// verify-e2e.test.mjs — build smokes + full verify runner against v3 hydrated HTML.
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

const BLOCK_ORDER = [
  'id="cookiebite-boot"',
  'id="cookiebite-theme"',
  'id="cookiebite-fonts"',
  'id="cookiebite-base"',
  'id="root"',
  'id="cookiebite-app"',
];

function assertV3Document(html) {
  let cursor = -1;
  for (const marker of BLOCK_ORDER) {
    const index = html.indexOf(marker);
    assert.ok(index > cursor, `${marker} in order`);
    cursor = index;
  }
  assert.doesNotMatch(html, /<link\s+rel=["']stylesheet["']/i);
}

test('kitchen-sink builds a v3 hydrated document', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-'));
  const htmlPath = path.join(dir, 'kitchen-sink.html');
  const built = runCli(['build', fixture('kitchen-sink.tsx'), '-o', htmlPath]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);
  assertV3Document(readFileSync(htmlPath, 'utf8'));
});

test('overflow-violation fixture builds (verify gate is Task 10)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-'));
  const htmlPath = path.join(dir, 'overflow.html');
  const built = runCli(['build', fixture('overflow-violation.tsx'), '-o', htmlPath]);
  assert.equal(built.code, 0, `build should pass lint: ${built.stderr}`);
  assertV3Document(readFileSync(htmlPath, 'utf8'));
});

test('dark-report fixture builds with author dark seed', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-dark-'));
  const htmlPath = path.join(dir, 'dark-report.html');
  const built = runCli(['build', fixture('dark-report.tsx'), '-o', htmlPath]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);
  const html = readFileSync(htmlPath, 'utf8');
  assertV3Document(html);
  assert.match(html, /\.dark\{/);
});

test('ok fixture builds with controls markup', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-ctrl-'));
  const htmlPath = path.join(dir, 'ok.html');
  const built = runCli(['build', fixture('ok.tsx'), '-o', htmlPath]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);
  const html = readFileSync(htmlPath, 'utf8');
  assertV3Document(html);
  assert.match(html, /Toggle dark mode|Report controls/);
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

test('verify-ok fixture: build + verify --manual-ok exits 0 / hard 0', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-verify-ok-'));
  const htmlPath = path.join(dir, 'verify-ok.html');
  const outJson = path.join(dir, 'verification.json');

  const built = runCli(['build', fixture('verify-ok.tsx'), '-o', htmlPath]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);
  assertV3Document(readFileSync(htmlPath, 'utf8'));

  const verified = runCli(['verify', htmlPath, '--manual-ok', '-o', outJson], {
    timeout: FIVE_MIN,
  });
  assert.equal(verified.code, 0, `verify failed: ${verified.stderr}\n${verified.stdout}`);
  assert.match(verified.stderr, /PASS/);

  const report = JSON.parse(readFileSync(outJson, 'utf8'));
  const hard = report.findings.filter((f) => f.severity === 'error');
  assert.equal(hard.length, 0, `unexpected hard: ${JSON.stringify(hard, null, 2)}`);
  assert.ok(
    report.inventory.viewports.some((v) => v.theme === 'dark'),
    'dark pass must appear in inventory',
  );
  assert.equal(report.inventory.viewports.length, 4, '390+768+1280+dark');
});

test('ko-glue: word-joiner survives build + hydrates clean (hard 0)', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-ko-glue-'));
  const htmlPath = path.join(dir, 'ko-glue.html');
  const outJson = path.join(dir, 'verification.json');

  const built = runCli(['build', fixture('ko-glue.tsx'), '-o', htmlPath]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);
  const html = readFileSync(htmlPath, 'utf8');
  assertV3Document(html);
  assert.ok(html.includes(')⁠와'), 'built HTML must keep the glued particle');

  const verified = runCli(['verify', htmlPath, '--manual-ok', '-o', outJson], {
    timeout: FIVE_MIN,
  });
  assert.equal(verified.code, 0, `verify failed: ${verified.stderr}\n${verified.stdout}`);

  const report = JSON.parse(readFileSync(outJson, 'utf8'));
  const hard = report.findings.filter((f) => f.severity === 'error');
  assert.equal(hard.length, 0, `unexpected hard: ${JSON.stringify(hard, null, 2)}`);
});

test('ResultBlock: builds + hydrates clean (hard 0)', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-result-block-'));
  const htmlPath = path.join(dir, 'result-block.html');
  const outJson = path.join(dir, 'verification.json');

  const built = runCli(['build', fixture('result-block.tsx'), '-o', htmlPath]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);
  assertV3Document(readFileSync(htmlPath, 'utf8'));

  const verified = runCli(['verify', htmlPath, '--manual-ok', '-o', outJson], {
    timeout: FIVE_MIN,
  });
  assert.equal(verified.code, 0, `verify failed: ${verified.stderr}\n${verified.stdout}`);

  const report = JSON.parse(readFileSync(outJson, 'utf8'));
  const hard = report.findings.filter((f) => f.severity === 'error');
  // Guards the `{expr}literal` trap: SSR is renderToStaticMarkup, which merges
  // adjacent text into one node while the client splits it — hydration-warning.
  assert.equal(hard.length, 0, `unexpected hard: ${JSON.stringify(hard, null, 2)}`);
});

test('verify-hydration-break: hydration-warning is hard', { timeout: FIVE_MIN }, (t) => {
  if (!browserAvailable()) return t.skip('agent-browser not installed');

  const dir = mkdtempSync(path.join(tmpdir(), 'cb-e2e-hydrate-break-'));
  const htmlPath = path.join(dir, 'break-break.html');
  const outJson = path.join(dir, 'verification.json');

  const built = runCli(['build', fixture('verify-hydration-break.tsx'), '-o', htmlPath]);
  assert.equal(built.code, 0, `build failed: ${built.stderr}`);

  const verified = runCli(['verify', htmlPath, '--manual-ok', '-o', outJson], {
    timeout: FIVE_MIN,
  });
  assert.equal(verified.code, 1, `expected exit 1, got ${verified.code}: ${verified.stderr}`);

  const report = JSON.parse(readFileSync(outJson, 'utf8'));
  const hard = report.findings.filter((f) => f.severity === 'error');
  const hydrationHard = hard.filter((f) =>
    f.ruleId === 'hydration-warning'
    || f.ruleId === 'hydration-failed'
    || f.ruleId === 'console-error',
  );
  assert.ok(
    hydrationHard.length > 0,
    `expected hydration-related hard finding, got: ${JSON.stringify(hard, null, 2)}`,
  );
});
