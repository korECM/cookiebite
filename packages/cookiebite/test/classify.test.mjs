import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classify,
  exitCodeFor,
  REQUIRED_MANUAL_REVIEW,
} from '../verifier/classify.mjs';

const allManualReview = REQUIRED_MANUAL_REVIEW.map((id) => ({ id, note: 'reviewed' }));

function measurements(overrides = {}) {
  return {
    report: {
      mode: 'v3',
      includedModules: [],
      externalResources: [],
      dependencyBytes: null,
    },
    viewports: [{
      width: 1280,
      theme: 'light',
      overflow: false,
      charts: [{ id: '[data-chart=c]', hasSvg: true, shapeCount: 3, empty: false }],
      contrast: [],
      console: [],
      resources: [],
      hydrationTimeout: false,
      hydrationError: null,
      hydrationWarnings: [],
    }],
    manualReview: allManualReview,
    ...overrides,
  };
}

test('happy path with rendered chart is clean (exit 0)', () => {
  const result = classify(measurements());
  const hard = result.findings.filter((f) => f.severity === 'error');
  assert.equal(hard.length, 0);
  assert.equal(result.passed, true);
  assert.equal(exitCodeFor(result), 0);
});

test('hydration-failed is hard error', () => {
  const result = classify(measurements({
    viewports: [{
      width: 1280,
      theme: 'light',
      overflow: false,
      charts: [],
      contrast: [],
      console: [],
      resources: [],
      hydrationTimeout: false,
      hydrationError: 'Error: boom',
      hydrationWarnings: [],
    }],
  }));
  const f = result.findings.find((x) => x.ruleId === 'hydration-failed');
  assert.ok(f, 'expected hydration-failed');
  assert.equal(f.severity, 'error');
  assert.match(String(f.measured), /boom/);
  assert.equal(exitCodeFor(result), 1);
});

test('hydration-timeout is hard error', () => {
  const result = classify(measurements({
    viewports: [{
      width: 1280,
      theme: 'light',
      overflow: false,
      charts: [],
      contrast: [],
      console: [],
      resources: [],
      hydrationTimeout: true,
      hydrationError: null,
      hydrationWarnings: [],
    }],
  }));
  const f = result.findings.find((x) => x.ruleId === 'hydration-timeout');
  assert.ok(f);
  assert.equal(f.severity, 'error');
  assert.equal(exitCodeFor(result), 1);
});

test('hydration-warning (recoverable mismatch) is hard error', () => {
  const result = classify(measurements({
    viewports: [{
      width: 1280,
      theme: 'light',
      overflow: false,
      charts: [],
      contrast: [],
      console: [],
      resources: [],
      hydrationTimeout: false,
      hydrationError: null,
      hydrationWarnings: ['Error: Hydration failed because the server rendered HTML...'],
    }],
  }));
  const f = result.findings.find((x) => x.ruleId === 'hydration-warning');
  assert.ok(f);
  assert.equal(f.severity, 'error');
  assert.equal(exitCodeFor(result), 1);
});

test('console-error is hard; Hydration failed warn text also hard', () => {
  const result = classify(measurements({
    viewports: [{
      width: 1280,
      theme: 'light',
      overflow: false,
      charts: [],
      contrast: [],
      console: [
        { level: 'error', text: 'Uncaught TypeError: x is not a function' },
        { level: 'warning', text: 'Hydration failed because the initial UI does not match' },
      ],
      resources: [],
      hydrationTimeout: false,
      hydrationError: null,
      hydrationWarnings: [],
    }],
  }));
  const errs = result.findings.filter((x) => x.ruleId === 'console-error');
  assert.equal(errs.length, 2);
  assert.ok(errs.every((f) => f.severity === 'error'));
  assert.equal(exitCodeFor(result), 1);
});

