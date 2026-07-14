// lib/verify.mjs — cookiebite verify command: arg parse, multi-run flaky
// aggregation, verification.json assembly, exit 0/1/2/3.
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  classify,
  exitCodeFor,
  REQUIRED_MANUAL_REVIEW,
} from '../verifier/classify.mjs';
import { runVerification, RunnerUnavailableError } from '../verifier/runner.mjs';

const USAGE = '사용법: cookiebite verify <report.html> [--runs N] [--manual-ok] [-o out.json]';

export function aggregateRuns(perRunFindings) {
  const key = (f) => `${f.ruleId}|${f.selector ?? ''}|${f.viewport ?? ''}|${f.theme ?? ''}`;
  const total = perRunFindings.length;
  const seen = new Map();
  for (const run of perRunFindings) {
    const inRun = new Set();
    for (const f of run) {
      const k = key(f);
      if (!seen.has(k)) seen.set(k, { finding: f, count: 0 });
      if (!inRun.has(k)) { seen.get(k).count += 1; inRun.add(k); }
    }
  }
  const findings = [];
  const flaky = [];
  for (const [k, { finding, count }] of seen) {
    findings.push({ ...finding, occurrences: count, runs: total });
    if (count < total) flaky.push(k);
  }
  return { findings, flaky };
}

function parseArgs(args) {
  const positional = [];
  let runs = 1;
  let out = null;
  let manualOk = false;

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--runs') {
      const raw = args[i + 1];
      if (raw === undefined) throw new Error(`${USAGE}\n--runs 는 1..10 정수여야 합니다`);
      if (!/^\d+$/.test(raw)) throw new Error(`--runs 는 1..10 정수여야 합니다 (받음: ${raw})`);
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        throw new Error(`--runs 는 1..10 정수여야 합니다 (받음: ${raw})`);
      }
      runs = n;
      i += 1;
    } else if (a === '-o' || a === '--out') {
      if (args[i + 1] === undefined) throw new Error(USAGE);
      out = args[i + 1];
      i += 1;
    } else if (a === '--manual-ok') {
      manualOk = true;
    } else if (a.startsWith('-')) {
      throw new Error(USAGE);
    } else {
      positional.push(a);
    }
  }

  if (positional.length !== 1) throw new Error(USAGE);
  return { html: path.resolve(positional[0]), runs, out, manualOk };
}

export async function verifyCommand(args) {
  let parsed;
  try {
    parsed = parseArgs(args);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  const { html, runs, out, manualOk } = parsed;

  if (!existsSync(html)) {
    process.stderr.write('파일이 없습니다\n');
    process.exitCode = 3;
    return;
  }

  const manualReview = manualOk
    ? REQUIRED_MANUAL_REVIEW.map((id) => ({ id, note: 'release-reviewed' }))
    : [];

  try {
    const perRunFindings = [];
    let lastClassified = null;

    for (let i = 0; i < runs; i += 1) {
      const { viewports, report } = await runVerification(html, { sessionSuffix: String(i) });
      const classified = classify({
        report,
        viewports,
        manualReview,
      });
      lastClassified = classified;
      perRunFindings.push(classified.findings);
    }

    const { findings, flaky } = aggregateRuns(perRunFindings);
    const result = {
      schemaVersion: lastClassified.schemaVersion,
      complete: lastClassified.complete,
      passed: findings.every((f) => f.severity !== 'error') && lastClassified.complete,
      runs,
      flaky,
      findings,
      inventory: lastClassified.inventory,
      manualReview: lastClassified.manualReview,
    };

    if (out) writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);

    const code = exitCodeFor(result);
    const hard = findings.filter((f) => f.severity === 'error');
    process.stderr.write(
      `${path.basename(html)}: ${result.passed ? 'PASS' : 'not passed'} (exit ${code}), `
      + `hard=${hard.length}, flaky=${flaky.length}, runs=${runs}\n`,
    );
    process.exitCode = code;
  } catch (error) {
    if (error instanceof RunnerUnavailableError) {
      process.stderr.write(`${error.message}\n`);
    } else {
      process.stderr.write(`${error.stack || error.message}\n`);
    }
    process.exitCode = 3;
  }
}
