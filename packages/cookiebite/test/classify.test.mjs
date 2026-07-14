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
      mode: 'core',
      declared: ['chart'],
      calledAtRuntime: ['chart'],
      includedModules: ['chart'],
      externalResources: ['echarts'],
      dependencyBytes: 12000,
    },
    viewports: [{
      width: 1280,
      theme: 'light',
      overflow: false,
      charts: [{ id: '#c', hasCanvas: true, hasAria: true, hasDataAlt: true }],
      contrast: [],
      console: [],
      resources: [],
    }],
    manualReview: allManualReview,
    ...overrides,
  };
}

test('charts[].hasCanvas === false is hard chart-not-rendered', () => {
  const result = classify(measurements({
    viewports: [{
      width: 1280,
      theme: 'light',
      overflow: false,
      charts: [{ id: '#broken', hasCanvas: false }],
      contrast: [],
      console: [],
      resources: [],
    }],
  }));
  const f = result.findings.find((x) => x.ruleId === 'chart-not-rendered');
  assert.ok(f, 'expected chart-not-rendered finding');
  assert.equal(f.severity, 'error');
  assert.equal(f.selector, '#broken');
  assert.equal(exitCodeFor(result), 1);
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
      width: 1280, theme: 'light', overflow: true, charts: [], contrast: [], console: [], resources: [],
    }],
  }));
  assert.equal(exitCodeFor(hard), 1);
});
