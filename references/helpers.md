# Helper API — input shapes (field reference)

The fast-path helpers (`COOKIEBITE.*`, alias `CB.*`) do ~80% of a report. SKILL.md's
table says what each one **emits**; this file is the other half — the **input** each one
takes, field by field, so you don't have to reverse-engineer the shape from the one demo
or read `cookiebite.js`.

Conventions: `key?` = optional. `a | b` = either form accepted. `target` is a CSS
selector string **or** an element. `tone` is always the five-name scale from
`components.md` (`neutral | info | success | warning | critical`). Helpers that return a
**string** are noted — you concatenate those into `innerHTML`; the rest render into
`target` themselves. Everything re-themes (incl. dark) automatically.

---

## `CB.kpis(target, items, opts?)` — stat / KPI cards

```text
item: {
  label,            // card label (text)
  value,            // number -> CountUp animates it; STRING -> rendered verbatim ("Healthy", "P1")
  prefix?,          // glued before the number, same big size ("₩", "$")
  suffix?,          // glued after the number, same big size ("/wk")
  unit?,            // trailing unit in SMALL secondary style ("억", "%", "ms") — distinct from suffix
  decimals?,        // force decimal places; else inferred from how `value` is written (8.4 -> 1)
  delta?: { dir, text, tone } | null,  // OMIT key = no badge; null = "—" no-baseline sentinel
                    //   dir: 'up' | 'down' | 'flat'   text: "+2.1%p"   tone: success/critical/neutral
  spark?: [n, …],   // array of numbers -> inline sparkline under the number
  note?,            // small secondary caption UNDER the number — for a narrative line
                    //   ('vs 0 baseline') that doesn't fit the short delta token
  gloss?,           // glossary definition string -> wraps the label in a .gloss tooltip term
                    //   (needs the Tippy CDN tags in HEAD-LIBS)
}
opts: {
  cols?,            // '1-2-4' | '1-2-3' | '1-2' | '1-3' | '1'  (omit -> auto by item count)
  decimals?,        // default decimals for all items lacking their own
  animate?,         // false to skip CountUp
  emptyText?,       // text for the empty state when `items` is empty
}
```
`prefix`/`suffix` render at the **big** number size; `unit` renders **small + secondary**.
Omit `delta` entirely when no KPI has a baseline (a row of `—` reads as stray underscores).

## `CB.findings(target, items, opts?)` — severity-coded findings list

```text
item: {
  tone,             // doubles as SEVERITY: critical->"Critical", warning->"High",
                    //   info->"Medium", neutral->"Low" (locale-aware label). `success`
                    //   has no severity rank, so its badge reads "Note" (keeps its green
                    //   tone) — use `label` to override any item's chip text.
  title,            // what's wrong (the scannable headline) — lead with the problem, not a vague noun
  where?,           // file:line / location, rendered monospace
  note?,            // one-line detail after `where`
  label?,           // override the severity chip text (e.g. '주의') for THIS item
}
opts: {
  filter?,          // false to drop the severity chip row (default: shown)
  sort?,            // false to keep author order (default: sorts critical-first)
  sevLabels?,       // {critical,warning,info,neutral} override the badge label set
  chipLabels?,      // override the chip label set (incl. the 'all' key)
}
```
Chips are built from the tones actually present, so a lone `neutral`/Low finding never
becomes unreachable.

## `CB.timeline(target, items, opts?)` — vertical timeline (postmortem/incident)

```text
item: {
  kind,             // step type -> tone via opts.toneMap (start->info, cause->critical,
                    //   action->warning, resolved->success); unknown kinds fall back to neutral
  t,                // the time / step label ("14:02", "Day 3") shown tone-colored above the title
  title,            // step headline
  sub?,             // one-line subtitle under the title
  detail?,          // longer body; collapsed behind a +/- toggle (x-collapse) unless opts.collapse:false
  icon?,            // override the auto tone icon (Lucide name)
}
opts: {
  toneMap?,         // extend/override the kind->tone map, e.g. { deploy:'info' }
  collapse?,        // false to render all details expanded (no toggle)
}
```
Needs the Alpine collapse plugin (loaded before Alpine core — see `libraries.md`).

## `CB.table(target, config)` — Grid.js data table

```text
config: {
  columns,          // [ 'PSP', { name, sort?, formatter? }, … ]  string or Grid.js column def
  rows,             // [ [cell, cell, …], … ]  — pass RAW Numbers in numeric cols, not '72,000' strings
  numericCols?,     // [colIndex, …]  right-align header+cells + tabular-nums; raw numbers get CB.nf grouping
  statusCol?,       // colIndex whose cells are { label, tone, icon? } (or a string) -> rendered via CB.pill
  search?,          // true/false (default: auto — on when >10 rows)
  csv?,             // true -> inject a "CSV" download button of the table rows
}
```
Requires the Grid.js CDN tags in HEAD-LIBS (the runtime does not bundle it).

## `CB.chart(target, config) -> echartsInstance` — themed ECharts wrapper

