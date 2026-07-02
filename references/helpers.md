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

**`delta.text` is a short TOKEN, not a phrase (F11).** It renders inside a pill beside an
arrow, so keep it to ~6–8 chars (`"+2.1%p"`, `"−4"`, `"3× ↑"`); a longer phrase like
`"up 2.1%p vs last week"` clips/wraps and breaks the card. Put any narrative in the item
**`note`** field (a small caption under the number), which is sized for a sentence.

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
survive a dark toggle. **Capture the returned instance** (`var c = CB.chart(...)`) and
update through `c.__cbUpdate(option)` — that's the handle for a filter-chip row, not a
`window` global. Worked example (chip row → captured instance) in `interactions.md §1`;
the cross-slot variant (control in SECTIONS, chart in REPORT-SCRIPT) is §2. Inside the
option use resolved colors (`CB.accentRgba`, `CB.theme.ACCENT`), never
`var(--*)`/`color-mix` (renders black on canvas).

## `CB.compare(target, config)` — comparison / decision grid

```text
config: {
  rows,             // [ 'Effort', 'Risk', … ]  the attribute labels (one column of <dt>)
  options: [ { name, note?, recommended?, values: [ cell, … ] } ],  // values[i] aligns to rows[i]
                    //   note?: trusted HTML — a one-line description under the option name
                    //          (the "here's the approach" setup line above the attribute rows)
                    //   cell:  'text'  OR  { label, tone, icon? } (rendered via CB.pill)
  recommendation?,  // trusted HTML -> a CB.callout below the grid
}
```
**`note` is free-height.** It renders between the option name and the `<dl>`, so if only
*some* options carry one — or notes run to different line counts — the attribute rows
below won't line up across columns. Give every option a similar-length `note` (or none)
when strict row alignment matters; omit it and the grid stays a tight aligned matrix.
Use it when each option needs a sentence of free-form framing that doesn't fit the shared
`rows` axes (the botfarm-style "A. Cap 방식 / B. 고정 임계값" decision cards) — reach for
the shared `rows` when the options answer the *same* attributes, and add `note` on top
when they also need their own prose.
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
**Sizing contract** (the intrinsic px width is dropped; the viewBox preserves the aspect
ratio, so it never clips). The SVG is scaled to a **readable** size, not just "fit":
- A **small** diagram (3-node flowchart, short sequence) is scaled **UP** to fill the
  column, **capped at 760px** and **centered** (`margin:0 auto`) — so it reads at a
  comfortable size instead of a tiny thumbnail, but a 3-node graph doesn't stretch
  comically across a wide column.
- A **naturally wide** diagram (intrinsic width > the cap) fills 100% and shrinks to the
  column width; the host scrolls horizontally only as a last-resort fallback for a
  genuinely huge one.
ELK routing (see "now routes with the ELK layout engine" in `libraries.md`) keeps labels
uncollided at any scale, so filling the width no longer means "huge colliding labels".
Still keep participant counts and label lengths reasonable: a 12-actor sequence fits but
renders tiny — split it or use a flowchart.

**Line breaks in a node/note label (F14):** use `<br/>`, **not** `\n`. `\n` inside a
Mermaid label is unreliable across diagram types; `<br/>` is the canonical break and works
everywhere (`A["First line<br/>second line"]`). The runtime now also auto-converts a
literal `\n` to `<br/>` as a safety net, but author `<br/>` so the source is portable.

**Two+ diagrams on one page — watch the upscale (F15):** because a small diagram is scaled
**UP** to the ~760px cap (above), a compact 3-node flowchart placed beside a naturally wide
one can look oversized — the small one fills to 760px while the wide one renders at its own
larger intrinsic size, so they read at mismatched scales. To keep a set visually consistent,
either give them **similar node counts / intrinsic widths**, or lay the small one out **`LR`**
(left-to-right) so it's wider and lands nearer the others' scale. The cap is per-diagram, so
it won't equalize them for you.

## `CB.pill(label, opts?) -> string` / `CB.callout(html, opts?) -> string`

```text
CB.pill(label, { tone?, icon? })          // icon:null suppresses the auto tone icon
CB.callout(html, { tone?, icon?, title? }) // `html` is trusted; `title` escaped + bolded
```

---

