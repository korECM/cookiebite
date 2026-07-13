// build-core-fixture.mjs — generate the clean core release fixture: a reading
// report with a chart and a sortable table, assembled to a self-contained file.
// The verifier runs against this to prove a correct freeform report passes.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'evals/fixtures/verifier');
mkdirSync(outDir, { recursive: true });

const SECTIONS = `<section aria-labelledby="s1"><h2 id="s1">허용 요청은 오전 9시 이후 늘었다</h2>
<p>차트는 주장 하나를 뒷받침하고, 표는 같은 수치를 정렬 가능한 형태로 제공한다.</p>
<figure><div id="traffic" style="height:260px"></div><figcaption>시간대별 허용 요청</figcaption></figure>
<table id="traffic-table"><caption>시간대별 허용 요청</caption>
<thead><tr><th scope="col">시간</th><th scope="col">요청</th></tr></thead>
<tbody><tr><td>10:00</td><td>208</td></tr><tr><td>09:00</td><td>124</td></tr><tr><td>11:00</td><td>186</td></tr></tbody></table></section>`;

const SCRIPT = `<script>
CB.chart('#traffic', { ariaLabel: '시간대별 허용 요청 수',
  data: { columns: ['시간','요청'], rows: [['10:00',208],['09:00',124],['11:00',186]] },
  option: ({ theme }) => ({ xAxis:{type:'category',data:['10:00','09:00','11:00']}, yAxis:{type:'value',min:0},
    series:[{type:'bar',data:[208,124,186],itemStyle:{color:theme.accent}}] }) });
CB.sortable('#traffic-table', { numericColumns: [1] });
</script>`;

let html = readFileSync(path.join(root, 'assets/template.html'), 'utf8');
// Declare a dark seed (a DOCUMENT-level sibling of seed) so the release fixture also
// exercises the verifier's dark pass.
html = html.replace(/"surface":"border"\}/, '"surface":"border"},"dark":{"background":"#1A1A1A","text":"#F5F5F4"}');
html = html.replace(/<!--\s*COOKIEBITE:USE\s*-->/, '<!-- COOKIEBITE:USE chart table -->');
html = html.replace(/(<!--\s*COOKIEBITE:SECTIONS\s*-->)[\s\S]*?(<!--\s*\/COOKIEBITE:SECTIONS\s*-->)/, `$1\n${SECTIONS}\n$2`);
html = html.replace(/(<!--\s*COOKIEBITE:REPORT-SCRIPT\s*-->)[\s\S]*?(<!--\s*\/COOKIEBITE:REPORT-SCRIPT\s*-->)/, `$1\n${SCRIPT}\n$2`);

const src = path.join(outDir, 'clean.src.html');
const out = path.join(outDir, 'clean.html');
writeFileSync(src, html);
const r = spawnSync('node', [path.join(root, 'scripts/assemble-report.mjs'), src, '-o', out], { encoding: 'utf8' });
process.stderr.write(r.stderr || '');
if (r.status !== 0) process.exit(r.status);
process.stderr.write(`built clean fixture -> ${out}\n`);