```text
config: {
  option,           // ALWAYS an author-written ECharts option; merged over CB.baseChart
                    //   (deep-merge objects; series/dataZoom arrays REPLACE wholesale). NEVER a {kind}.
  height?,          // px, default 300
  caption?,         // one-line takeaway above the chart (escaped); captionHtml? for trusted HTML
  ariaLabel?,       // chart container aria-label (do set this)
  table?: { columns:[…], rows:[[…]] },  // data the "표로 보기"/"View as table" toggle reveals
  render?,          // custom render fn (chart) for re-theme; default re-merges `option`
  exportable?,      // true -> inject a PNG download button next to the view-toggle
  exportName?,      // filename stem for the exportable PNG (default: ariaLabel || 'chart')
  tableLabel?,      // override the "표로 보기"/"View as table" button text (locale default else)
  chartLabel?,      // override the "차트로 보기"/"View as chart" button text
  responsive?,      // false -> opt out of the <640px narrow-axis shrink (default on; F19)
}
```
Mutate later via `inst.__cbUpdate(option)` (NOT bare `setOption`) so reader filters
survive a dark toggle. Inside the option use resolved colors (`CB.accentRgba`,
`CB.theme.ACCENT`), never `var(--*)`/`color-mix` (renders black on canvas).

## `CB.compare(target, config)` — comparison / decision grid

```text
config: {
  rows,             // [ 'Effort', 'Risk', … ]  the attribute labels (one column of <dt>)
  options: [ { name, recommended?, values: [ cell, … ] } ],  // values[i] aligns to rows[i]
                    //   cell: 'text'  OR  { label, tone, icon? } (rendered via CB.pill)
  recommendation?,  // trusted HTML -> a CB.callout below the grid
}
```
**Row-major alternative** — instead of `rows:[string]` + per-option `values`, pass
`rows` as objects that carry each row's cells inline (often easier to author so a row's
data stays together):
```text
config: {
  rows: [ { label, cells: [ cell, … ] }, … ],  // cells[j] -> options[j] for this row
  options: [ { name, recommended? }, … ],       // no `values` needed in this shape
  recommendation?,
}
```
The runtime detects this shape (a `rows[0].cells` array), back-fills each option's
`values` from the column, and renders identically. A `cell` is still `'text'` **or**
`{ label, tone, icon? }`.

## `CB.mermaid(target, definition, opts?)` — text -> themed diagram

```text
definition,         // a Mermaid source string (flowchart / sequence / state / ER / gantt)
opts: { }           // reserved; themes from CSS vars and re-renders on dark for free
```
The rendered SVG **scales to fit** its container (intrinsic px width is dropped; the
viewBox preserves the aspect ratio), so a wide sequence diagram shrinks to width instead
of clipping on desktop or vanishing on mobile — the host scrolls horizontally only as a
fallback for a genuinely huge diagram. Keep participant counts and label lengths
reasonable: a 12-actor sequence fits but renders tiny — split it or use a flowchart.

## `CB.pill(label, opts?) -> string` / `CB.callout(html, opts?) -> string`

```text
CB.pill(label, { tone?, icon? })          // icon:null suppresses the auto tone icon
CB.callout(html, { tone?, icon?, title? }) // `html` is trusted; `title` escaped + bolded
```

---

## New helpers (component-coverage additions)

### `CB.takeaway(pointsOrHtml, opts?) -> string` — TL;DR / key-takeaways box

```text
pointsOrHtml,       // array of bullet strings  OR  a raw HTML string
opts: { title? }    // box heading (default a localized "Key takeaways")
```
Returns a prominent summary box: accent-weak surface, accent-strong title. Put it at the
top of an explainer/exec report. Distinct from `CB.callout` by being multi-point and
summary-positioned. See `components.md` (Key-takeaway box) for usage.

### `CB.funnel(target, config)` — themed conversion funnel

