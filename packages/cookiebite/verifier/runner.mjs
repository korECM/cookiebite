// verifier/runner.mjs — drive agent-browser over a v3 hydrated report HTML,
// collect measurements at 390/768/1280 (+ always-dark), return raw viewports +
// report for classify. Waits for window.__COOKIEBITE_HYDRATED__ / ERROR.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dom = readFileSync(path.join(pkgRoot, 'verifier/dom.js'), 'utf8');

const HYDRATION_TIMEOUT_MS = 10_000;
const CHART_WAIT_MS = 5_000;

export class RunnerUnavailableError extends Error {
  constructor(message = 'agent-browser not found. Install: npm i -g agent-browser && agent-browser install') {
    super(message);
    this.name = 'RunnerUnavailableError';
  }
}

/** Wrong input file (not a cookiebite report) — message-only at the CLI. */
export class VerifyInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VerifyInputError';
  }
}

function resolveRunner() {
  for (const candidate of [['agent-browser'], ['npx', '-y', 'agent-browser'], ['bunx', 'agent-browser']]) {
    const probe = spawnSync(candidate[0], [...candidate.slice(1), '--version'], { encoding: 'utf8' });
    if (probe.status === 0) return candidate;
  }
  throw new RunnerUnavailableError();
}

function truncate(text, max = 300) {
  const s = String(text ?? '');
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * @param {string} htmlPath
 * @param {{ sessionSuffix?: string }} [opts]
 * @returns {Promise<{ viewports: object[], report: object }>}
 */
export async function runVerification(htmlPath, opts = {}) {
  const fixture = path.resolve(htmlPath);
  const suffix = opts.sessionSuffix ?? '0';
  const session = `cb-verify-${process.pid}-${suffix}`;
  const runner = resolveRunner();

  function ab(...args) {
    return spawnSync(runner[0], ['--session-name', session, ...runner.slice(1), ...args], { encoding: 'utf8' });
  }

  // agent-browser prints a JS return value; strings arrive JSON-quoted, and our
  // DOM script returns JSON.stringify(...), so the payload is double-encoded.
  function evalPage(js) {
    const r = ab('eval', js);
    let value = (r.stdout || '').trim();
    try { value = JSON.parse(value); } catch { /* not quoted */ }
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch { /* leave as string */ }
    }
    return value;
  }

  function abJson(...args) {
    const r = ab(...args, '--json');
    try {
      return JSON.parse((r.stdout || '').trim());
    } catch {
      return null;
    }
  }

  function collectConsoleErrors() {
    const messages = [];
    const cons = abJson('console');
    for (const m of cons?.data?.messages || []) {
      const text = truncate(m.text || '');
      if (m.type === 'error' || /Hydration failed/i.test(text)) {
        messages.push({ level: 'error', text });
      }
    }
    const errs = abJson('errors');
    for (const e of errs?.data?.errors || []) {
      messages.push({ level: 'error', text: truncate(e.text || '') });
    }
    return messages;
  }

  function waitForHydration() {
    const deadline = Date.now() + HYDRATION_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const state = evalPage(`({
        hydrated: window.__COOKIEBITE_HYDRATED__ === true,
        error: window.__COOKIEBITE_HYDRATION_ERROR__ || null,
        warnings: Array.isArray(window.__COOKIEBITE_HYDRATION_WARNINGS__)
          ? window.__COOKIEBITE_HYDRATION_WARNINGS__.slice()
          : []
      })`);
      if (state && (state.hydrated || state.error)) {
        return {
          hydrated: !!state.hydrated,
          error: state.error || null,
          warnings: state.warnings || [],
          timeout: false,
        };
      }
      ab('wait', '200');
    }
    const state = evalPage(`({
      hydrated: window.__COOKIEBITE_HYDRATED__ === true,
      error: window.__COOKIEBITE_HYDRATION_ERROR__ || null,
      warnings: Array.isArray(window.__COOKIEBITE_HYDRATION_WARNINGS__)
        ? window.__COOKIEBITE_HYDRATION_WARNINGS__.slice()
        : []
    })`) || {};
    return {
      hydrated: !!state.hydrated,
      error: state.error || null,
      warnings: state.warnings || [],
      timeout: !(state.hydrated || state.error),
    };
  }

  /** ResponsiveContainer paints after hydrate — poll until shapes exist or give up. */
  function waitForCharts() {
    const deadline = Date.now() + CHART_WAIT_MS;
    while (Date.now() < deadline) {
      const empty = evalPage(`(function(){
        var charts = document.querySelectorAll('[data-slot=chart]');
        if (!charts.length) return 0;
        var n = 0;
        charts.forEach(function(c){
          var svg = c.querySelector('.recharts-wrapper svg') || c.querySelector('svg');
          if (!svg || !svg.querySelector('path, rect, circle')) n++;
        });
        return n;
      })()`);
      if (empty === 0) return;
      ab('wait', '200');
    }
  }

  /**
   * @param {{ dark?: boolean, assertDocument?: boolean }} opts
   */
  function measurePass({ dark = false, assertDocument = false } = {}) {
    ab('console', '--clear');
    ab('errors', '--clear');
    ab('open', `file://${fixture}`);

    if (assertDocument) {
      const ok = evalPage(
        `!!(document.getElementById('root') && document.getElementById('cookiebite-app'))`,
      );
      if (ok !== true) {
        throw new VerifyInputError(
          'cookiebite 리포트가 아닙니다 — #root / #cookiebite-app 블록이 없습니다 (open 실패 또는 잘못된 파일)',
        );
      }
    }

    const hydration = waitForHydration();
    if (dark) {
      evalPage(`document.documentElement.classList.add('dark')`);
      ab('wait', '200');
    }
    if (hydration.hydrated && !hydration.error) {
      waitForCharts();
    } else {
      ab('wait', '400');
    }

    const view = evalPage(dom);
    if (!view || typeof view !== 'object') return null;

    view.hydrationTimeout = hydration.timeout === true;
    view.hydrationError = hydration.error || null;
    view.hydrationWarnings = (hydration.warnings || []).map((w) => truncate(w));
    view.console = collectConsoleErrors();
    if (dark) view.theme = 'dark';
    return view;
  }

  try {
    // Measure each breakpoint as a fresh render: set the viewport before opening
    // so ResponsiveContainer initializes at that width.
    const viewports = [];
    for (const [w, h] of [[390, 900], [768, 900], [1280, 900]]) {
      ab('set', 'viewport', String(w), String(h));
      const view = measurePass({ assertDocument: viewports.length === 0 });
      if (view) viewports.push(view);
    }

    // Dark pass — always. Theme is documentElement.classList 'dark' (no CB.theme).
    {
      ab('set', 'viewport', '1280', '900');
      const darkView = measurePass({ dark: true });
      if (darkView) viewports.push(darkView);
      if (darkView && evalPage(`document.documentElement.classList.contains('dark')`) !== true) {
        throw new Error("dark pass: documentElement missing class 'dark'");
      }
    }

    return {
      viewports,
      report: {
        mode: 'v3',
        declared: [],
        calledAtRuntime: [],
        includedModules: [],
        externalResources: [],
        dependencyBytes: null,
        capabilityChecks: [],
      },
    };
  } finally {
    ab('close');
  }
}
