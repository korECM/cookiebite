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
  gloss?,           // glossary definition string -> wraps the label in a .gloss tooltip term
}
opts: {
  cols?,            // '1-2-4' | '1-2-3' | '1-2' | '1-3' | '1'  (omit -> auto by item count)
  decimals?,        // default decimals for all items lacking their own
  animate?,         // false to skip CountUp
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

## `CB.mermaid(target, definition, opts?)` — text -> themed diagram

```text
definition,         // a Mermaid source string (flowchart / sequence / state / ER / gantt)
opts: { }           // reserved; themes from CSS vars and re-renders on dark for free
```

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
}
```
Single-hue accent ramp; registers for dark. Use for an ordered drop-off (signup ->
activation -> paid).

### `CB.gauge(target, config)` — CSS progress ring (no chart lib)

```text
config: {
  value,            // current value
  max?,             // default 100
  label?,           // center caption
  unit?,            // small unit after the value ("%")
  target?,          // optional target value -> draws a tick on the ring
  tone?,            // override the fill tone (default: accent)
}
```
Pure `conic-gradient` ring; themes via `var(--accent)` so it's dark-aware with **no**
registration. Reach for it over a chart for a single 0–100 progress/SLO number.

### `CB.heatmap(target, config)` — calendar heatmap

```text
config: {
  data: [ { date:'YYYY-MM-DD', value }, … ],
  caption?,
  ariaLabel?,
  max?,             // ramp ceiling (default: max of data)
}
```
ECharts calendar heatmap, single-hue accent ramp, registers for dark. Use for
daily-activity / contribution-style density.

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

### `CB.csvButton(target, rows, opts?)` — CSV download of table rows

```text
rows,               // [ [cell, …], … ]  (or pass { csv:true } to CB.table to auto-inject)
opts: { filename? }
```
