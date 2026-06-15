# Interaction patterns (copy-adapt these)

Reports get better when the reader can *explore* instead of just scroll. These are
proven, lightweight patterns that work in a single self-contained file. Reach for
them by default — a good data report should have several. Keep them tasteful: every
interaction should help the reader find or compare something, keeping the report's restraint.

Theme everything with the accent CSS vars (`--accent`, `--accent-strong`,
`--accent-weak`) and neutral tokens so interactions stay on-theme.

## 1. Filter / segment controls (Alpine.js)
Let the reader slice the data. A row of toggle chips that filter cards, table rows,
or re-feed a chart. Great for "by PSP", "by status", "by period".

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
<div x-data="{ seg:'all' }">
  <div class="flex gap-8">
    <template x-for="s in ['all','stripe','paypal','toss']">
      <button @click="seg=s"
        :class="seg===s ? 'bg-accent text-accent-on' : 'bg-disabled-bg text-secondary'"
        class="px-12 py-6 rounded-small text-body-14" x-text="s"></button>
    </template>
  </div>
  <!-- rows react: -->
  <tr x-show="seg==='all' || seg==='stripe'">…</tr>
</div>
```
Re-theme a chart on filter change by calling `chart.setOption({...})` inside an
`x-effect` or a `@click` handler.

## 2. Toggle the metric / view a chart shows
A small switch that flips a chart between, e.g., 금액 ↔ 건수, 누적 ↔ 일별, 절대값 ↔
증감률. One chart, many questions answered.

```html
<div x-data="{ mode:'amount', render(){ chart.setOption({ series:[{ data: this.mode==='amount'?amt:cnt }] }) } }"
     x-init="$watch('mode', () => render())">
  <button @click="mode='amount'">금액</button>
  <button @click="mode='count'">건수</button>
</div>
```

## 3. ECharts built-in interactivity (free, high-value)
ECharts ships interactions you should turn ON rather than build:
- **Legend toggle**: `legend:{}` lets readers click series on/off.
- **dataZoom (REQUIRED for any wide / time-series chart)**: a line or bar over a time
  axis or many categories MUST be zoomable and pannable, or the reader is stuck with
  whatever window you chose. Add both a slider and inside (wheel/drag) zoom:
  ```js
  dataZoom:[{type:'inside'}, {type:'slider', height:18, bottom:6}],
  grid:{ bottom:48 }  // leave room for the slider
  ```
  Default the window to the interesting range, but let them widen/narrow it.
- **tooltip axis pointer**: `tooltip:{trigger:'axis', axisPointer:{type:'shadow'}}`.
- **brush/select**: `brush:{}` for range selection on scatter/bar.
- **Cross-filter (connect)**: give charts the same `group` and call
  `echarts.connect('g')` so hovering/zooming one syncs the others.
- **Drilldown**: listen to clicks and swap data:
  ```js
  chart.on('click', p => chart.setOption(detailOptionFor(p.name)));
  ```
Always `chart.resize()` on `window.resize`.

## 4. Sortable / searchable table (Grid.js)
For any table with >8 rows, make it sortable + searchable so the reader can rank by
the column they care about. Three things decide whether it actually *reads* well:

- **Paginate only when the data overflows.** Grid.js renders the pager even for a single
  page, so a 7-row table ends up with a useless "1–7 / 7 · ‹ 1 ›" strip under it. Turn
  pagination **off** unless the data clearly outruns the screen (say >15 rows); when you
  do paginate, set the limit near a full screen, not 8.
- **Right-align numeric columns — header and cells together.** Grid.js left-aligns
  everything by default, so figures don't line up and the header drifts away from its
  numbers. Right-align the numeric columns *and* their headers, with tabular figures.
- **Keep inline-bar / share columns compact.** A bar + "%" belongs in one fixed-width
  cell aligned the same way as its header — never a right-aligned header stranded over
  left-aligned bars.

```html
<link rel="stylesheet" href="https://unpkg.com/gridjs/dist/theme/mermaid.min.css">
<script src="https://unpkg.com/gridjs/dist/gridjs.umd.js"></script>
<div id="tbl"></div>
<style>
  /* right-align the numeric columns (here: 2nd + 3rd) — header AND cells */
  #tbl .gridjs-th:nth-child(n+2), #tbl .gridjs-td:nth-child(n+2){
    text-align:right; font-variant-numeric:tabular-nums;
  }
