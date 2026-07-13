import assert from 'node:assert/strict';
import test from 'node:test';
import { classify, exitCodeFor, REQUIRED_MANUAL_REVIEW } from '../scripts/build-verification-report.mjs';

const allManualReview = REQUIRED_MANUAL_REVIEW.map((id) => ({ id, note: 'reviewed' }));

function measurements(overrides = {}) {
  return {
    report: { mode: 'core', declared: ['chart'], calledAtRuntime: ['chart'], includedModules: ['chart'], externalResources: ['echarts'], dependencyBytes: 12000 },
    viewports: [{ width: 390, theme: 'light', overflow: false, charts: [{ id: '#c', hasAria: true, hasDataAlt: true }], contrast: [], console: [], resources: [] }],
    manualReview: allManualReview,
    ...overrides,
  };
}

test('a clean report passes with no hard findings and complete review', () => {
  const result = classify(measurements());
  assert.equal(result.passed, true);
  assert.equal(result.complete, true);
  assert.equal(result.findings.filter((f) => f.severity === 'error').length, 0);
  assert.equal(exitCodeFor(result), 0);
});

test('findings are normalized with rule id, severity, viewport, theme, selector, and reason', () => {
  const result = classify(measurements({
    viewports: [{ width: 390, theme: 'dark', overflow: true, charts: [], contrast: [], console: [], resources: [] }],
  }));
  const overflow = result.findings.find((f) => f.ruleId === 'horizontal-overflow');
  assert.ok(overflow);
  assert.equal(overflow.severity, 'error');
  assert.equal(overflow.viewport, 390);
  assert.equal(overflow.theme, 'dark');
  assert.match(overflow.reason, /horizontal/);
});

test('hard failures block: contrast, clipped text, chart alt, and undeclared calls', () => {
  const result = classify(measurements({
    report: { declared: [], calledAtRuntime: ['chart'] },
    viewports: [{
      width: 768, theme: 'light', overflow: false,
      clips: [{ selector: 'h1', reason: 'heading clipped' }],
      contrast: [{ selector: 'p', ratio: 3.1, required: 4.5, kind: 'text' }],
      charts: [{ id: '#c', hasAria: false, hasDataAlt: false }],
      console: [], resources: [],
    }],
  }));
  const ids = result.findings.filter((f) => f.severity === 'error').map((f) => f.ruleId);
  assert.ok(ids.includes('clipped-text'));
  assert.ok(ids.includes('text-contrast'));
  assert.ok(ids.includes('chart-missing-aria'));
  assert.ok(ids.includes('chart-missing-data-alternative'));
  assert.ok(ids.includes('capability-undeclared-call'));
  assert.equal(result.passed, false);
  assert.equal(exitCodeFor(result), 1);
});

test('warnings do not block but are recorded', () => {
  const result = classify(measurements({
    report: { declared: ['chart', 'table'], calledAtRuntime: ['chart'] }, // table unused
    viewports: [{
      width: 1280, theme: 'light', overflow: false, charts: [], contrast: [], console: [], resources: [],
      repeatedValues: [{ value: '#FF0000', count: 5 }], surfaces: 20,
    }],
  }));
  const warns = result.findings.filter((f) => f.severity === 'warning').map((f) => f.ruleId);
  assert.ok(warns.includes('repeated-literal'));
  assert.ok(warns.includes('excess-surfaces'));
  assert.ok(warns.includes('capability-declared-unused'));
  assert.equal(result.findings.filter((f) => f.severity === 'error').length, 0);
  assert.equal(exitCodeFor(result), 0); // warnings + complete review => pass
});

test('a declared capability that does not respond when driven is a hard failure', () => {
  const ok = classify(measurements({
    report: { declared: ['table'], calledAtRuntime: ['table'], capabilityChecks: [{ capability: 'table', action: 'sort', ok: true }] },
  }));
  assert.equal(ok.findings.filter((f) => f.ruleId === 'capability-not-functional').length, 0);

  const broken = classify(measurements({
    report: { declared: ['table'], calledAtRuntime: ['table'], capabilityChecks: [{ capability: 'table', action: 'sort', ok: false }] },
  }));
  const f = broken.findings.find((x) => x.ruleId === 'capability-not-functional');
  assert.ok(f);
  assert.equal(f.severity, 'error');
  assert.equal(f.selector, 'table');
  assert.equal(exitCodeFor(broken), 1);
});

test('missing required manual review is incomplete, not passed (exit 2)', () => {
  const result = classify(measurements({ manualReview: [{ id: 'caption-meaning', note: 'ok' }] }));
  assert.equal(result.complete, false);
  assert.equal(result.passed, false);
  assert.equal(exitCodeFor(result), 2);
  assert.equal(result.manualReview.length, REQUIRED_MANUAL_REVIEW.length);
  assert.equal(result.manualReview.filter((m) => m.recorded).length, 1);
});
