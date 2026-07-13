import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const work = mkdtempSync(path.join(tmpdir(), 'cb-cli-'));
const SCAFFOLD = path.join(root, 'scripts/scaffold.sh');
const INLINE = path.join(root, 'scripts/inline.sh');
const ASSEMBLE = path.join(root, 'scripts/assemble-report.mjs');
let seq = 0;

function scaffold(args) {
  // Run from a foreign CWD to prove script-relative template resolution.
  return spawnSync('bash', [SCAFFOLD, ...args], { cwd: work, encoding: 'utf8' });
}
function assemble(input) {
  const out = `${input}.assembled.html`;
  const r = spawnSync('node', [ASSEMBLE, input, '-o', out], { encoding: 'utf8' });
  return { status: r.status, stderr: r.stderr, out, html: r.status === 0 ? readFileSync(out, 'utf8') : '' };
}
function makeReport(marker, script, extraBody = '') {
  let html = readFileSync(path.join(root, 'assets/template.html'), 'utf8');
  html = html.replace(/<!--\s*COOKIEBITE:USE\s*-->/, `<!-- COOKIEBITE:USE ${marker} -->`);
  html = html.replace(
    /(<!--\s*COOKIEBITE:REPORT-SCRIPT\s*-->)[\s\S]*?(<!--\s*\/COOKIEBITE:REPORT-SCRIPT\s*-->)/,
    `$1\n<script>\n${script}\n</script>\n$2`,
  );
  if (extraBody) html = html.replace('</main>', `${extraBody}\n</main>`);
  const p = path.join(work, `report-${seq += 1}.html`);
  writeFileSync(p, html);
  return p;
}
const CHART_TABLE_BODY = '<div id="c" style="height:200px"></div><table id="t"><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
const CHART_CALL = "CB.chart('#c',{ariaLabel:'x',data:{columns:['a'],rows:[[1]]},option:{}});";
const TABLE_CALL = "CB.sortable('#t',{numericColumns:[0]});";

test('reading is the default scaffold and carries no libraries or behavior', () => {
  const out = path.join(work, 'reading.html');
  const r = scaffold([out]);
  assert.equal(r.status, 0, r.stderr);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /<!--\s*COOKIEBITE:USE\s*-->/);
  assert.match(html, /cookiebite-core\.css/);
  assert.match(html, /cookiebite-core\.js/);
  assert.match(html, /<main>/);
  assert.doesNotMatch(html, /echarts|tailwindcss/i);
  assert.doesNotMatch(html, /assets\/cookiebite\.js/); // not the monolithic runtime
});

test('legacy types still render from the frozen compatibility template', () => {
  for (const type of ['dashboard', 'review', 'postmortem', 'explainer', 'comparison']) {
    const out = path.join(work, `${type}.html`);
    const r = scaffold([type, out]);
    assert.equal(r.status, 0, `${type}: ${r.stderr}`);
    const html = readFileSync(out, 'utf8');
    assert.match(html, /assets\/cookiebite\.(css|js)/, `${type} keeps the monolithic placeholders`);
    assert.doesNotMatch(html, /cookiebite-core\.js/, `${type} is not the core runtime`);
  }
});

test('assembling a chart+table report inlines only the declared deps', () => {
  const report = makeReport('chart table', `${CHART_CALL}\n${TABLE_CALL}`, CHART_TABLE_BODY);
  const r = assemble(report);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.html, /id="cookiebite-core-js"/);
  assert.match(r.html, /id="cookiebite-module-chart"/);
  assert.match(r.html, /id="cookiebite-module-table"/);
  assert.match(r.html, /echarts@5\.5\.1/); // chart pulls ECharts
  const summary = JSON.parse(r.html.match(/id="cookiebite-dependency-summary">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(summary.includedModules.sort(), ['chart', 'table']);
  assert.deepEqual(summary.externalResources, ['echarts']);
});

test('a pure reading report assembles with no modules and no ECharts', () => {
  const report = makeReport('', '', '');
  const r = assemble(report);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.html, /id="cookiebite-module-/);
  assert.doesNotMatch(r.html, /echarts@/);
  const summary = JSON.parse(r.html.match(/id="cookiebite-dependency-summary">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(summary.declared, []);
});

test('a declared dark seed compiles to a data-theme-scoped token block', () => {
  let html = readFileSync(path.join(root, 'assets/template.html'), 'utf8');
  html = html.replace(/"surface":"border"\}/, '"surface":"border"},"dark":{"background":"#1A1A1A","text":"#F5F5F4"}');
  html = html.replace(/<!--\s*COOKIEBITE:USE\s*-->/, '<!-- COOKIEBITE:USE -->');
  const p = path.join(work, `dark-${seq += 1}.html`);
  writeFileSync(p, html);
  const r = assemble(p);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.html, /:root\s*\{/); // light tokens
  assert.match(r.html, /:root\[data-theme="dark"\]\s*\{/); // dark tokens scoped
  assert.match(r.html, /--cb-background:\s*#1A1A1A/i); // authored dark background present
});

test('a direct undeclared call fails before any output is written', () => {
  const report = makeReport('chart', TABLE_CALL, CHART_TABLE_BODY); // calls sortable, declares only chart
  const r = assemble(report);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /table/);
  assert.match(r.stderr, /marker/i);
});

test('unknown capabilities and compat mixing are rejected', () => {
  const unknown = assemble(makeReport('chart bogus', CHART_CALL, CHART_TABLE_BODY));
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /unknown capabilit/i);

  const mixed = assemble(makeReport('compat chart', CHART_CALL, CHART_TABLE_BODY));
  assert.equal(mixed.status, 2);
  assert.match(mixed.stderr, /compat/i);
});

test('a declared-but-unused capability is a warning, not a failure', () => {
  const report = makeReport('chart table', CHART_CALL, CHART_TABLE_BODY); // declares table, never calls it
  const r = assemble(report);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /table.*never called|never called.*table/i);
});

test('inline.sh routes a core report to the assembler', () => {
  const report = makeReport('table', TABLE_CALL, CHART_TABLE_BODY);
  const out = path.join(work, 'inlined-core.html');
  const r = spawnSync('bash', [INLINE, report, '-o', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /id="cookiebite-core-js"/);
  assert.match(html, /id="cookiebite-module-table"/);
});