## New helpers (component-coverage additions)

### `CB.takeaway(pointsOrHtml, opts?) -> string` — TL;DR / key-takeaways box

```text
pointsOrHtml,       // an ARRAY of bullets  OR  a raw HTML string (trusted, not escaped)
opts: { title? }    // box heading (default a localized "Key takeaways")
```
Returns a prominent summary box: accent-weak surface, accent-strong title. Put it at the
top of an explainer/exec report. Distinct from `CB.callout` by being multi-point and
summary-positioned. See `components.md` (Key-takeaway box) for usage.

**Per-bullet escaping (the F01 gotcha — mirrors `CB.pseudocode`'s rule).** In the array
form, each bullet may be one of three shapes:
- `'a string'` → **escaped** (literal text; HTML tags render as text).
- `{ tone?, text }` → **escaped** text, with a tone-colored dot (`info`/`success`/`warning`/
  `critical`/`neutral`; default `neutral`). Use for "2 wins + 1 risk" colored discs.
- `{ html }` → **TRUSTED** (rendered verbatim) — the only form that lets inline `<b>`/`<a>`/
  `<span>` survive. `html` wins if both `html` and `text` are present.

So to bold a word or add a link **inside** a bullet, use `{ html }`; a plain string or
`{ text }` will show the tags literally. Example:
```js
CB.takeaway([
  'Latency p95 dropped 38% after the cache rollout',          // escaped
  { tone:'warning', text:'One region still above SLO' },      // escaped + amber dot
  { html:'Full write-up in <a href="#rca">the RCA</a>' },     // trusted HTML
]);
```
(The non-array form — passing a single raw HTML string — is trusted wholesale.)

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

### `CB.gaugeGrid(target, items, opts?)` — grid of gauge rings (SLA/quota board)

```text
item: {                // each cell is one CB.gauge ring
  label,               // caption under the ring
  value,               // current value
  max?,                // default 100
  target?,             // optional target value -> tick on the ring
  tone?,               // override the fill tone (default: accent)
  unit?,               // small unit after the value ('%','ms')
  sub?,                // small secondary line INSIDE the ring, under the value
  showMax?,            // true -> faint '/max' affordance after the value
  size?, thickness?,   // per-ring diameter / stroke override
  ariaLabel?,          // per-ring role="img" label (default auto-built)
}
opts: {
  cols?,               // override the auto column count (auto by item count via COLS_MAP)
  emptyText?,          // overall empty-state text when `items` is empty
}
```
A responsive grid of `CB.gauge` rings — **one ring per metric, each against its own
`target`/`max`**. The SLA / quota / health-board helper: reach for it instead of
hand-emitting N separate `CB.gauge` calls in a flex row. It **reuses `gauge()` per cell**,
so every ring is a pure `conic-gradient` that re-themes (incl. dark) with **no
registration**. `cols` auto-picks by item count (the KPI-grid cadence) unless `opts.cols`
is given; emits `.cb-gaugegrid` / `.cb-gaugegrid-cell` (1/2/3/4 cols at <640/640/1024/1280px,
stacks to 1 on narrow, prints at a fixed 3-col cadence). Per-cell **and** overall
empty-states. Contrast with `CB.gauge` (one ring) and `CB.kpis` (number cards, not rings).

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

### `CB.connectFilter(buttonsSelector, onChange, opts?) -> { select(value) }`

```text
buttonsSelector,    // selector matching a row of native button[data-value] chips
onChange,           // (value, btn) => void  — fired on selection; the `data-value` + the <button>
opts: {
  initial?,         // data-value to select first (default: the first chip)
  fire?,            // false -> skip the initial onChange (don't fire on wire-up)
}
```
Wires a chip row of `button[data-value]` elements to `onChange`: it manages each chip's
`aria-pressed` + an `is-active` accent class, default-selects the first chip (or
`opts.initial`), and is keyboard-accessible. Returns `{ select(value) }` to drive the
selection programmatically. **This is the F10 dashboard-filter pattern without a `window`
global:** author **closes over the captured `CB.chart` instance(s)** and calls
`inst.__cbUpdate(option)` inside `onChange` (so the reader's filter survives a dark
re-theme), instead of the `window.__fooUpdate` bridge. `opts.fire:false` skips the
on-wire-up call (e.g. when the chart isn't built yet). The markup is native buttons, not
Alpine — pair it with a wrap-or-scroll chip row (the interactions.md §1 RULE). See
`interactions.md §1` for the worked example.

### `CB.copyReport(opts?) -> HTMLButtonElement | undefined`

```text
opts: {
  label?,            // button aria-label / flash label
  selector?,         // what to serialize (default: each `main section[id]`; body fallback)
}
```
**Opt-in chrome (author must call it).** Injects a quiet 40px round button (`.cb-copyreport`,
matching `#cbPrintButton`/`#themeToggle`) near the theme toggle that serializes the **whole
report to markdown** — `CB.sectionToMarkdown` over each `main section[id]` (or `opts.selector`)
— and copies it via `CB.copy` with a success flash (`.is-copied` + swapped icon/label, so the
confirmed state is never color-alone). The one-call "export the entire report" affordance, vs
`CB.copyButton` + `sectionToMarkdown` for a **single** section. Returns the button, or
**`undefined`** when `window.REPORT_NO_COPY` is truthy or a `.cb-copyreport` already exists.

### `CB.glossary(map, scope?)` — merge terms + run the linker

```text
map,                // { term: 'definition', … } merged into window.GLOSSARY
scope?,             // element / selector to scan (default document)
```
Runs the glossary linker + Tippy within `scope`; works from **inside** a
`DOMContentLoaded` handler (unlike a raw `window.GLOSSARY`, which must be a parse-time
assignment). Idempotent — re-running only links newly-added terms. Needs the Tippy CDN
tags. See `interactions.md` §11.

**The linker matches keys as exact phrases in body text, on first occurrence (F16):** each
`map` key is found as a literal phrase the first time it appears in the prose and wrapped in
the `.gloss` tooltip term automatically. So **just pass plain terms and write normal prose —
do NOT pre-author `<span class="gloss">…</span>` wrappers** around the term yourself. A
hand-written `.gloss` span is treated as already-linked and **suppresses** the tooltip (the
linker skips text already inside a `.gloss`), so you get the underline with no definition.
Keys are matched verbatim, so include the exact surface form readers will see (e.g. both
`"idempotency key"` and an acronym if both appear).

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
CB.cellMoney({ currency?, symbol?, decimals? })  // format a numeric cell as money
                                       //   (currency/symbol/decimals default to REPORT_LOCALE);
                                       //   keeps the RAW number so sort stays numeric + tabular-nums
```
```js
CB.table('#t', { columns: [ 'PSP',
  { name:'Trend', formatter: CB.cellBar({ max: 100 }) },
  { name:'Heat',  formatter: CB.cellHeat({ max: 100 }) },
  { name:'7d',    formatter: CB.cellSpark() },
  { name:'MRR',   formatter: CB.cellMoney({ currency:'USD' }) } ], rows });  // F18
```
**Money columns (F18).** For a currency column, use **`CB.cellMoney({ currency?, symbol?,
decimals? })`** — it formats each numeric cell as money (defaults pulled from
`REPORT_LOCALE`, so `₩`/`$`/`만`-`억` follow the report locale) **while keeping the cell's
raw number**, so Grid.js still sorts numerically and the column keeps `tabular-nums`
alignment. This is the right tradeoff vs the two raw-number paths: listing the column in
`numericCols` gives grouped raw numbers (`72,000`) with correct sort but **no currency
symbol**; pre-formatting the cell to a string (`'$72,000'`) shows the symbol but **sorts
lexically** (so `$9` &gt; `$72,000`) and loses `tabular-nums`. `CB.cellMoney` gives you the
symbol *and* numeric sort. Pass `symbol`/`decimals` to override the locale (e.g. a USD
column in a ko-KR report: `CB.cellMoney({ currency:'USD', symbol:'$', decimals:0 })`).

### i18n: `CB.t`, `CB.locale`, `CB.i18n` (F42)

```text
CB.t(key, fallback?) -> string   // lookup order: REPORT_LOCALE.strings override
                                 //   > active-locale cell > en cell > fallback > key
CB.locale() -> 'ko' | 'en' | 'ja' | 'es' | 'de' | 'fr' | 'zh' | …
                                 // active 2-letter prefix from REPORT_LOCALE.number
                                 //   (unknown -> 'en')
CB.i18n                          // the built-in string table (object keyed by locale
                                 //   prefix); extend it or inspect keys
```
Authors extend strings via `window.REPORT_LOCALE.strings = { key: 'override' }` or by
adding a locale cell to `CB.i18n`. **`CB.i18n` now ships ko/en/ja plus es/de/fr/zh** — a
report whose `REPORT_LOCALE.number` is `es-ES`/`de-DE`/`fr-FR`/`zh-CN` gets localized UI
chrome (view-as-table / min-read / callout kickers / TOC heading) without an author override;
the lookup still falls back to the `en` cell then the key, so an unlisted locale degrades to
English. The East-Asian myriad bands in `moneyShort` are opt-in via
`window.REPORT_LOCALE.bigUnits`: `'ja'` for Japanese `万/億`, **`'zh'` for Chinese `万/亿`**
(note the simplified `亿`), or `{ man, eok }` for custom unit words; `true` keeps the Korean
`만/억` byte-identical.

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
outcomes) — the runtime version of the `components.md` pseudocode component. **Both `text`
and `note` are escaped**, so do NOT embed HTML (`<b>`, `<span class="text-positive">`) in a
line string — it renders as literal tags. The `components.md` recipe styles keywords/
outcomes with raw `<b>`/`<span>` because it is *hand-authored markup*; with this helper,
get the same effect from the **object line form**: `{ text:'return result', tone:'success' }`
colors the whole line (tones: `info`/`success`/`warning`/`critical`/`accent`) and `note`
adds the quiet trailing annotation. There is no per-token bolding via the helper — pass a
plain `text` and lean on `tone` + `note`, or drop to the `components.md` hand-built `<pre>`
when you need inline keyword bolding.

### `CB.code(target, config)` / `CB.codeTabs(target, panels, opts?)` — syntax-highlighted source

```text
CB.code config: {
  code,               // the source STRING (verbatim, escaped)
  lang?,              // 'javascript' | 'ts' | 'json' | 'python' | 'bash' | … (highlight.js id)
  filename?,          // header chip ('token-exchange.js'); the lang shows next to it
  lineNumbers?,       // default true — left number gutter
}
CB.codeTabs(target, panels, opts?)  // panels: [{ label, code, lang?, filename? }] — tabbed CB.code
```
A real syntax-highlighted code card (filename chip + line numbers). **Needs the highlight.js
tag in `HEAD-LIBS`** (it ships in the template; remove it only for a no-code report).
Highlighting is themed via cookiebite.css's `.hljs` token layer — keywords in the accent,
strings green, numbers blue, comments quiet — so it stays **on-brand + dark-aware**, never
highlight.js's default rainbow. Degrades to clean monospace if the tag is absent (never errors).
Use `CB.codeTabs` for the "same thing in N languages/steps" tabbed block. Hand-authored
`<pre><code class="language-js">` blocks are auto-highlighted too (`CB.highlightAll()` at init).
For a +/− change use `CB.diff`; for annotated/pseudo logic use `CB.pseudocode`; for real
runnable source use `CB.code`.

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

**The ramp is single-hue accent alpha keyed to magnitude — bigger = more accent, NOT
"worse".** Each cell is `color-mix(in srgb, var(--accent) X%, transparent)` with the
opacity from `value / max` (cells past ~55% of max flip their text to `--accent-on` ink
for contrast). So it reads *high vs low*, not *good vs bad* — don't use the tint to imply
a value is alarming. (A diverging or semantic-red ramp — red = bad, green = good for e.g.
a churn or error matrix — is a **backlog item**, not available today; for now pair the
matrix with a `findings`/`callout` if a cell needs a "this is bad" signal.)

**Watch the constant-first-column footgun.** `max` defaults to the largest cell across the
*whole* grid, so a column of large constants (a cohort-size or "total" column whose values
dwarf the retention %s) pins `max` high and **compresses every other cell toward faint** —
the interesting gradient vanishes. Fixes: drop the magnitude column out of `data` (render
it as a plain leading `<th>`/row label instead of a heat cell), or set `max` explicitly to
the range you want graded (e.g. `max: 100` for a percent grid) so the constant column
doesn't hijack the scale.

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

---

## Wave B — heavy hierarchy/flow/schedule charts (`CB.treemap` / `CB.sankey` / `CB.gantt`)

Three full-render helpers (they build the host card, the ECharts instance, register for
dark, and inject the `dataTableToggle` themselves — you don't wrap them in `CB.chart`).
Each **warns if `ariaLabel` is omitted** (it becomes the screen-reader label *and* the
data-table caption — always set it). All single-hue accent-themed and dark-aware.

### `CB.treemap(target, config)` — value-weighted hierarchy

```text
config: {
  nodes?,            // FLAT [ { name, value?, parent? }, … ] — built into a tree by parent-NAME
                     //   (a flat node carrying its own `children` is passed through as-is)
  tree?,             // OR a NESTED { name, children:[ { name, value?, children? }, … ] }
  max?,              // depth levels to render (default 3; narrow forces 1, drill via drilldown)
  drilldown?,        // true -> nodeClick zooms + a breadcrumb (else static, no breadcrumb)
  caption?,          // captionHtml? for trusted HTML
  ariaLabel?,        // SR label + data-table caption (warns if omitted)
  pathHeader?,       // data-table path column header (default localized 'Path')
  valueHeader?,      // data-table value column header (default localized 'Value')
  height?,           // px, default 360
  emptyText?,
}
```
Tiles are colored by a **value→lightness ramp** (`CB.ramp(7)`: largest value = darkest
tile) so every tile is one hue, with 2px `--c-bg` gutters. Data-table emits `a › b › leaf`
path + value rows (leaf nodes only). Use for a value-weighted hierarchy (budget by
team→project, storage by bucket→folder). See `libraries.md` ("Treemap" + "which chart when").

### `CB.sankey(target, config)` — flow between stages

```text
config: {
  nodes,             // [ { name }, … ]
  links,             // [ { source, target, value }, … ]  (source/target reference node names)
  nodeAlign?,        // 'justify' (default) | 'left' | 'right'
  orient?,           // override the auto orientation (narrow flips to 'vertical')
  caption?,          // captionHtml? for trusted HTML
  ariaLabel?,        // SR label + data-table caption (warns if omitted)
  sourceHeader?, targetHeader?, valueHeader?,  // data-table column headers
  height?,           // px, default 360
  emptyText?,
}
```
Slim `--accent` node bars; links are a **single-hue opacity gradient** (source-tint →
target-tint) so heavier flows read denser, never a second color. Labels truncate-with-
tooltip and sit outside-edge; on narrow it flips to vertical. Data-table = source → target
→ value rows. Use for a flow (signup→activation→paid, traffic source→page→exit). For long
sentence-like node names a Sankey is the wrong tool — use a step/flow list (`libraries.md`).

### `CB.gantt(target, config)` — schedule / duration bars

```text
config: {
  tasks,             // [ { label, start, end, lane?, progress?(0..1), tone? }, … ]
                     //   start/end parse via `new Date()`; `lane` groups rows (first-seen order)
  today?,            // a date for the marker line (default now)
  caption?,          // captionHtml? for trusted HTML
  ariaLabel?,        // SR label + data-table caption (warns if omitted)
  rowHeight?,        // px per lane row (default 30)
  height?,           // px floor (auto-grows to lanes × rowHeight + 80)
  taskCol?,          // (locale) the default lane label when a task has no `lane`
  emptyText?,
}
```
Custom-series bars: a rounded `--accent` base with a darker `--accent-strong` inner
**progress** portion, lane zebra bands, and a thin `--c-critical` **today** line labelled
at top. On narrow the date axis scrolls **inside** the card (the canvas widens, the wrapper
scrolls) so it never trips page horizontal-overflow. Data-table = task / start / end / %
rows. Use for a project schedule / roadmap (vs `timeline`=point events, `steps`=ordered
stages — see `libraries.md` "which chart when"). The `.cb-gantt__lane` / `.cb-gantt__today`
class hooks (`components.md`) only exist if a build emits structural lane rows; this
custom-series version uses canvas, so they're simply unused.

---

## Wave B — distribution & composition shape builders (`CB.shapes.*`)

Pure ECharts-`option` builders (like the rest of `CB.shapes.*`): **pass the returned
option to `CB.chart`** with your own `ariaLabel`/`table`. All read `CB.theme`/the live
accent, so they follow the dark re-theme. For *which* shape fits *which* data see
`libraries.md` ("which chart when": distribution → boxplot/densityArea/histogram,
composition×weight → marimekko).

### `CB.shapes.fiveNum(values) -> [min, q1, median, q3, max]`

```text
values: number[]    // -> the five-number summary (linear-interpolation quantiles, on a
                    //   sorted NON-mutating copy)
```
Exposed so you can build the boxplot data-table rows that carry the per-group summary
(see the boxplot table hint below). Standalone helper, not a chart.

### `CB.shapes.boxplot(config) -> option` — per-group distribution boxes

```text
config: {
  groups,            // [ { label, values:number[] }, … ]  (the runtime computes the summary)
                     //   OR [ { label, five:[min,q1,med,q3,max], outliers?:number[] }, … ] (precomputed)
  horizontal?,       // default: true when >4 groups OR any label >6 chars (Korean-safe);
                     //   pass false/true to force vertical/horizontal
  showOutliers?,     // true (default) -> 1.5·IQR-fence outliers as hollow --c-secondary dots
}
```
Box fill `accentRgba(.12)`; box outline + median = `CB.theme.ACCENT` (ECharts shares one
`itemStyle` across box/median/whisker, so the **median reads as the dominant accent
stroke**). When `values` are given the runtime derives the five-number summary and clamps
the whiskers to the non-outlier extent. **Table hint** (build from the per-group summary):
```js
table: { columns:[labelHdr,'min','q1','median','q3','max'],
  rows: groups.map(g => { var f = (g.five || CB.shapes.fiveNum(g.values)); return [g.label].concat(f.map(CB.nf.format)); }) }
```

### `CB.shapes.densityArea(config) -> option` — KDE distribution / ridgeline

```text
config: {
  values?,           // number[]  — a SINGLE distribution
  groups?,           // OR [ { label, values:number[] }, … ] (+ ridgeline:true to stack)
  bandwidth?,        // 'auto' (default = Silverman's rule of thumb) | a number
  ridgeline?,        // true (groups only) -> a vertical stack of slightly-overlapping ridges
  showMedian?,       // true (default, single only) -> a dashed --c-secondary median tick
}
```
Single distribution: one `CB.theme.ACCENT`-stroke Gaussian-KDE curve over an
`accentRgba(.12)` fill. With `groups` + `ridgeline:true`: each ridge is a `CB.ramp` tone,
baseline-labelled with the group name. Pass your own raw `values` for the data-table; the
aria already states the shape. The smooth-curve sibling of `CB.shapes.histogram`.

### `CB.shapes.marimekko(config) -> option` — composition × column weight

```text
config: {
  columns,           // [ { label, weight:number, segments:[ { name, value }, … ] }, … ]
  legend?,           // false to hide the legend (default shown)
  narrow?,           // true -> a plain stacked-100% bar FALLBACK (equal widths, ignores weight)
                     //   carrying a `__mekkoFallback:true` marker so a narrow path can swap it
}
```
Wide (Mekko): column **widths** encode each column's weight share, within-column segments
stack 100% via `CB.ramp` (single hue), only the largest block per column gets an inline %
label, `--c-bg` gutters. **Table:**
```js
table: { columns:['column','weight'].concat(segNames),
  rows: columns.map(c => [c.label, c.weight].concat(/* each segment's value */)) }
```
Use when both a category's **size** and its **internal split** matter (revenue by region ×
plan mix). Pair the `__mekkoFallback` marker with `narrow:true` so a narrow render swaps in
the plain stacked bar. See `libraries.md` ("composition × weight → marimekko").

> **Geo / choropleth is intentionally NOT shipped** — a map needs a bundled GeoJSON, which
> blows the single-file weight budget. Out of scope for now; for region data reach for a
> `CB.matrix` (rows×cols), a ranked `CB.leaderboard`, or a horizontal bar instead.

---

## Wave B — TOC, footnotes, reading chrome, scroll-reveal (editorial enrichment)

Long-form enrichment for explainer / research / postmortem reports. All emit shared
`.cb-*` contract classes (styled by `cookiebite.css`), re-theme automatically, and the
motion ones are **gated on `CB.MOTION_OK`** (no-op or instant under `prefers-reduced-motion`).
These are **opt-in** — call them from your init script. See `interactions.md` (§7, §9) and
`components.md` (Footnotes) for placement.

### `CB.toc(target, opts?) -> nav | null` — auto-built table of contents

```text
opts: {
  numbered?,         // 1 / 1.1 tabular-nums prefixes (default true)
  nested?,           // two-level: section h2 + its h3[id] become sub-entries (default true)
  progress?,         // per-item accent-weak progress fill on the active section (default true)
  heading?,          // sidebar heading (default localized 'Contents')
  force?,            // true -> override even a hand-authored #toc that already has links
}
```
Builds the `.cb-toc` sidebar from `main section[id]` + their `h2`/`h3`, renders into (or
reuses) the canonical `#toc` element, and **re-runs `initToc()`** so the existing
IntersectionObserver active-state + the below-`lg` mobile section nav wire up for free.
**NO-OP when a hand-authored `#toc` already has links** (progressive enhancement) — pass
`force:true` to override. The active state stays owned by `initToc()`'s observer; don't add
a separate active class. Emits the `.cb-toc` markup (see `components.md` for the contract).

### `CB.readingProgress(opts?) -> bar | null` — scroll-progress bar

```text
opts: {
  height?,           // bar height in px (default 2)
  target?,           // the scroll-extent element selector (default 'main')
}
```
A `var(--accent)` bar (`.cb-readingbar`) pinned at the top, driven by `transform:scaleX`
over the target's scroll extent, `aria-hidden`. **Returns null under reduced-motion**
(gated on `CB.MOTION_OK` — a moving bar is exactly what they opted out of) and is
**idempotent** (no-op if a `.cb-readingbar` already exists).

### `CB.readTime(target, opts?) -> p` — reading-time eyebrow

```text
opts: {
  wpm?,              // Latin words-per-minute (default 220)
  cpm?,              // CJK chars-per-minute (default 500)
  scope?,            // the element to measure (selector, default 'main')
}
```
A `.cb-readtime` caption eyebrow with a lucide clock glyph. **CJK-aware via `CB.locale()`**:
counts han/kana/hangul CHARS at `cpm` for `ko`/`ja`, words at `wpm` for Latin. Minimum 1
minute; label via `t('minRead')`. Appends to `target`.

### `CB.fn(noteHtml) -> string` / `CB.endnotes(target, opts?) -> el | null` — footnotes

```text
CB.fn(noteHtml)      // returns a <sup class="cb-fnref"><a> reference (id cbfn-ref-N) AND
                     //   registers the note body. N auto-increments per call in document order.
CB.endnotes(target, {
  heading?,          // section heading (default localized 'Notes')
  style?,            // 'list' (default) | 'sidenote'
})                   // renders every registered note; returns null when none were registered
```
**ref↔note ids are paired by construction** (`cbfn-ref-N` ↔ `cbfn-note-N`) — no manual id
pairing, so the jump never silently breaks. `style:'list'` = an ordered `.cb-endnotes` list
with `↩` back-links; `style:'sidenote'` = `.cb-sidenote` blocks the CSS floats into the
right margin on wide and collapses inline at narrow. The runtime version of the
`components.md` "Footnotes & citations" pattern (which stays valid for hand-authoring).

### `CB.scrollReveal(scope?, opts?) -> IntersectionObserver | null`

```text
scope?,              // Element | selector to scan (default document)
opts: {
  stagger?,          // ms between sibling reveals, capped at 8 steps (default 60)
  y?,                // lift distance in px via --cb-reveal-y (default 8)
}
```
ONE IntersectionObserver that fades + lifts `[data-reveal]` elements as they enter
(toggles `data-reveal=out→in` so the CSS animates **opacity + transform only — no layout
shift**) and fires CountUp inside `[data-count-on-enter]` the first time each is seen.
**Gated on `CB.MOTION_OK`:** under reduced-motion (or no IO support) it sets everything to
`in`, runs counters straight to final, and returns null. **CRITICAL no-JS contract:** the
initial-hidden rule needs a guard class the JS adds *only* once reveal is running — never
put it in static markup or no-JS renders would hide content (see `components.md` /
`interactions.md` §7).
