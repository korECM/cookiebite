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
                    //   info->"Medium", neutral->"Low" (locale-aware label)
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
  points: [ { x, y, size?, label? }, … ]
  // auto-becomes a BUBBLE chart when any point has size (sqrt scale: symbol AREA ~ size).
  //   accent fill; label+size ride along into the tooltip.

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
  priority?,        // pill (tone-mapped)
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
