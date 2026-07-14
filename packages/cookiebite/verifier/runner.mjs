// verifier/runner.mjs — drive agent-browser over a report HTML, collect
// measurements at 390/768/1280 (+ conditional dark), return raw viewports +
// report for classify. Pattern from evals/verifier-runner.mjs (read-only ref).
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dom = readFileSync(path.join(pkgRoot, 'verifier/dom.js'), 'utf8');

export class RunnerUnavailableError extends Error {
  constructor(message = 'agent-browser not found. Install: npm i -g agent-browser && agent-browser install') {
    super(message);
    this.name = 'RunnerUnavailableError';
  }
}

function resolveRunner() {
  for (const candidate of [['agent-browser'], ['npx', '-y', 'agent-browser'], ['bunx', 'agent-browser']]) {
    const probe = spawnSync(candidate[0], [...candidate.slice(1), '--version'], { encoding: 'utf8' });
    if (probe.status === 0) return candidate;
  }
  throw new RunnerUnavailableError();
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

  try {
    // Measure each breakpoint as a fresh render: set the viewport before opening
    // so ECharts (and any width-sensitive layout) initializes at that width. A
    // resize after init would leave the canvas at its stale width and spuriously
    // overflow — we want what a user loading the report at that width actually sees.
    const viewports = [];
    for (const [w, h] of [[390, 900], [768, 900], [1280, 900]]) {
      ab('set', 'viewport', String(w), String(h));
      ab('open', `file://${fixture}`);
      ab('wait', '1600');
      if (viewports.length === 0) {
        const hasSummary = evalPage(`!!document.getElementById('cookiebite-dependency-summary')`);
        if (!hasSummary) {
          throw new Error('cookiebite 리포트가 아닙니다 — #cookiebite-dependency-summary 블록이 없습니다 (open 실패 또는 잘못된 파일)');
        }
      }
      const view = evalPage(dom);
      if (view && typeof view === 'object') viewports.push(view);
    }

    const declaredCaps = evalPage(`(function(){var s=document.getElementById('cookiebite-dependency-summary');return s?(JSON.parse(s.textContent).declared||[]):[];})()`);
    const capabilityChecks = [];
    if (Array.isArray(declaredCaps)) {
      ab('set', 'viewport', '1280', '900');
      ab('wait', '200');
      if (declaredCaps.includes('chart')) {
        const ok = evalPage(`!!document.querySelector('.cb-chart canvas')`);
        capabilityChecks.push({ capability: 'chart', action: 'render', ok: ok === true });
      }
      if (declaredCaps.includes('table')) {
        ab('click', 'th button.cb-sort');
        ab('wait', '150');
        const ok = evalPage(`!!document.querySelector('th[aria-sort]')`);
        capabilityChecks.push({ capability: 'table', action: 'sort', ok: ok === true });
      }
      if (declaredCaps.includes('glossary')) {
        ab('focus', '[aria-describedby]');
        ab('wait', '150');
        const ok = evalPage(`(function(){var d=document.querySelector('.cb-glossary-def');return d?!d.hidden:false;})()`);
        ab('eval', `(function(){var t=document.querySelector('[aria-describedby]');if(t)t.blur();return 0;})()`);
        capabilityChecks.push({ capability: 'glossary', action: 'open', ok: ok === true });
      }
    }

    // Dark pass — only when cookiebite-theme JSON declares dark.
    // Previously set('dark') was try/catch→0 and the return ignored, so a race
    // where CB.theme was not ready produced a light-tagged "dark" measurement.
    const declaresDark = evalPage(`(function(){var s=document.getElementById('cookiebite-theme');if(!s)return false;try{return !!JSON.parse(s.textContent).dark;}catch(e){return false;}})()`);
    if (declaresDark === true) {
      ab('set', 'viewport', '1280', '900');
      ab('wait', '200');

      let themeReady = false;
      for (let i = 0; i < 10; i++) {
        if (evalPage('!!window.CB && !!window.CB.theme') === true) {
          themeReady = true;
          break;
        }
        ab('wait', '200');
      }
      if (!themeReady) {
        throw new Error("dark pass: window.CB.theme not ready after polling");
      }

      let setOk = false;
      for (let i = 0; i < 10; i++) {
        const applied = evalPage("(function(){try{window.CB.theme.set('dark');return 1;}catch(e){return 0;}})()");
        if (applied === 1) {
          setOk = true;
          break;
        }
        ab('wait', '200');
      }
      if (!setOk) {
        throw new Error("dark pass: CB.theme.set('dark') failed after retries");
      }

      ab('wait', '200');
      if (evalPage(`document.documentElement.getAttribute('data-theme') === 'dark'`) !== true) {
        throw new Error("dark pass: data-theme is not 'dark' after CB.theme.set('dark')");
      }

      const darkView = evalPage(dom);
      if (darkView && typeof darkView === 'object') viewports.push(darkView);
    }

    const report = evalPage(`(function(){var s=document.getElementById('cookiebite-dependency-summary');var d=s?JSON.parse(s.textContent):{};d.calledAtRuntime=(window.CB&&CB.calls)?[...new Set(CB.calls.filter(function(c){return c.type==='call';}).map(function(c){return c.capability;}))]:[];return JSON.stringify(d);})()`);

    const reportObj = (report && typeof report === 'object') ? report : {};
    if (viewports.length) {
      reportObj.calledAtRuntime = reportObj.calledAtRuntime || viewports[0].calledAtRuntime || [];
    }
    reportObj.capabilityChecks = capabilityChecks;

    return { viewports, report: reportObj };
  } finally {
    ab('close');
  }
}