</style>
<script>
  const rows = [['Stripe','98.1%','72,000'], /* … */];
  new gridjs.Grid({
    columns:['PSP', {name:'성공률', sort:true}, {name:'건수', sort:true}],
    data: rows,
    sort:true, search:true,
    pagination: rows.length > 15 ? { limit:15 } : false,   // pager only when it earns it
    className:{ table:'text-body-14' },
  }).render(document.getElementById('tbl'));
</script>
```
Override Grid.js accent via CSS: `.gridjs th{ color:#222 } .gridjs-currentPage{ background:var(--accent) }`.

## 5. Expandable detail rows / accordions (Alpine)
Keep the page scannable; let the reader open the detail they want. Good for action
items, error codes, per-incident notes.

```html
<div x-data="{ open:null }">
  <template x-for="(item,i) in items" :key="i">
    <div class="border-b border-line-weak">
      <button @click="open = open===i ? null : i" class="w-full flex justify-between py-12">
        <span x-text="item.title"></span>
        <span x-text="open===i ? '−' : '+'"></span>
      </button>
      <div x-show="open===i" x-collapse class="pb-12 text-secondary" x-text="item.detail"></div>
    </div>
  </template>
</div>
```
(Add the collapse plugin: `https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3/dist/cdn.min.js`.)

## 6. Tabbed sections
For peer views at the same level (per-region, per-quarter, per-service). The active
tab uses the accent underline/fill. Alpine `x-data="{ tab:'a' }"` with
`:class` on triggers and `x-show` on panels.

**A chart inside an initially-hidden tab renders BLANK unless you handle it.** ECharts
(and Chart.js) measure their container at init time; if the container is `display:none`
(an inactive tab, a collapsed accordion, the "table view" side of a toggle), the chart
inits at 0×0 and stays blank when shown. This is the #1 cause of an empty chart box.
Two safe fixes:
- **Init lazily on first show** — only create the chart the first time its tab becomes
  active, then `resize()`:
  ```js
  let nrrChart;
  function showTab(name){
    if (name === 'nrr' && !nrrChart){
      nrrChart = echarts.init(document.getElementById('nrrChart'));
      nrrChart.setOption(nrrOption);
    }
    nrrChart && requestAnimationFrame(() => nrrChart.resize());
  }
  ```
- Or **keep panels in the DOM with `visibility`/offscreen instead of `display:none`** so
  they always have a size, and `resize()` every chart on tab change.
Either way: after any tab/accordion/toggle that reveals a chart, call `chart.resize()`
on the next frame. Verify by actually clicking each tab in the visual self-check.

## 7. Animated reveal on scroll (AOS) + count-up hero numbers
Use sparingly to pace a long report and land the headline figure.
```html
<span data-aos="fade-up" class="headline-36 text-accent" id="hero">0</span>
<script>new CountUp('hero', 2418).start(); AOS.init({once:true, duration:600});</script>
```

## 8. Scenario / what-if slider (Alpine)
When the report has a model (projection, break-even, refund rate impact), a range
slider that recomputes a number/chart live makes the report genuinely useful.
```html
<div x-data="{ rate:3, get projected(){ return (this.rate*1.4).toFixed(1) } }">
  <input type="range" min="0" max="10" step="0.1" x-model="rate" class="accent-accent w-full">
  <p>예상 환불액 영향: <b x-text="projected"></b>%</p>
</div>
```

## 9. Sticky section nav / progress
For long reports, a sticky top bar or side rail that highlights the current section
(IntersectionObserver) helps orientation. Keep it quiet (Gray text, accent on active).

## 10. Chart data-table toggle (accessibility + exact values)
A canvas/SVG chart is invisible to screen readers and hides exact figures. Offer a
"표로 보기" toggle that reveals the same data as a real `<table>` — it doubles as the
accessible alternative and lets any reader read precise numbers. Pair every chart
with one.
```html
<div x-data="{ table:false }">
  <div class="flex justify-end mb-8">
    <button @click="table=!table" class="text-caption-12 text-secondary hover:text-primary"
      :aria-pressed="table" x-text="table ? '차트로 보기' : '표로 보기'"></button>
  </div>
  <div x-show="!table"><div id="myChart" class="h-72" style="height:300px"></div></div>
  <div x-show="table" x-cloak>
    <table class="w-full text-body-14 nums"><caption class="sr-only">일별 매출</caption>
      <thead><tr><th class="text-left">요일</th><th class="text-right">매출(백만)</th></tr></thead>
      <tbody><!-- same data the chart plots --></tbody>
    </table>
  </div>
</div>
```
Also give the chart container an `aria-label` summarizing what it shows, so the page
is meaningful without sight of the canvas.

## 11. Glossary tooltips (define jargon inline)
When a report mixes a technical topic with a non-expert audience, mark technical
terms with a dotted underline and reveal a plain-language definition on hover/focus.
The reader who knows the term ignores it; the one who doesn't gets help without you
dumbing the whole report down. Great for postmortems, security/architecture write-ups,
and anything execs + engineers both read.

Use Tippy.js (tiny, handles edge positioning so the bubble never clips off-screen):
```html
<link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css">
<script src="https://unpkg.com/@popperjs/core@2"></script>
<script src="https://unpkg.com/tippy.js@6"></script>
<style>
  .gloss{ border-bottom:1px dashed var(--accent); color:var(--accent-strong); cursor:help; text-underline-offset:3px; }
  /* theme the tooltip to the report (dark surface, readable) */
  .tippy-box[data-theme~='report']{ background:var(--c-primary); color:#fff; border-radius:12px; font-size:13px; line-height:1.5; }
  .tippy-box[data-theme~='report'] .tippy-content{ padding:10px 12px; }
  .tippy-box[data-theme~='report'] .tippy-arrow{ color:var(--c-primary); }
</style>

<!-- mark a term (focusable + labelled for keyboard/screen-reader users) -->
<span class="gloss" tabindex="0" role="button"
      data-tippy-content="CSRF (Cross-Site Request Forgery) tricks your browser into making requests to a site you're logged into. A CSRF token prevents it by requiring a secret only the real site knows.">CSRF</span>

<script>
  tippy('.gloss', { theme:'report', maxWidth:300, allowHTML:false, trigger:'mouseenter focus' });
</script>
```

**Define-once auto-linker** (scales better — keep definitions in one map, tag the
regions to scan with `data-glossary`, and it wraps the first occurrence of each term):
```html
<div data-glossary> …report prose mentioning CSRF and idempotency… </div>
<script>
  const GLOSSARY = {
    "CSRF": "CSRF (Cross-Site Request Forgery) tricks your browser into requests to a site you're logged into; a token prevents it.",
    "idempotency": "Doing the same operation twice has the same effect as once — so a retried payment can't double-charge.",
  };
  const terms = Object.keys(GLOSSARY).sort((a,b)=>b.length-a.length);
  document.querySelectorAll('[data-glossary]').forEach(scope => {
    terms.forEach(term => {
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        if (node.parentElement.closest('.gloss')) continue;     // don't double-wrap
        const i = node.nodeValue.indexOf(term);
        if (i < 0) continue;
        const span = document.createElement('span');
        span.className = 'gloss'; span.tabIndex = 0; span.setAttribute('role','button');
        span.dataset.tippyContent = GLOSSARY[term]; span.textContent = term;
        const after = node.splitText(i); after.nodeValue = after.nodeValue.slice(term.length);
        node.parentNode.insertBefore(span, after);
        break;                                                   // first occurrence only
      }
    });
  });
  tippy('.gloss', { theme:'report', maxWidth:300, trigger:'mouseenter focus' });
</script>
```

**Restraint**: tag a term once (first mention), not every occurrence; only tag genuine
jargon, not common words; keep definitions one or two plain sentences. Over-tagging
turns the page into a minefield of dotted underlines.

## 12. Side-by-side comparison (lay options next to each other)
When the report's job is to help someone choose — three approaches, four vendors, two
plans — put the options in columns next to each other instead of three paragraphs the
reader has to hold in their head. Aligned rows let the eye scan one attribute across
all options. End with a recommendation so the page takes a position.
```html
<style>
  .compare{ display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:16px; }
  @media (max-width:760px){ .compare{ grid-template-columns:1fr; } }
</style>
<div class="compare">
  <!-- one card per option; keep the same rows in the same order in each -->
  <div class="bg-surface border border-line-weak rounded-medium p-20 ring-2 ring-accent"><!-- recommended: ring it -->
    <h3 class="text-title-20 font-bold">Option A</h3>
    <span class="text-caption-12 text-accent font-semibold">Recommended</span>
    <dl class="mt-12 space-y-8 text-body-14">
      <div><dt class="text-secondary">Effort</dt><dd>2 days</dd></div>
      <div><dt class="text-secondary">Risk</dt><dd><span class="text-positive">Low</span></dd></div>
      <!-- same <dt> rows in every column so they line up -->
    </dl>
  </div>
  <!-- Option B, Option C … -->
</div>
<div class="mt-16 bg-accent-weak rounded-medium p-16 text-body-14">
  <b>Pick A</b> unless you need X — then B. C only if Y.
</div>
```
Keep every column's rows in the same order; color the trade-offs with semantic tokens
(green/amber/red) so the comparison is scannable, not just readable.

## 13. Export the state (always end an editable artifact with a way out)
If the report lets the reader *do* something — reorder, filter to a selection, toggle,
edit — give them a button that turns what they did back into something they can paste
or commit: markdown, JSON, or CSV. An interactive page with no way to get the result
out is a dead end. (This is exactly what the theme studio's "Copy CSS / Download
theme.json" does.)
```html
<button id="copyBtn" class="px-12 py-8 rounded-small bg-accent text-accent-on text-body-14">Copy as markdown</button>
<script>
  function buildMarkdown(){ /* read current UI state -> return a string */ return '...'; }
  const btn = document.getElementById('copyBtn');
  btn.addEventListener('click', () => {
    const text = buildMarkdown();
    const flash = () => { btn.textContent = 'Copied ✓'; setTimeout(()=>btn.textContent='Copy as markdown', 1200); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(flash, flash);
    else { const ta=document.createElement('textarea'); ta.value=text; document.body.append(ta); ta.select(); try{document.execCommand('copy')}catch(e){} ta.remove(); flash(); }
  });
</script>
```
For a file instead of the clipboard, build a `Blob` and click a temporary `<a download>`
(see the studio's `Download theme.json`). Match the export format to the destination:
markdown to paste into a doc or back to the agent, CSV for a spreadsheet, JSON to re-load.

## How much is enough?
- A **data dashboard**: aim for filters/segment toggle + at least one chart with
  legend/zoom/drilldown + a sortable table. The reader should be able to answer a
  question you didn't pre-chart.
- A **narrative report** (postmortem, recap): an interactive timeline (hover/click
  for detail), expandable action items/causes, and tabbed or filtered sections.
- Don't bolt on interactions that have nothing to explore. A 3-number summary
  doesn't need a data grid. Match the interactivity to the data's depth.
