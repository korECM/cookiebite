// build-verification-report.mjs — turn raw browser measurements into a versioned,
// severity-tagged verification.json (DESIGN.md §6). Deterministic checks become
// findings; genuinely human judgments stay in manualReview. Release exit codes:
// 1 when any hard finding exists, 2 when verification/required review is incomplete,
// 0 when clean. `classify` is pure so it can be unit-tested without a browser.
import { readFileSync, writeFileSync } from 'node:fs';

export const REQUIRED_MANUAL_REVIEW = [
  'caption-meaning', 'status-by-color', 'duplicated-claims',
  'prose-vs-visual', 'five-second-conclusion',
];

const HARD = 'error';
const WARN = 'warning';
const INFO = 'info';

function finding(ruleId, severity, view, extra) {
  return {
    ruleId,
    severity,
    viewport: view ? view.width : null,
    theme: view ? view.theme : null,
    selector: extra.selector || extra.chartId || null,
    measured: extra.measured ?? null,
    reason: extra.reason,
    evidence: extra.evidence || (view ? view.evidence || null : null),
  };
}

export function classify(measurements) {
  const findings = [];
  const report = measurements.report || {};
  const views = measurements.viewports || [];

  for (const view of views) {
    if (view.overflow) {
      findings.push(finding('horizontal-overflow', HARD, view, {
        measured: view.overflow, reason: 'the document scrolls horizontally at this viewport',
      }));
    }
    for (const clip of view.clips || []) {
      findings.push(finding('clipped-text', HARD, view, {
        selector: clip.selector, measured: clip.measured, reason: clip.reason || 'text or label is clipped or overlapping',
      }));
    }
    for (const chart of view.charts || []) {
      if (chart.hasCanvas === false) {
        findings.push(finding('chart-not-rendered', HARD, view, {
          selector: chart.id, reason: 'chart host has no rendered canvas',
        }));
      }
      if (chart.degenerate) findings.push(finding('degenerate-chart', HARD, view, { selector: chart.id, reason: 'chart collapsed to zero size or has no series' }));
      if (!chart.hasAria) findings.push(finding('chart-missing-aria', HARD, view, { selector: chart.id, reason: 'chart host has no accessible name' }));
      if (!chart.hasDataAlt) findings.push(finding('chart-missing-data-alternative', HARD, view, { selector: chart.id, reason: 'chart has no structured data equivalent' }));
      if (chart.baselineTruncated) findings.push(finding('truncated-bar-baseline', HARD, view, { selector: chart.id, reason: 'bar chart does not start at zero, exaggerating differences' }));
    }
    for (const entry of view.console || []) {
      if (entry.level === 'error') findings.push(finding('uncaught-error', HARD, view, { measured: entry.text, reason: 'the page logged an uncaught error' }));
    }
    for (const resource of view.resources || []) {
      if (resource.failed) findings.push(finding('resource-failure', HARD, view, { measured: resource.url, reason: 'a required resource failed to load' }));
    }
    for (const c of view.contrast || []) {
      if (c.ratio < c.required) {
        findings.push(finding(c.kind === 'focus' ? 'focus-contrast' : 'text-contrast', HARD, view, {
          selector: c.selector, measured: `${c.ratio.toFixed(2)}:1 < ${c.required}:1`, reason: `${c.kind || 'text'} does not meet the required contrast`,
        }));
      }
    }
    for (const k of view.keyboard || []) {
      if (!k.reachable) findings.push(finding('keyboard-unreachable', HARD, view, { selector: k.selector, reason: 'interactive element is not keyboard reachable' }));
    }

    // Warnings — advisory, never block.
    for (const dup of view.repeatedValues || []) {
      findings.push(finding('repeated-literal', WARN, view, { measured: `${dup.value} ×${dup.count}`, reason: 'a literal value repeats; consider a report-local custom property' }));
    }
    for (const [rule, count, limit] of [
      ['excess-surfaces', view.surfaces, 8], ['excess-shadows', view.shadows, 6],
      ['excess-icons', view.icons, 12], ['excess-controls', view.controls, 6],
    ]) {
      if (typeof count === 'number' && count > limit) findings.push(finding(rule, WARN, view, { measured: `${count} > ${limit}`, reason: `${rule.replace('excess-', '')} exceed the quiet-reading budget` }));
    }
    if (view.docLength > 6000 && view.hasNav === false) {
      findings.push(finding('long-document-no-nav', WARN, view, { measured: view.docLength, reason: 'long document offers no navigation aid' }));
    }
  }

  // Declared/runtime capability parity — a hard mismatch.
  const declared = new Set(report.declared || []);
  const called = new Set(report.calledAtRuntime || []);
  for (const capability of declared) {
    if (capability !== 'compat' && !called.has(capability)) {
      findings.push(finding('capability-declared-unused', WARN, null, { selector: capability, reason: 'capability declared in the marker but never called at runtime' }));
    }
  }
  for (const capability of called) {
    if (!declared.has(capability)) {
      findings.push(finding('capability-undeclared-call', HARD, null, { selector: capability, reason: 'capability called at runtime but not declared in the marker' }));
    }
  }

  // Declared capabilities must actually respond to their registered action when driven.
  for (const check of report.capabilityChecks || []) {
    if (!check.ok) {
      findings.push(finding('capability-not-functional', HARD, null, {
        selector: check.capability,
        reason: `declared capability '${check.capability}' did not respond to its '${check.action}' action`,
      }));
    }
  }

  const dependencyBytes = report.dependencyBytes ?? null;
  findings.push(finding('dependency-inventory', INFO, null, { measured: dependencyBytes, reason: `report ships ${report.includedModules ? report.includedModules.length : 0} module(s)` }));

  const recorded = new Set((measurements.manualReview || []).map((m) => m.id));
  const manualReview = REQUIRED_MANUAL_REVIEW.map((id) => ({
    id,
    recorded: recorded.has(id),
    note: (measurements.manualReview || []).find((m) => m.id === id)?.note || null,
  }));

  // Warnings: same ruleId+selector across viewports is noise — keep one.
  // Hard findings stay per-viewport (viewport-specific layout breaks matter).
  const seenWarn = new Set();
  const deduped = [];
  for (const f of findings) {
    if (f.severity === WARN) {
      const key = `${f.ruleId}\0${f.selector ?? ''}`;
      if (seenWarn.has(key)) continue;
      seenWarn.add(key);
    }
    deduped.push(f);
  }

  const hard = deduped.filter((f) => f.severity === HARD);
  const complete = manualReview.every((m) => m.recorded);
  const passed = hard.length === 0 && complete;

  return {
    schemaVersion: 1,
    complete,
    passed,
    findings: deduped,
    inventory: {
      viewports: views.map((v) => ({ width: v.width, theme: v.theme })),
      mode: report.mode || null,
      includedModules: report.includedModules || [],
      externalResources: report.externalResources || [],
      dependencyBytes,
    },
    manualReview,
  };
}

export function exitCodeFor(result) {
  if (result.findings.some((f) => f.severity === HARD)) return 1;
  if (!result.complete) return 2;
  return 0;
}

// --- CLI ---
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv[2];
  const outIndex = process.argv.indexOf('-o');
  const out = outIndex >= 0 ? process.argv[outIndex + 1] : null;
  if (!input) { process.stderr.write('usage: node scripts/build-verification-report.mjs <measurements.json> [-o verification.json]\n'); process.exit(3); }
  const measurements = JSON.parse(readFileSync(input, 'utf8'));
  const result = classify(measurements);
  const json = JSON.stringify(result, null, 2);
  if (out) writeFileSync(out, json); else process.stdout.write(`${json}\n`);
  const code = exitCodeFor(result);
  const hard = result.findings.filter((f) => f.severity === HARD).length;
  process.stderr.write(result.passed ? 'verification passed\n' : `verification ${code === 2 ? 'incomplete' : 'failed'}: ${hard} hard finding(s), complete=${result.complete}\n`);
  process.exit(code);
}
