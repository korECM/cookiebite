// verifier-runner.mjs — drive agent-browser over a report, collect measurements at
// each viewport with scripts/verify-report-dom.js, classify them, and exit with the
// release code. Used by evals/test-verifier.sh. Passing the DOM script as an argv
// element (not a shell-interpolated string) keeps its backticks/$ intact.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { classify, exitCodeFor, REQUIRED_MANUAL_REVIEW } from '../scripts/build-verification-report.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dom = readFileSync(path.join(root, 'scripts/verify-report-dom.js'), 'utf8');

const fixture = process.argv[2] ? path.resolve(process.argv[2]) : null;
const expect = (process.argv.includes('--expect') && process.argv[process.argv.indexOf('--expect') + 1]) || null;
const manualOk = process.argv.includes('--manual-ok');
const outIndex = process.argv.indexOf('-o');
const out = outIndex >= 0 ? process.argv[outIndex + 1] : null;
if (!fixture) { process.stderr.write('usage: node evals/verifier-runner.mjs <fixture.html> [--expect pass|fail] [--manual-ok] [-o verification.json]\n'); process.exit(3); }

const session = `cb-verify-${process.pid}`;
const runner = resolveRunner();
function resolveRunner() {
  for (const candidate of [['agent-browser'], ['npx', '-y', 'agent-browser'], ['bunx', 'agent-browser']]) {
    const probe = spawnSync(candidate[0], [...candidate.slice(1), '--version'], { encoding: 'utf8' });
    if (probe.status === 0) return candidate;
  }
  process.stderr.write('agent-browser not found. Install: npm i -g agent-browser && agent-browser install\n');
  return process.exit(3);
}
function ab(...args) { return spawnSync(runner[0], ['--session-name', session, ...runner.slice(1), ...args], { encoding: 'utf8' }); }

// agent-browser prints a JS return value; strings arrive JSON-quoted, and our DOM
// script returns JSON.stringify(...), so the payload is double-encoded.
function evalPage(js) {
  const r = ab('eval', js);
  let value = (r.stdout || '').trim();
  try { value = JSON.parse(value); } catch { /* not quoted */ }
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { /* leave as string */ } }
  return value;
}

ab('open', `file://${fixture}`);
ab('wait', '1600');
const viewports = [];
for (const [w, h] of [[390, 900], [1280, 900]]) {
  ab('viewport', String(w), String(h));
  ab('wait', '300');
  const view = evalPage(dom);
  if (view && typeof view === 'object') viewports.push(view);
}
// Dark pass — only when the seed declares dark (DESIGN §6). CB.theme.set('dark')
// toggles data-theme so the inlined dark tokens paint; dom.js then tags theme='dark'.
const declaresDark = evalPage(`(function(){var s=document.getElementById('cookiebite-theme');if(!s)return false;try{return !!JSON.parse(s.textContent).dark;}catch(e){return false;}})()`);
if (declaresDark === true) {
  ab('viewport', '1280', '900');
  ab('wait', '200');
  evalPage("(function(){try{window.CB.theme.set('dark');return 1;}catch(e){return 0;}})()");
  ab('wait', '200');
  const darkView = evalPage(dom);
  if (darkView && typeof darkView === 'object') viewports.push(darkView);
}
const report = evalPage(`(function(){var s=document.getElementById('cookiebite-dependency-summary');var d=s?JSON.parse(s.textContent):{};d.calledAtRuntime=(window.CB&&CB.calls)?[...new Set(CB.calls.filter(function(c){return c.type==='call';}).map(function(c){return c.capability;}))]:[];return JSON.stringify(d);})()`);
ab('close');

const reportObj = (report && typeof report === 'object') ? report : {};
if (viewports.length) reportObj.calledAtRuntime = reportObj.calledAtRuntime || viewports[0].calledAtRuntime || [];

const measurements = {
  report: reportObj,
  viewports,
  manualReview: manualOk ? REQUIRED_MANUAL_REVIEW.map((id) => ({ id, note: 'release-reviewed' })) : [],
};
if (process.env.CB_VERIFY_DEBUG) {
  process.stderr.write(`DEBUG views: ${JSON.stringify(viewports.map((v) => ({ w: v.width, o: v.overflow, charts: v.charts && v.charts.length, contrast: v.contrast && v.contrast.length })))}\n`);
}
const result = classify(measurements);
if (out) writeFileSync(out, JSON.stringify(result, null, 2));

const code = exitCodeFor(result);
const hard = result.findings.filter((f) => f.severity === 'error');
process.stderr.write(`${path.basename(fixture)}: ${result.passed ? 'PASS' : 'not passed'} (exit ${code}), hard=${hard.length}${hard.length ? ' [' + hard.map((f) => f.ruleId).join(', ') + ']' : ''}\n`);

if (expect) {
  const ok = (expect === 'pass' && code === 0) || (expect === 'fail' && code === 1);
  if (!ok) { process.stderr.write(`  EXPECTED ${expect} but exit was ${code}\n`); process.exit(1); }
  process.stderr.write(`  expectation '${expect}' met\n`);
  process.exit(0);
}
process.exit(code);