test('chart-empty when [data-slot=chart] has no SVG shapes', () => {
  const result = classify(measurements({
    viewports: [{
      width: 1280,
      theme: 'light',
      overflow: false,
      charts: [{ id: '[data-chart=broken]', hasSvg: false, shapeCount: 0, empty: true }],
      contrast: [],
      console: [],
      resources: [],
      hydrationTimeout: false,
      hydrationError: null,
      hydrationWarnings: [],
    }],
  }));
  const f = result.findings.find((x) => x.ruleId === 'chart-empty');
  assert.ok(f, 'expected chart-empty');
  assert.equal(f.severity, 'error');
  assert.equal(f.selector, '[data-chart=broken]');
  assert.equal(exitCodeFor(result), 1);
});

test('retired chart-not-rendered / capability rules are gone', () => {
  const result = classify(measurements({
    report: {
      mode: 'v3',
      declared: ['chart'],
      calledAtRuntime: [],
      includedModules: [],
      capabilityChecks: [{ capability: 'chart', action: 'render', ok: false }],
    },
  }));
  assert.equal(result.findings.some((f) => f.ruleId === 'chart-not-rendered'), false);
  assert.equal(result.findings.some((f) => f.ruleId === 'capability-not-functional'), false);
  assert.equal(result.findings.some((f) => f.ruleId === 'capability-declared-unused'), false);
});

test('warning findings dedup across viewports by ruleId+selector', () => {
  const longView = (width) => ({
    width,
    theme: 'light',
    overflow: false,
    charts: [],
    contrast: [],
    console: [],
    resources: [],
    docLength: 9000,
    hasNav: false,
    hydrationTimeout: false,
    hydrationError: null,
    hydrationWarnings: [],
  });
  const result = classify(measurements({
    viewports: [longView(390), longView(768), longView(1280)],
  }));
  const longs = result.findings.filter((f) => f.ruleId === 'long-document-no-nav');
  assert.equal(longs.length, 1, 'same warning across 3 viewports collapses to 1');
  assert.equal(longs[0].severity, 'warning');
});

test('hard findings stay per-viewport (no warning-style dedup)', () => {
  const overflowView = (width) => ({
    width,
    theme: 'light',
    overflow: 1400,
    charts: [],
    contrast: [],
    console: [],
    resources: [],
    hydrationTimeout: false,
    hydrationError: null,
    hydrationWarnings: [],
  });
  const result = classify(measurements({
    viewports: [overflowView(390), overflowView(768), overflowView(1280)],
  }));
  const hard = result.findings.filter((f) => f.ruleId === 'horizontal-overflow');
  assert.equal(hard.length, 3, 'hard overflow stays one per viewport');
  assert.deepEqual(hard.map((f) => f.viewport).sort((a, b) => a - b), [390, 768, 1280]);
});

test('existing hard overflow rule still classifies (regression)', () => {
  const result = classify(measurements({
    viewports: [{
      width: 390,
      theme: 'light',
      overflow: 420,
      charts: [],
      contrast: [],
      console: [],
      resources: [],
      hydrationTimeout: false,
      hydrationError: null,
      hydrationWarnings: [],
    }],
  }));
  const f = result.findings.find((x) => x.ruleId === 'horizontal-overflow');
  assert.ok(f);
  assert.equal(f.severity, 'error');
  assert.equal(f.viewport, 390);
  assert.equal(f.measured, 420);
  assert.equal(result.passed, false);
  assert.equal(exitCodeFor(result), 1);
});

test('REQUIRED_MANUAL_REVIEW and exitCodeFor are unchanged', () => {
  assert.deepEqual(REQUIRED_MANUAL_REVIEW, [
    'caption-meaning', 'status-by-color', 'duplicated-claims',
    'prose-vs-visual', 'five-second-conclusion',
  ]);

  const clean = classify(measurements());
  assert.equal(exitCodeFor(clean), 0);

  const incomplete = classify(measurements({ manualReview: [] }));
  assert.equal(incomplete.complete, false);
  assert.equal(exitCodeFor(incomplete), 2);

  const hard = classify(measurements({
    viewports: [{
      width: 1280, theme: 'light', overflow: true, charts: [], contrast: [], console: [],
      resources: [], hydrationTimeout: false, hydrationError: null, hydrationWarnings: [],
    }],
  }));
  assert.equal(exitCodeFor(hard), 1);
});
