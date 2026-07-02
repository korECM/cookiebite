# Section recipes — copy-paste into the slots

A library of small, correct, on-theme section recipes. Paste a block's **markup** into the
`COOKIEBITE:SECTIONS` slot and its **script** into `COOKIEBITE:REPORT-SCRIPT` (inside the
`DOMContentLoaded` handler, where `var CB = window.COOKIEBITE;` is already in scope).

Two ways in:
- **A whole report** — `bash scripts/scaffold.sh <type> my-report.html` writes the matching
  TYPE skeleton straight into the slots (types: `dashboard review postmortem explainer
  comparison`). Then surgical-edit. This file is the same recipes, for hand-assembling or
  mixing types.
- **One section** — copy a standalone snippet below into an existing report.

Field-by-field input shapes for every helper live in `helpers.md`; this file is the
ready-to-paste shapes. A section's `id` ↔ its script block are paired by id string — delete
one, delete the other (template's lockstep rule).

---

## Type skeletons

### dashboard — `kpis` + filtered `chart` + `table`

```html
<section id="summary" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="gauge" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Key metrics</h2>
  </div>
  <div id="kpiGrid"></div>
</section>

<section id="trend" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="trending-up" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Trend</h2>
  </div>
  <div id="trendFilter" class="flex flex-wrap gap-8 mb-16">
    <button data-value="rev" class="px-12 py-6 rounded-small border border-line text-body-14">Revenue</button>
    <button data-value="orders" class="px-12 py-6 rounded-small border border-line text-body-14">Orders</button>
  </div>
  <div id="trendChart"></div>
</section>

<section id="detail" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="table-2" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Breakdown</h2>
  </div>
  <div id="detailTable"></div>
</section>
```

```js
CB.kpis('#kpiGrid', [
  { label: 'Revenue', value: 124000, prefix: '$',
    delta: { dir: 'up', text: '+9.7%', tone: 'success' },
    spark: [101, 108, 105, 112, 118, 121, 124] },
  { label: 'Orders', value: 3820, delta: { dir: 'up', text: '+4.1%', tone: 'success' } },
  { label: 'Success rate', value: 97.1, suffix: '%', delta: { dir: 'up', text: '+0.7%p', tone: 'success' } },
  { label: 'Open issues', value: 12, delta: null },
]);

var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var data = { rev: [101, 108, 105, 112, 118, 121, 124], orders: [520, 545, 530, 580, 610, 600, 635] };
function opt(key) {
  return { xAxis: { type: 'category', data: days }, yAxis: { type: 'value' },
    series: [{ type: 'bar', data: data[key], barWidth: '48%',
      itemStyle: { color: CB.theme.ACCENT, borderRadius: [4, 4, 0, 0] } }] };
}
var chart = CB.chart('#trendChart', { ariaLabel: 'trend', option: opt('rev'),
  table: { columns: ['Day', 'Value'], rows: days.map(function (d, i) { return [d, data.rev[i]]; }) } });
CB.connectFilter('#trendFilter button', function (v) { chart.__cbUpdate(opt(v)); });

CB.table('#detailTable', {
  columns: ['Channel', 'Value', 'Status'], numericCols: [1], statusCol: 2,
  rows: [
    ['Channel A', 72000, { label: 'OK', tone: 'success' }],
    ['Channel B', 31500, { label: 'OK', tone: 'success' }],
    ['Channel C', 9402, { label: 'Watch', tone: 'warning' }],
  ],
});
```

### review — `findings` + `diff`/`code` + `actionItems`

```html
<section id="findings" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="list-checks" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Findings</h2>
  </div>
  <div id="findingsList"></div>
</section>

<section id="change" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="file-diff" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Key change</h2>
  </div>
  <div id="changeDiff"></div>
</section>

<section id="actions" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="check-square" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Action items</h2>
  </div>
  <div id="actionList"></div>
</section>
```

```js
CB.findings('#findingsList', [
  { tone: 'critical', title: 'Retry path can double-charge (no idempotency key)', where: 'refund.ts:42' },
  { tone: 'warning', title: 'Card channel success rate below threshold', where: 'psp/card.ts:118' },
  { tone: 'info', title: 'Weekend traffic 1.4× weekday — confirm autoscale headroom' },
], { filter: true });

CB.diff('#changeDiff', {
  filename: 'refund.ts', lang: 'ts', startOld: 40, startNew: 40,
  lines: [
    { type: 'ctx', text: 'async function refund(req) {' },
    { type: 'del', text: '  return psp.refund(req.amount);' },
    { type: 'add', text: '  const key = idempotencyKey(req);' },
    { type: 'add', text: '  return psp.refund(req.amount, { key });' },
    { type: 'ctx', text: '}' },
  ],
});
// For a full source card instead of a +/- diff, use CB.code (see standalone snippet below).

CB.actionItems('#actionList', [
  { title: 'Add idempotency key to refund path', owner: 'alice', priority: 'P0' },
  { title: 'Backfill the card-channel alert threshold', owner: 'bob', priority: 'P1' },
], { copy: true });
```

### postmortem — `takeaway` + `timeline` + `findings` + `mermaid`

```html
<section id="summary" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="flag" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Summary</h2>
  </div>
  <div id="summaryBox"></div>
</section>

<section id="timeline" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="clock" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Timeline</h2>
  </div>
  <div id="incidentTimeline"></div>
</section>

<section id="cause" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="git-branch" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Root cause</h2>
  </div>
  <div id="causeFlow"></div>
</section>

<section id="findings" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="list-checks" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Action items</h2>
  </div>
  <div id="findingsList"></div>
</section>
```

```js
document.getElementById('summaryBox').innerHTML = CB.takeaway([
  { tone: 'critical', text: '33-minute payment latency spike (p95 1.2s → 4.8s)' },
  { tone: 'warning', text: 'PSP connection pool exhausted under retry storm' },
  { tone: 'success', text: 'Resolved by raising the pool + adding backoff' },
], { title: 'Summary' });

CB.timeline('#incidentTimeline', [
  { t: '14:02', kind: 'start', title: 'Latency alert fired', sub: 'p95 1.2s → 4.8s' },
  { t: '14:09', kind: 'cause', title: 'PSP connection pool exhausted', detail: 'Retry storm blocked the pool; new requests queued.' },
  { t: '14:21', kind: 'action', title: 'Raised pool + added backoff', detail: 'Pool 50→120, exponential backoff cap added.' },
  { t: '14:35', kind: 'resolved', title: 'p95 back to normal', sub: '4.8s → 0.9s' },
]);

CB.mermaid('#causeFlow',
  'flowchart LR\n' +
  '  A["Retry storm"] --> B["Pool exhausted"]\n' +
  '  B --> C["Requests queue"]\n' +
  '  C --> D["p95 latency spike"]');

CB.findings('#findingsList', [
  { tone: 'critical', title: 'Add a circuit breaker on the PSP client', where: 'psp/client.ts' },
  { tone: 'warning', title: 'Alert on pool saturation, not just latency' },
  { tone: 'info', title: 'Document the retry/backoff policy' },
], { filter: true });
```

### explainer — `takeaway` + `mermaid` + `codeTabs` + `glossary`

```html
<section id="tldr" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="sparkles" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">TL;DR</h2>
  </div>
  <div id="tldrBox"></div>
</section>

<section id="flow" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="git-branch" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">How it flows</h2>
  </div>
  <div id="flowDiagram"></div>
</section>

<section id="code" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="code" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">In code</h2>
  </div>
  <div id="codeTabs"></div>
</section>

<section id="terms" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="book-open" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Terms</h2>
  </div>
  <!-- write NORMAL prose — the glossary linker finds each term's first occurrence here.
       Do NOT pre-wrap terms in <span class="gloss"> (that suppresses the tooltip). -->
  <p class="prose-measure text-body-16 text-secondary">An access token is exchanged at the
    token endpoint; the idempotency key makes a retried request safe.</p>
</section>
```

```js
document.getElementById('tldrBox').innerHTML = CB.takeaway([
  'The client exchanges a code for a token at the token endpoint',
  'Each request carries an idempotency key so retries are safe',
  { html: 'Full spec in <a href="#code">the code below</a>' },
], { title: 'In one minute' });

CB.mermaid('#flowDiagram',
  'flowchart LR\n' +
  '  A["Client"] -->|code| B["Token endpoint"]\n' +
  '  B -->|access token| A\n' +
  '  A -->|token| C["API"]');

CB.codeTabs('#codeTabs', [
  { label: 'JavaScript', lang: 'javascript', filename: 'exchange.js',
    code: 'const res = await fetch(tokenUrl, {\n  method: \'POST\',\n  body: JSON.stringify({ code }),\n});\nconst { access_token } = await res.json();' },
  { label: 'Python', lang: 'python', filename: 'exchange.py',
    code: 'res = requests.post(token_url, json={"code": code})\naccess_token = res.json()["access_token"]' },
]);

CB.glossary({
  'access token': 'A short-lived credential the client sends to call the API.',
  'idempotency key': 'A unique key that makes a retried request apply only once.',
});
```

### comparison — `compare` + `pill` + `callout`

```html
<section id="grid" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="columns-3" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Comparison</h2>
  </div>
  <div id="compareGrid"></div>
</section>

<section id="notes" class="scroll-mt-24 mb-56">
  <div class="flex items-center gap-8 mb-20">
    <i data-lucide="info" class="w-20 h-20 text-accent"></i>
    <h2 class="text-title-24 font-bold">Notes</h2>
  </div>
  <div id="noteCallout"></div>
</section>
```

```js
CB.compare('#compareGrid', {
  rows: ['Effort', 'Risk', 'Cost', 'Reversible'],
  options: [
    { name: 'Option A', recommended: true,
      note: 'Cap the statistical cutoff at a fixed ceiling — minimal change to today’s logic.',
      values: [
      { label: 'Low', tone: 'success' },
      { label: 'Low', tone: 'success' },
      '$',
      { label: 'Yes', tone: 'success' },
    ] },
    { name: 'Option B',
      note: 'Drop the statistical model for absolute per-pattern thresholds — simple, but blind to shifts.',
      values: [
      { label: 'High', tone: 'critical' },
      { label: 'Med', tone: 'warning' },
      '$$$',
      { label: 'No', tone: 'critical' },
    ] },
  ],
  recommendation: '<b>Option A</b> wins on effort and reversibility for the same outcome.',
});

document.getElementById('noteCallout').innerHTML =
  CB.callout('Re-evaluate once traffic doubles — Option B may win at scale.',
    { tone: 'info', title: 'Note.' });
```

The per-option `note` carries the free-form "here's the approach" line that doesn't fit
the shared `rows` axes (`helpers.md` — CB.compare). Give every option one (similar length)
or none, so the attribute rows still line up across columns.

### comparison table — a `Δ` / ratio column, outlier flagged with a pill

When you compare two series in a **table** (A vs B across several metrics), don't make the
reader divide in their head — add a dedicated **ratio / difference** column, and flag the
divergent row with a tone **pill** (`statusCol`) instead of a bare number. (Grid.js has no
whole-row tint, so tone the ratio *cell* — it's the number that carries the point anyway.)

```js
CB.table('#gapTable', {
  columns: ['Metric', 'CRG', 'CK', { name: 'Gap', sort: true }],
  numericCols: [1, 2],           // raw Numbers -> right-aligned + thousands grouping
  statusCol: 3,                  // the Gap cell is a { label, tone } pill
  rows: [
    ['IP cutoff (median)', 1735, 42.5, { label: '41×', tone: 'critical' }],
    ['semi_device cutoff', 253,  5,    { label: '51×', tone: 'critical' }],
    ['anonymous cutoff',   128,  5,    { label: '26×', tone: 'warning'  }],
  ],
});
```
The ratio column + the tone pill together are the comparison idiom: the reader sees the
raw values, the computed gap, and *which* gaps are alarming — in one row. Pair it with the
shared-y-axis rule for paired charts (`craft.md`): the table quantifies the gap, the chart
shows its shape.

---

## Standalone snippets

Drop-in fragments for an existing report. Each is markup + (optional) script.

### A KPI row — `CB.kpis`

```html
<div id="kpiGrid"></div>
```
```js
CB.kpis('#kpiGrid', [
  { label: 'Revenue', value: 124000, prefix: '$', delta: { dir: 'up', text: '+9.7%', tone: 'success' },
    spark: [101, 108, 105, 112, 118, 121, 124] },
  { label: 'Success rate', value: 97.1, suffix: '%', delta: { dir: 'up', text: '+0.7%p', tone: 'success' } },
  { label: 'Open issues', value: 12, delta: null },   // null = no-baseline "—"; OMIT delta on ALL when none has one
]);
```

### A filtered chart — `CB.connectFilter` driving a captured `CB.chart`

The F10 dashboard-filter pattern with **no `window` global**: close over the captured chart
instance and call `inst.__cbUpdate(option)` inside `onChange` (so the reader's filter
survives a dark re-theme). Chip row is native `button[data-value]`; keep it wrapping.

```html
<div id="segFilter" class="flex flex-wrap gap-8 mb-16">
  <button data-value="rev" class="px-12 py-6 rounded-small border border-line text-body-14">Revenue</button>
  <button data-value="orders" class="px-12 py-6 rounded-small border border-line text-body-14">Orders</button>
</div>
<div id="segChart"></div>
```
```js
var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var data = { rev: [101, 108, 105, 112, 118, 121, 124], orders: [520, 545, 530, 580, 610, 600, 635] };
function opt(key) {
  return { xAxis: { type: 'category', data: days }, yAxis: { type: 'value' },
    series: [{ type: 'bar', data: data[key], barWidth: '48%',
      itemStyle: { color: CB.theme.ACCENT, borderRadius: [4, 4, 0, 0] } }] };
}
var chart = CB.chart('#segChart', { ariaLabel: 'segmented trend', option: opt('rev'),
  table: { columns: ['Day', 'Value'], rows: days.map(function (d, i) { return [d, data.rev[i]]; }) } });
CB.connectFilter('#segFilter button', function (v) { chart.__cbUpdate(opt(v)); });
```

### A severity findings list — `CB.findings`

`tone` doubles as severity (critical→Critical, warning→High, info→Medium, neutral→Low;
success→Note). `filter:true` adds the severity chip row.

```html
<div id="findingsList"></div>
```
```js
CB.findings('#findingsList', [
  { tone: 'critical', title: 'Retry path can double-charge (no idempotency key)', where: 'refund.ts:42', note: 'Retry middleware commits the same request twice' },
  { tone: 'warning', title: 'Card channel success rate below 95% threshold', where: 'psp/card.ts:118' },
  { tone: 'info', title: 'Weekend traffic 1.4× weekday — confirm autoscale headroom' },
], { filter: true });
```

### A mermaid flow — `CB.mermaid`

Themes from CSS vars + re-renders on dark for free. Use `<br/>` (not `\n`) for label line
breaks. Lay a small graph out `LR` so it doesn't upscale oddly next to a wide one.

```html
<div id="flowDiagram"></div>
```
```js
CB.mermaid('#flowDiagram',
  'flowchart LR\n' +
  '  A["Request"] --> B{"Cached?"}\n' +
  '  B -->|yes| C["Serve cache"]\n' +
  '  B -->|no| D["Fetch + store"]\n' +
  '  D --> C');
```

### A compare grid — `CB.compare`

Each cell is `'text'` or `{ label, tone, icon? }` (rendered via `CB.pill`). Mark one option
`recommended: true`; `recommendation` becomes a `CB.callout` below the grid.

```html
<div id="compareGrid"></div>
```
```js
CB.compare('#compareGrid', {
  rows: ['Effort', 'Risk', 'Cost', 'Reversible'],
  options: [
    { name: 'Option A', recommended: true, values: [
      { label: 'Low', tone: 'success' }, { label: 'Low', tone: 'success' }, '$', { label: 'Yes', tone: 'success' } ] },
    { name: 'Option B', values: [
      { label: 'High', tone: 'critical' }, { label: 'Med', tone: 'warning' }, '$$$', { label: 'No', tone: 'critical' } ] },
  ],
  recommendation: '<b>Option A</b> wins on effort and reversibility for the same outcome.',
});
```

### A gauge board — `CB.gaugeGrid`

One `conic-gradient` ring per metric, each against its own `target`/`max`. Pure CSS, dark-aware
with no registration. The SLA / quota / health-board helper.

```html
<div id="slaBoard"></div>
```
```js
CB.gaugeGrid('#slaBoard', [
  { label: 'Uptime', value: 99.95, max: 100, target: 99.9, unit: '%' },
  { label: 'p95 latency', value: 180, max: 500, target: 250, unit: 'ms', tone: 'success' },
  { label: 'Error budget', value: 62, max: 100, unit: '%', tone: 'warning', showMax: true },
  { label: 'Quota used', value: 7400, max: 10000, unit: '', showMax: true },
]);
```

### A source card — `CB.code`

Real syntax highlighting (filename chip + line numbers), themed via the `.hljs` token layer.
Needs the highlight.js tag in `HEAD-LIBS` (ships in the template).

```html
<div id="srcCard"></div>
```
```js
CB.code('#srcCard', {
  filename: 'token-exchange.js', lang: 'javascript',
  code: 'async function exchange(code) {\n  const res = await fetch(tokenUrl, { method: \'POST\', body: JSON.stringify({ code }) });\n  return (await res.json()).access_token;\n}',
});
```

---

See `helpers.md` for every helper's full field reference, `components.md` for the static
markup recipes, and `interactions.md` for worked filter/tab/copy patterns.