```text
config: {
  steps: [ { label, value }, … ],  // ordered; emits step-to-step + overall conversion %
  caption?,         // one-line takeaway
  ariaLabel?,
  emptyText?,
}
```
Single-hue accent ramp; registers for dark. Use for an ordered drop-off (signup ->
activation -> paid). Each slice label carries its step-to-step % with a localized **"vs
prev"** qualifier (so it's not confused with the overall conversion in the subtitle); a
zero top-step value disables conversion % (can't divide by a zero baseline) but still
renders the step values (F46).

### `CB.gauge(target, config)` — CSS progress ring (no chart lib)

```text
config: {
  value,            // current value
  max?,             // default 100
  label?,           // caption UNDER the ring
  unit?,            // small unit after the value ("%")
  target?,          // optional target value -> draws a tick on the ring
  tone?,            // override the fill tone (default: accent)
  size?,            // ring diameter in px (default 160)
  thickness?,       // ring stroke width in px (default 16)
  sub?,             // small secondary line INSIDE the ring, under the value
  showMax?,         // true -> append a faint '/max' affordance after the value, so the
                    //   reader sees the denominator (F47)
  ariaLabel?,       // role="img" label (default auto-built from label/value/target)
  emptyText?,
}
```
Pure `conic-gradient` ring; themes via `var(--accent)` so it's dark-aware with **no**
registration. Reach for it over a chart for a single 0–100 progress/SLO number.

### `CB.heatmap(target, config)` — calendar heatmap

```text
config: {
  data: [ { date:'YYYY-MM-DD', value }, … ],
  caption?,         // captionHtml? for trusted HTML
  ariaLabel?,       // becomes the screen-reader label + data-table caption (do set it)
  max?,             // ramp ceiling (default: max of data)
  range?,           // explicit ECharts calendar range ('2026' | '2026-03' | ['2026-01','2026-06'])
  from?, to?,       // OR pass from/to -> range = [from, to] (F46)
  height?,          // px, default 200
  emptyText?,
}
```
ECharts calendar heatmap, single-hue accent ramp, registers for dark. Use for
daily-activity / contribution-style density. **Auto-range:** with no `range`/`from`/`to`
the calendar spans only the `YYYY-MM` months the data actually covers (so a 3-week window
doesn't draw a full Jan–Dec grid); pass `range` or `from`/`to` to force a fixed span.

### `CB.cardGrid(target, config)` — faceted card grid

```text
config: {
  items: [ { title, body?, tags?:[ 'Q1', 'Backend', … ], meta? }, … ],
  caption?,
}
```
Responsive card grid with a filter chip row built from the **union** of item `tags`. The
chip row wraps/scrolls (never a bare flex row). For survey/roadmap/research collections
that want filtering by 1–2 facets. See `components.md` (Faceted card grid).

### `CB.deltaBadge(text, opts?) -> string` — standalone stat-delta badge

```text
text,               // the delta text ("+2.1%p", "−4")
opts: { dir, tone } // dir: 'up' | 'down' | 'flat'   tone: success | critical | neutral
```
Returns the up/down-arrow tone badge that `CB.kpis` uses internally — for dropping a
delta next to a hand-built number.

### `CB.ramp(n) -> [color × n]` — single-hue sequential ramp

```text
n,                  // number of shades -> n colors of ONE accent hue, light -> dark
```
For **ordered/sequential** data (funnel slices, stacked one-metric series, choropleth).
Re-reads the live accent so it follows dark re-theme. Rule: `CB.categoricalColors(n)` for
**peer** series, `CB.ramp(n)` for **ordered** series. (`categoricalColors` is now a
bounded hue arc around the accent, not the full wheel.)

### `CB.exportPNG(chartSelector, filename?)` — download a chart as PNG

```text
chartSelector,      // selector of a registered CB.chart
filename?,          // default derived from the chart's aria-label
```
Uses ECharts `getDataURL`. Or pass `exportable:true` to `CB.chart` to get the button
auto-injected next to its view-toggle.

CSV download of a table's rows is **not** a standalone helper — pass `csv: true` to
`CB.table(target, { …, csv:true })` and the runtime injects the "CSV" download button
itself. (There is no `CB.csvButton`.)

---

## Interaction / utility helpers (the rest of the public surface)

These ship in the runtime and are referenced from `interactions.md`/`components.md`; their
input shapes, collected here.

### `CB.tabs(target, items, opts?)` — vanilla tab shell (alias `CB.reveal`)

```text
item: {
  id?,              // panel id (default auto)
  label,            // tab button text
  render(panelEl),  // called LAZILY on first show of the panel; build the panel here
}
opts: { }           // reserved
```
The first tab opens by default. Because `render` runs only when a tab is first shown, a
chart created inside it never inits at 0×0 (the empty-hidden-chart footgun) — after the
panel becomes visible the runtime `requestAnimationFrame`s a `resize()`. Keyboard nav +
`aria-selected` are wired for you; re-running on the same target disposes the prior
panels' charts first. See `interactions.md` §6.

### `CB.copyButton(target, label, builderFn, opts?) -> btnEl`

```text
label,              // button text
builderFn,          // () => string  — reads current UI state, returns the text to copy
opts: { className? }// override the default accent-button styling
```
Injects a themed `<button>` into `target` that calls `CB.copy(builderFn(), btn)`, so it
inherits the clipboard fallback + the 'Copied ✓' flash. See `interactions.md` §13.

### `CB.sectionToMarkdown(selector) -> string`

```text
selector,           // a section element / CSS selector
```
Best-effort serializer: a section's headings, paragraphs, lists, and tables → a markdown
string. Pair with `CB.copyButton` to export a static section verbatim. See
`interactions.md` §13.

### `CB.glossary(map, scope?)` — merge terms + run the linker

```text
map,                // { term: 'definition', … } merged into window.GLOSSARY
scope?,             // element / selector to scan (default document)
```
Runs the glossary linker + Tippy within `scope`; works from **inside** a
`DOMContentLoaded` handler (unlike a raw `window.GLOSSARY`, which must be a parse-time
assignment). Idempotent — re-running only links newly-added terms. Needs the Tippy CDN
tags. See `interactions.md` §11.

### `CB.dataTableToggle(chartTarget, config)` — data-table alt for a HAND chart

```text
config: {
  columns,          // [ 'Day', 'Revenue', … ]  table headers
  rows,             // [ [cell, …], … ]  the same data the chart plots
  ariaLabel?,       // table caption (default: the chart's aria-label)
  tableLabel?,      // override the "표로 보기"/"View as table" button text
  chartLabel?,      // override the "차트로 보기"/"View as chart" button text
}
```
Injects the "표로 보기" toggle + table next to a **hand-written** (escape-hatch) chart so
it meets the a11y rule. `CB.chart` does this automatically; reach for this only for a
bespoke chart you built without the wrapper. See `interactions.md` §10.

---

## New components & primitives (F35/F37/F39/F40/F42/F43/F44/F45)

### `CB.shapes.*` — pure ECharts-option builders (F35)

Each returns a plain ECharts `option` object — **pass it to `CB.chart`** (which themes,
registers for dark, and adds the a11y scaffold); they don't render on their own. All read
`CB.theme`/the live accent, so they follow the dark re-theme.

```text
CB.shapes.waterfall({ categories, deltas, total? }) -> option
  categories: string[]   deltas: number[]   (same length)
  total?: true | string  // add a from-zero total bar; string overrides its label
                         //   (default localized '합계'/'Total')
  // transparent-base stacking; accent for + deltas, --c-critical for −.

CB.shapes.bullet({ value, target, ranges?, label?, max? }) -> option
  value, target: number
  ranges?: number[]      // cumulative band TOPS (qualitative bands); default [max]
  label?, max?
  // thin accent value bar over faint-accent bands; target = a primary markLine tick.

CB.shapes.sparkline({ data, area? }) -> option
  data: number[] | [x,y][]
  area?: boolean         // area fill ON by default; area:false drops it
  // axis-less single accent line for inline/table cells; a single point renders one dot.

CB.shapes.scatter({ points }) -> option
  points: [ { x, y, size?, label?, group? }, … ]
  // auto-becomes a BUBBLE chart when any point has size (sqrt scale: symbol AREA ~ size).
  //   accent fill; label+size ride along into the tooltip.
  // group? (aliases: tone/color) — when ANY point carries one, points split into one
  //   series PER category, each a distinct CB.categoricalColors hue, and a legend is
  //   emitted. With no group key the output is byte-for-byte the historical single-accent
  //   series (backward-compatible).

CB.shapes.radar({ indicators, series }) -> option
  indicators: [ { name, max }, … ]
  series:     [ { name, values: number[] }, … ]
  // multi-series colored via CB.categoricalColors; legend shown only when >1 series.
```
Usage: `CB.chart('#c', { ariaLabel:'…', option: CB.shapes.waterfall({…}), table:{…} });`

### `CB.bigNumber(target, config)` — one oversized hero number (F39)

```text
config: {
  value,            // number -> CountUp; a non-numeric STRING renders verbatim
  label?,           // caption under the number
  delta?: { dir, tone, text },  // a CB.deltaBadge beside the number
  caption?,         // small secondary line
  spark?: [n, …],   // inline sparkline (data-spark, hydrated)
  prefix?, suffix?, // glued before/after at the big size
  unit?,            // small trailing unit
  decimals?,
  align?,           // 'center' (default) | 'left'
  emptyText?,       // shown when value is null/''
}
```
The single-stat counterpart to a KPI grid. Reuses `CB.deltaBadge` + `data-spark`;
`disposeIn` before re-rendering.

### `CB.steps(target, items, opts?)` — connected progress stepper (F39)

```text
item: {
  label,
  status,           // 'done' | 'current' | 'pending'
  detail?,          // one-line detail under the label
}
opts: { emptyText? }
```
Horizontal on `sm+`, vertical below. `done`→success dot+check, `current`→accent dot+ring,
`pending`→hollow neutral; an `sr-only` status label per node.

### `CB.leaderboard(target, items, opts?)` — ranked rows with bars (F40)

```text
item: {
  label,
  value,            // number; bar width is value-proportional
  deltaRank?,       // rank change: +N up (positive) / −N down (critical) / 0 dash
  tone?,            // override the bar color (via the GAUGE_FILL tone map)
}
opts: {
  format?,          // (v) => string  for the right-aligned value (default CB.nf)
  max?,             // bar denominator (default: the largest value)
  emptyText?,
}
```
Numbered rows, value-proportional accent bars, right-aligned `tabular-nums` value, optional
rank-change arrow.

### `CB.cellBar` / `CB.cellHeat` / `CB.cellSpark` — Grid.js column formatters (F40)

Each is a **factory** returning a `(cell) => gridjs.html` you attach as a column's
`formatter` in `CB.table`'s `columns`. Non-numeric cells pass through unchanged.

```text
CB.cellBar({ max?=100, format?(v) })   // value-proportional accent bar + formatted number
CB.cellHeat({ max?=100, format?(v) })  // accent-tint chip; opacity scales with magnitude
                                       //   (accentRgba 0.10..0.60)
CB.cellSpark({ width?=80, height?=24 })// cell is a number[] -> a data-spark element wired
                                       //   by CB.table's post-render hydrate
```
```js
CB.table('#t', { columns: [ 'PSP',
  { name:'Trend', formatter: CB.cellBar({ max: 100 }) },
  { name:'Heat',  formatter: CB.cellHeat({ max: 100 }) },
  { name:'7d',    formatter: CB.cellSpark() } ], rows });
```

### i18n: `CB.t`, `CB.locale`, `CB.i18n` (F42)

```text
CB.t(key, fallback?) -> string   // lookup order: REPORT_LOCALE.strings override
                                 //   > active-locale cell > en cell > fallback > key
CB.locale() -> 'ko' | 'en' | 'ja' | …  // active 2-letter prefix from REPORT_LOCALE.number
                                 //   (unknown -> 'en')
CB.i18n                          // the built-in ko/en/ja string table (object keyed by
                                 //   locale prefix); extend it or inspect keys
```
Authors extend strings via `window.REPORT_LOCALE.strings = { key: 'override' }` or by
adding a locale cell to `CB.i18n`. The Japanese myriad bands (`万/億`) in `moneyShort` are
opt-in via `window.REPORT_LOCALE.bigUnits = 'ja'` (or `{ man, eok }`; `true` keeps the
Korean `만/억` byte-identical).

### `CB.diff(target, config)` — escaped diff view (F44)

```text
config: {
  lines: [ { type, text }, … ],  // type: 'add' | 'del' | 'ctx'
  filename?,        // header label
  lang?,            // header lang tag
  startOld?, startNew?,  // starting line numbers for the old/new gutters (default 1)
  emptyText?,
}
```
Renders the `components.md` Diff block: `+`/`−` gutter + dual old/new line numbers; text is
HTML-escaped for you.

### `CB.pseudocode(target, codeOrLines, opts?)` — annotated code block (F44)

```text
codeOrLines,        // a code STRING (split on newlines) OR an array of lines, where a line
                    //   is a string | { text, note?, tone? }
opts: {
  numbers?,         // show the numbered gutter
  title?,           // header label
  emptyText?,
}
```
Escaped annotated-code / pseudocode block (numbered gutter + inline `note`s, tone-colored
outcomes) — the runtime version of the `components.md` pseudocode component.

### `CB.matrix(target, config)` — generic rows×cols heatmap (F44)

```text
config: {
  rows,             // row header labels
  cols,             // column header labels
  data: [ [v, …], … ],  // data[i][j] aligns to rows[i] × cols[j]
  caption?,         // captionHtml? for trusted HTML
  ariaLabel?,       // table caption (do set it)
  max?,             // ramp ceiling (default: max of data)
  format?,          // (v) => string cell text
  emptyText?,
}
```
A single-hue accent-alpha grid-heatmap for cohort / retention / confusion matrices.
(`CB.heatmap` stays calendar-only; reach for `CB.matrix` for any non-calendar grid.)

### `CB.actionItems(target, items, opts?)` — action list w/ copy (F44)

```text
item: {
  title,
  owner?, due?,     // meta line
  priority?,        // pill — the string is shown VERBATIM as the pill label; its TONE is
                    //   mapped (case-insensitively) from: p0/high/critical/urgent->critical,
                    //   p1/med/medium->warning, p2/p3/low->neutral; any other word->neutral
                    //   tone but still rendered as the label. So 'P0', 'High', 'blocker'
                    //   all render; only the first two carry a critical tone.
  body?,            // collapsible <details> body
}
opts: {
  copy?,            // true -> a copy-as-markdown button
  copyLabel?,       // its label
  detailsLabel?,    // the <details> summary label
  emptyText?,
}
```
Priority pill + owner/due meta + collapsible body; optional copy-as-markdown export.

### `CB.search(opts?) -> barEl` — sticky report search (F38)

```text
opts: {
  placeholder?,
  sticky?,          // sticky bar (default on)
  minChars?,        // min chars before filtering
  scroll?,          // scroll to first match
}
```
**Opt-in.** Injects a sticky search bar that filters/dims `[data-searchable]` /
`[data-search-item]` regions with a vanilla `<mark>` highlight. Mark the regions you want
searchable; warns if none are found.

### `CB.densityToggle() -> btnEl` / `CB.permalinks(opts?) -> count` (F45)

```text
CB.densityToggle()           // chrome button flipping html[data-density='compact']
                             //   (CSS layer in cookiebite.css); localStorage-persisted. Opt-in.
CB.permalinks({ scope?, selector? }) -> count
                             // hover '#' anchor on each section[id] heading, copying the
                             //   section URL via CB.copy flash. Opt-in.
```

### `CB.print()` (F37) / `CB.audit() -> findings[]` (F43)

```text
CB.print()   // forces light, expands <details> + tab panels, window.print(), restores on afterprint
CB.audit()   // dev-only DOM audit (chart a11y, color-only tone, img alt, WCAG token
             //   contrast); console.warns + a #cbAuditBadge. Off unless called or ?audit=1.
```

---

## New chart-shape builders (`CB.shapes.*`) + threshold/annotate

These extend the `CB.shapes.*` family above. Each builder returns a plain ECharts
`option` — **pass it to `CB.chart`** (which themes, registers for dark, and adds the
a11y scaffold); they don't render on their own. `CB.threshold`/`CB.annotate` are
**transformers**, not builders — see below. For *which* shape fits *which* data, see
`libraries.md` ("which chart when").

### `CB.shapes.dumbbell(config) -> option` — FROM→TO change per row

```text
config: {
  rows:    [ { label, from, to }, … ],   // one horizontal row per item
  series?: [fromName, toName],           // legend/label names for the two endpoints
  showDelta?,       // true -> tone the Δ label only when it crosses `threshold`
  sortBy?,          // 'delta' | 'to' | null (author order)
  threshold?,       // delta crossing point for showDelta toning (default 0)
}
```
Horizontal two-dot connector per row. Suggested **height ≈ 32px·rows + 64** (e.g.
320–420px). Pair with a four-column table so the toggle shows the numbers:
`table: { columns:[labelHdr, fromName, toName, 'Δ'], rows: rows.map(r=>[r.label, r.from, r.to, r.to-r.from]) }`.
Use for "before vs after" across many items (the per-row companion to `CB.shapes.slope`).

### `CB.shapes.stackedBar(config) -> option` — horizontal composition

```text
config: {
  categories: string[],                  // one bar per category
  series:     [ { name, data:number[] }, … ],  // each adds a stacked segment
  mode?,            // 'stack' (absolute) | 'percent' (100%-normalized)
  horizontal?,      // default true
  peer?,            // false -> CB.ramp tiers (ordered parts); true -> CB.categoricalColors (peer parts)
}
```
**`peer` picks the palette by relationship:** `false` (default) ramps one accent hue
for **ordered** parts (tiers/buckets); `true` uses `categoricalColors` for **peer**
parts (vendors/regions). Height ≈ **36px·categories + legend** (e.g. 280–480px). Table:
`{ columns:['', ...series.map(s=>s.name)], rows: categories.map((c,i)=>[c, ...series.map(s=>s.data[i])]) }`.

### `CB.shapes.histogram(config) -> option` — distribution

```text
config: {
  values: number[],                      // the raw sample
  bins?,            // 'auto' (Freedman-Diaconis, Sturges fallback) | a fixed bin count
  showMean?,        // default true -> a mean markLine
}
```
Vertical frequency histogram; the runtime bins the values for you. Simplest table is the
raw values `{ columns:['value'], rows: values.map(v=>[v]) }` (or table the derived
bin/count pairs). Height ≈ 280–360px. The one shape for "what's the spread/shape" — see
`libraries.md` (distribution → histogram).

### `CB.shapes.rangeDot(config) -> option` — min–max capsule + value dot

```text
config: {
  rows: [ { label, low, high, value, band?:[q1, q3] }, … ],
  unit?,            // appended to value labels
}
```
Per row: a low→high capsule with a current-value dot, plus an optional inner p25–p75
`band`. Height ≈ **30px·rows + 24**. Table:
`{ columns:[labelHdr,'low','high','value'], rows: rows.map(r=>[r.label,r.low,r.high,r.value]) }`.
Use for "where does each item sit in its range" (SLO bands, score ranges).

### `CB.shapes.lollipop(config) -> option` — stem + end-dot ranking

```text
config: {
  rows:     [ { label, value, tone? }, … ],
  baseline?,        // a number -> turns it into a deviation chart (stems from the baseline)
  sort?,            // 'desc' | 'asc' | null (author order)
  horizontal?,      // default true
}
```
A lighter-weight bar: the value label is always present. `baseline` makes it a
deviation chart (above/below a reference). Height ≈ **30px·rows + 24**. Table:
`{ columns:[labelHdr,'value'], rows: rows.map(r=>[r.label,r.value]) }`. Use for a
ranking where a full bar is too heavy.

### `CB.shapes.slope(config) -> option` — two-axis slope / bump

```text
config: {
  items:      [ { label, from, to }, … ],
  left?,            // left-axis caption (default 'before')
  right?,           // right-axis caption (default 'after')
  mode?,            // 'value' (default) | 'rank' (position by rank, 1 at top)
  highlight?,       // string[] of labels to render solid-accent; others muted
}
```
Two columns of points joined by lines — the "two-point change for many series" chart
(`CB.shapes.dumbbell` is the per-row companion). `highlight[]` labels render solid
accent, the rest muted. `mode:'rank'` positions by rank. Height ≈ 320–460px (the builder
reserves wide left/right grid pad for the end labels). Table:
`{ columns:[labelHdr, left, right], rows: items.map(i=>[i.label,i.from,i.to]) }`.

### `CB.threshold(option, config) -> option` — reference line/band transformer

```text
CB.threshold(option, {
  value,            // the reference value
  label?,           // line label
  tone?,            // 'neutral'|'critical'|'danger'|'warning'|'success'|'info'|… (themed)
  band?:[lo, hi],   // optional -> also adds a tinted markArea band
  axis?,            // 'y' (default, horizontal rule on a value-y chart) | 'x' (vertical rule)
}) -> option
```
A **pure transformer** (not a `CB.shapes.*` builder): it merges a themed reference
`markLine` (+ optional band `markArea`) onto an **author-written** option via a hidden
carrier series, then you pass the result to `CB.chart` with your own `table`/`ariaLabel`
(the threshold adds **no** table columns). **Stackable** — call it twice for two lines.
`axis:'y'` = a horizontal rule (value-on-y chart); `axis:'x'` = a vertical rule
(horizontal-bar / value-on-x chart). The lighter, declarative alternative to hand-rolling
a `markLine` (see `components.md` "Annotated chart markers").

### `CB.annotate(chartSel, points)` — post-init annotation pins (C19)

```text
points: [ { coord:[x, y], text, tone?, symbolSize? }, … ]
```
A post-init annotation layer on a **registered** chart (a `CB.chart` host or its
`#cbChartN`): accent teardrop pins + labels on a `--c-surface` plate with a hairline
leader. Token-resolved at apply time **and** re-applied via the chart's registered
`renderFn`, so a dark toggle re-themes them; each note is appended to the chart's
data-table alt so it isn't canvas-only. `coord` is in data space. Use it to call out
specific points (a peak, an incident) after the chart exists — vs. `CB.threshold` for a
whole-axis reference line.

---

## Palette mode (`categoricalColors` / `ramp` `opts.mode`)

`CB.categoricalColors(n, opts?)` and `CB.ramp(n, opts?)` now take an optional second
arg. **Backward-compatible: existing 1-arg calls are byte-for-byte unchanged.**

```text
CB.categoricalColors(n, { mode? }) -> string[]   // peer series (regions/vendors/plans)
CB.ramp(n, { mode? })             -> string[]    // ordered/sequential series
  mode: 'analogous' | 'mono' | 'categorical' | 'sequential'
  // resolution order: opts.mode > window.PALETTE_MODE > 'analogous'
```
- **`categoricalColors`** — `'analogous'` (default) is EXACTLY today's bounded-arc
  output; `'mono'`/`'categorical'` widen/narrow the hue spread.
- **`ramp`** — default/`'analogous'`/`'mono'`/`'categorical'` = today's exact dark→light
  band; `'sequential'` = a perceptually-even **light→dark** ramp (`i=0` lightest).
- Both re-read the **live accent**, so a dark re-theme is free; `n<=1` returns `[accent]`.

Set the mode globally via `window.PALETTE_MODE` (or `REPORT_LOOK.paletteMode`, which
`CB.applyLook` writes); a per-call `opts.mode` overrides it. Absent === `'analogous'` ===
today. See `design-system.md` (Look system) for the theme.json `look.paletteMode` knob.

---

## Editorial / inline / annotation helpers (C05–C18)

String-returning helpers compose into `innerHTML`; target-rendering ones render into a
host. All emit shared `.cb-*` contract classes (styled by `cookiebite.css`) and re-theme
(incl. dark) automatically. See `components.md` (Editorial components) for when-to-use +
the tone contract.

### `CB.lead(htmlOrText, opts?) -> string` — standfirst / leading paragraph

```text
htmlOrText,         // TRUSTED author HTML (inline bold/links compose)
opts: {
  measure?,         // false -> opt the paragraph OUT of the prose measure (full-bleed .cb-bleed)
  dropcap?,         // true -> initial drop-cap (.cb-lead--dropcap)
}
```
A `.cb-lead` standfirst (larger, looser than body) for the opening paragraph of a section
or report. CSS owns the size/leading.

### Callout family: `CB.note / tip / warning / danger / example(html, opts?)` + `CB.quote(html, opts?)`

```text
CB.note(html, { title? })     // tone info    — kicker 'NOTE',    icon info
CB.tip(html, { title? })      // tone success  — kicker 'TIP',     icon lightbulb
CB.warning(html, { title? })  // tone warning  — kicker 'WARNING', icon alert-triangle
CB.danger(html, { title? })   // tone critical — kicker 'DANGER',  icon octagon-x
CB.example(html, { title? })  // tone neutral  — kicker 'EXAMPLE', icon code
CB.quote(html, { cite? })     // a <blockquote> .cb-quote; cite -> trailing <cite> (escaped)
```
Each returns a `.cb-callout` with a **locale-aware text kicker** (via `CB.t`) + a tone
Lucide icon + the trusted body. `opts.title` overrides the kicker text. These are the
admonition variants of the original `CB.callout` (which is untouched) — reach for the
named variant when the box has a fixed role (a warning, a tip).

### `CB.figure(target, config)` — wrap a chart/figure with a numbered caption

```text
config: {
  number?,          // 'auto' (CSS-counter 'Fig. N') | a number (literal label) | false (no eyebrow)
  title,            // figcaption title (escaped)
  note?,            // secondary caption tier
  source?,          // provenance tier (text-disabled)
}
```
Wraps the host node **in place** inside a `<figure class="cb-figure">` with an optional
`Fig. N` eyebrow + a tiered `<figcaption>`. Pairs with a chart's existing aria/data-table
(the chart host stays the figure content). **Idempotent** — a re-run re-captions rather
than double-wrapping. Default `number` is `'auto'`.

### `CB.statusDot(tone, label, opts?) -> string` — labelled status dot

```text
CB.statusDot(toneName, label, { pulse?, size? })
  toneName,         // neutral | info | success | warning | critical (CSS owns the color-mix)
  label,            // REQUIRED text label — never color-alone
  pulse?,           // true -> a single slow ring (gated on prefers-reduced-motion)
  size?,            // dot diameter in px (default ~8px from CSS)
```
A filled tone dot + a **required** text label. The only inline knob is `size`; the dot
color is owned by CSS via the modifier class. Use for a live status indicator (a service
state, a build health).

### `CB.whatChanged(target, items, opts?)` — value-diff block

```text
item: {
  label,            // the row's name
  from,             // old value (rendered struck, --c-disabled)
  to,               // new value (--c-primary)
  tone?,            // colors the Δ badge + arrow (default neutral)
  delta?,           // badge text; auto-built from a numeric from→to when omitted
}
opts: { title?, emptyText? }
```
A 'value diff' block (`.cb-whatchanged`): per row, `old → new` with an aligned arrow and a
`CB.deltaBadge` Δ. Numerics use `tabular-nums`; rows stack below `sm`. Use for a small
config/metric before↔after (the textual sibling of `CB.shapes.dumbbell`).

### `CB.epigraph(html, opts?) -> string` / `CB.pullquote(html) -> string` — quotations

```text
CB.epigraph(html, { cite? })  // small italic OPENING quotation (.cb-epigraph); cite -> <cite> (escaped)
CB.pullquote(html)            // LARGE quotation with a hanging accent quote glyph (.cb-pullquote)
```
Real `<blockquote>`/`<cite>`. `epigraph` = a small opening epigram; `pullquote` = a large
emphasized lift-out. Bodies are trusted HTML. Distinct from `CB.quote` (a callout-family
inline blockquote).

### `CB.kicker(text, opts?) -> string` + the `.cb-leadin` run-in class

```text
CB.kicker(text, { tone? })    // an eyebrow line (.cb-kicker) meant to sit directly above an <h2>
  tone?,            // colors the eyebrow via the shared tone text class (default accent-strong look)
```
A section eyebrow/label. Its companion is the **`.cb-leadin`** class (the runtime emits
**no** element for it — apply it by hand to the first inline `<span>`/`<b>` of an opening
paragraph for a small-caps run-in): `<p><span class="cb-leadin">In short,</span> …</p>`.

### `CB.legend(target, items, opts?)` — standalone / interactive legend

```text
item: { label, color?, value?, note? }
opts: {
  swatch?,          // 'square' (default) | 'line' | 'dot' — match the series' mark
  interactive?,     // true -> each row is a <button aria-pressed> toggling a series
  chart?,           // selector/instance of a registered ECharts chart to toggle
}
```
A standalone `.cb-legend`; swatch colors default to `CB.categoricalColors(n)` and re-read
the **live accent** (registered via `CB.onThemeChange`, so a dark toggle recolors them).
Optional right-aligned `tabular-nums` value per row. `interactive:true` + `chart` makes
each row a real button that fires `dispatchAction('legendToggleSelect')` on the chart —
use it to give a multi-series chart a richer, value-bearing legend than ECharts' built-in.

---

## Look system: `CB.applyLook(look?) -> CB`

```text
CB.applyLook(look?)   // reads window.REPORT_LOOK (or the arg) and projects each field
                      //   onto an html data-* attr OR an inline :root var.
```
Called **once at init** before charts render. Sets `data-density`/`elevation`/`surface`/
`bg`/`header`; the `--radius-scale` (a number OR `'sharp'|'subtle'|'default'|'round'`),
`--border-w`, `--border-style`, `--font-heading`, `--measure-prose`, `--measure-page`,
`--dark-tint` (+ `data-dark-tint`); writes `window.PALETTE_MODE`; applies the named
`--semantic-preset`. **Every field is optional; absent === today (touches nothing)** —
this is the backward-compat guarantee. See `design-system.md` (the Look system) for every
knob, its data-attr/CSS-var contract, and the theme.json `look:{}` block that emits
`window.REPORT_LOOK` for this function to read.
