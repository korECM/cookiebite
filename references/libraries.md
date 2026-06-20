# Library catalog (CDN, self-contained reports)

Reports are a **single self-contained `.html` file** loaded over CDN so the user can
double-click it, email it, or drop it in Slack and it just works. No build step,
no `npm install`, no local assets. Pick from this catalog; don't reinvent.

Pin the EXACT versions used in `assets/template.html` (written below) so output is
reproducible — never `@latest`. If a CDN is blocked in the user's environment, say so
and offer an inline fallback.

## Core (always)

| Need | Library | CDN |
|------|---------|-----|
| Styling | Tailwind CSS Play CDN | `<script src="https://cdn.tailwindcss.com"></script>` |
| Font | theme font (default Pretendard, the Persimmon preset; the `neutral` preset = Inter) | the theme's font `<link>` — see SKILL.md "Theming" |
| Icons | Lucide | `<script src="https://cdn.jsdelivr.net/npm/lucide@0.460.0/dist/umd/lucide.min.js"></script>` then `lucide.createIcons()` |

Tailwind Play CDN prints a console warning about production use — harmless for a
standalone report; ignore it.

## Charts — pick ONE primary per report

Default to **ECharts** when the report is data-heavy or wants rich/interactive
visuals (it has the widest chart range, smooth animation, built-in tooltips,
zoom, and theming). Use **Chart.js** for a few simple, clean charts where ECharts
would be overkill.

| Library | Best for | CDN |
|---------|----------|-----|
| Apache ECharts | Rich/interactive: lines, bars, pie, scatter, heatmap, treemap, sankey, gauge, radar, candlestick, geo/map, large datasets, zoom/brush | `<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>` |
| Chart.js | Simple, clean line/bar/doughnut/radar | `<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>` |
| ApexCharts | Polished mixed/combo, sparklines, timelines | `<script src="https://cdn.jsdelivr.net/npm/apexcharts@3"></script>` |

Always theme charts with the theme accent (`--accent`) + neutral grid lines
(`--c-line-weak`/`--c-line`), the theme font, and tints/shades of the accent for
series. Don't accept the library's default rainbow palette — it breaks the designed
look.

**NEGATIVE caveat — `color-mix()` and `var(--*)` do NOT work inside an ECharts canvas
option.** They resolve in CSS and SVG, but an ECharts series/itemStyle color is parsed
by the chart, not the browser, so a `'color-mix(...)'` or `'var(--accent)'` string
renders black or wrong on the canvas. Inside a chart option use a resolved value:
`COOKIEBITE.accentRgba(alpha)` for an accent tint, or a concrete hex from
`COOKIEBITE.css('--accent')` (`COOKIEBITE.theme.ACCENT` for the accent). Reserve raw
`var(--*)`/`color-mix` for CSS/SVG/`@keyframes`.

## Interactivity & motion — use when they add signal, not noise

| Need | Library / approach | CDN |
|------|--------------------|-----|
| Small reactive UI (tabs, filters, toggles, counters) | Alpine.js (+ collapse plugin for `COOKIEBITE.timeline`) | `<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.14.1/dist/cdn.min.js"></script>` then `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>` (collapse MUST load before core) |
| Scroll-reveal animation | AOS | css `https://unpkg.com/aos@2/dist/aos.css`, js `https://unpkg.com/aos@2/dist/aos.js` |
| Animated count-up numbers | CountUp.js | `<script src="https://cdn.jsdelivr.net/npm/countup.js@2.8.0/dist/countUp.umd.js"></script>` |
| Fine-grained timeline/motion | anime.js | `<script src="https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js"></script>` |
| Sequenced + scroll-triggered motion | GSAP (+ ScrollTrigger) | `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js` + `https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js` |
| Animate a packet along a flow path | CSS `offset-path` (no dep) or GSAP MotionPath | `https://cdn.jsdelivr.net/npm/gsap@3/dist/MotionPathPlugin.min.js` (only if you need replay/scrub) — see motion.md §6 |
| Rich vector animation (After Effects/JSON) | Lottie (web component) | `<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>` then `<lottie-player src="…json" autoplay loop>` |
| Diagrams/flowcharts from text | Mermaid | `<script type="module">import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'</script>` |
| Graph layout (module map, call graph) | Graphviz / viz.js | `import { instance } from 'https://cdn.jsdelivr.net/npm/@viz-js/viz@3/lib/viz-standalone.mjs'` (~1.4 MB) |
| UML / class sketch from text | nomnoml | `<script src="https://cdn.jsdelivr.net/npm/nomnoml@1/dist/nomnoml.min.js"></script>` |
| Data tables (sort/search/paginate) | Grid.js | css `https://cdn.jsdelivr.net/npm/gridjs@6.2.0/dist/theme/mermaid.min.css`, js `https://cdn.jsdelivr.net/npm/gridjs@6.2.0/dist/gridjs.umd.js` |
| Tooltips / glossary popovers (edge-aware) | Tippy.js (+ Popper) | css `https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy.css`, js `https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js` + `https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy.umd.min.js` |

### Restraint
Motion should help the reader (reveal structure, draw the eye to the headline
number, make a transition legible). Avoid motion that just decorates — the report
should still feel like an operational, designed surface, not a landing page. A good
rule: every animation should survive the question "what does this
help the reader understand?"

## Which chart-shape builder when (`CB.shapes.*` — pick by question)

The `CB.shapes.*` builders return a ready ECharts `option` you hand to `CB.chart` (it
themes + registers it). Pick by the **question the reader is asking**, not the fanciest
shape — and remember each owes a data-table (the suggested `table` shape is in
`helpers.md`). Newer builders, by intent:

| Question | Builder | Notes |
|----------|---------|-------|
| What's the **spread / shape** of a sample? | `CB.shapes.histogram({ values })` | auto-bins (Freedman-Diaconis); `showMean` line. The binned **distribution** shape (boxplot/densityArea below are the quartile/smooth siblings). |
| How did each item **change** (before→after)? | `CB.shapes.dumbbell({ rows })` | per-row FROM→TO capsule; `sortBy:'delta'`. Many items. |
| How did the **ranking** change across two points? | `CB.shapes.slope({ items })` | two-axis slope/bump; `highlight[]` solid, rest muted; `mode:'rank'`. Few series. |
| A **ranking** where a full bar is too heavy? | `CB.shapes.lollipop({ rows })` | stem + dot; `baseline` -> a deviation chart. |
| Where does each item sit **in its range**? | `CB.shapes.rangeDot({ rows })` | min–max capsule + value dot; optional p25–p75 `band`. |
| How is each category **composed**? | `CB.shapes.stackedBar({ categories, series })` | horizontal stack; `mode:'percent'` to normalize; `peer:true` -> categorical palette, else a `ramp`. |
| What's each group's **distribution** (quartiles + outliers)? | `CB.shapes.boxplot({ groups })` | per-group five-number boxes; `horizontal` auto-true for >4 groups / long labels. The compact distribution-across-groups shape. |
| The **shape** of a distribution (smooth, or several overlaid)? | `CB.shapes.densityArea({ values \| groups })` | one KDE curve, or `ridgeline:true` to stack groups. The smooth sibling of `histogram`. |
| Composition where each column's **weight** also matters? | `CB.shapes.marimekko({ columns })` | column WIDTHS encode weight, segments stack 100%. Use over `stackedBar` when size × split both matter. |

These are **standalone (full-render) helpers** — they build the card + chart + data-table
themselves, so do **not** wrap them in `CB.chart`:

| Question | Helper | Notes |
|----------|--------|-------|
| A value per **day** over weeks/months? | `CB.heatmap({ data })` | the **calendar**-only density heatmap (streaks, seasonality). |
| A **rows×cols** grid that isn't a calendar? | `CB.matrix({ rows, cols, data })` | cohort / retention / confusion / relationship grid — single-hue accent-alpha. The grid sibling of `heatmap`. |
| A value-weighted **hierarchy** (budget by team→project)? | `CB.treemap({ nodes \| tree })` | value→lightness ramp tiles; `max` depth, `drilldown`. Flat-by-parent OR nested input. |
| **Flow** between stages (signup→activation→paid)? | `CB.sankey({ nodes, links })` | single-hue opacity-gradient links; flips vertical on narrow. Long sentence labels → use a step list instead. |
| A **schedule / duration** across lanes? | `CB.gantt({ tasks })` | date-axis bars + progress fill + today line; lanes group rows. vs `timeline`=point events, `steps`=ordered stages. |

> **No geo / choropleth helper ships** — a map needs a bundled GeoJSON that breaks the
> single-file weight budget (out of scope for now). For region data reach for `CB.matrix`,
> a ranked `CB.leaderboard`, or a horizontal bar.

**Annotation, not a new chart:** to add a **threshold / target line** to *any* chart, don't
build a new shape — call `CB.threshold(option, { value, tone, axis })` (a pure transformer
that merges a themed `markLine`/band; stackable) before passing the option to `CB.chart`.
To pin a **specific point** (a peak, an incident) on a registered chart, call
`CB.annotate(chartSel, [{ coord, text }])`. Both are in `helpers.md`; the hand-rolled
`markLine`/`markArea` equivalent is in `components.md` ("Annotated chart markers").

## Diagrams: pick by layout, not by habit

When a chart library is the wrong tool — a flowchart, a module map, a state machine, a
labelled figure — the key question is **who does the layout**. Hand-placing more than a
few shapes in SVG goes wrong fast (overlapping boxes, arrows that miss, drift), so reach
for hand SVG only for *small* bespoke figures and let a layout engine handle anything
with real structure.

| Diagram | Best tool | Why |
|---------|-----------|-----|
| Small bespoke figure (≤ ~6 shapes), annotated illustration, precise custom art | **Hand inline SVG** | full control, crisp, themeable, hand-editable. Layout is on you — keep it small. |
| Node-link / hierarchy / flow from data (org, dependency, process) | **ECharts `graph` / `tree` / `sankey`** | already loaded, auto-layout, themes from your CSS vars for free. The default here. |
| Boxes-and-arrows graph where layout quality matters (module map, call graph, ER) | **Graphviz** via [viz.js](https://github.com/mdaines/viz-js) (`@viz-js/viz`, ~1.4 MB) | real hierarchical/graph layout — the thing LLMs can't do by hand. Render DOT to SVG, then recolor with theme vars. |
| Flowchart / sequence / state / gantt from a text description | **Mermaid** | fastest text→diagram. **Use the `COOKIEBITE.mermaid(target, definition, opts?)` helper** — it dynamically imports Mermaid (no CDN tag), themes `themeVariables` from your CSS vars, re-renders on the dark toggle, and now **scales the rendered SVG to fit its container** (drops the intrinsic px width; the viewBox keeps the aspect ratio, so a wide sequence diagram shrinks to width instead of clipping on desktop or vanishing on mobile, and the host scrolls horizontally only as a fallback for a genuinely huge diagram). Still keep participant counts / label lengths reasonable — a 12-actor sequence shrinks legible-but-tiny; split it or use a flowchart. Drop to raw `mermaid.initialize({ theme:'base', themeVariables:{...} })` only for something the helper can't express. |
| Quick UML / class / component sketch | **nomnoml** (`nomnoml@1`, ~30 KB) | tiny, text→SVG. |

Hand inline SVG, when it fits, uses `currentColor` + theme vars and real `<text>`:
```html
<svg viewBox="0 0 320 120" style="color:var(--accent);font-family:var(--font-family)">
  <rect x="8" y="40" width="90" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
  <text x="53" y="64" text-anchor="middle" font-size="13" fill="var(--c-primary)">Service</text>
  <line x1="98" y1="60" x2="150" y2="60" stroke="var(--c-line)" stroke-width="2" marker-end="url(#arrow)"/>
  <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--c-line)"/></marker></defs>
</svg>
```

ECharts auto-layout graph (themed, no hand coordinates):
```js
chart.setOption({ series:[{ type:'graph', layout:'force', roam:true,
  label:{ show:true }, force:{ repulsion:120 },
  itemStyle:{ color:ACCENT }, lineStyle:{ color:'#C7C7C7' },
  data:[{name:'API'},{name:'DB'},{name:'Cache'}],
  links:[{source:'API',target:'DB'},{source:'API',target:'Cache'}] }] });
```

Whatever you pick, **the visual self-check is non-negotiable for diagrams** — auto-layout
can overflow its box and hand SVG can misalign, and neither shows up in the source.

**`COOKIEBITE.mermaid` now routes with the ELK layout engine** (loaded lazily; falls back
to the built-in dagre if the CDN is blocked) plus roomier rank/node spacing, HTML edge
labels with opaque backgrounds, and label wrapping. Together these largely fix the
colliding edge-labels that made dense state/flowcharts unreadable. ELK still isn't magic —
a graph with many cycles between the same nodes can crowd; keep transitions purposeful and
prefer a flowchart over a state diagram when there are >~6 cross-edges.

**Code samples / source listings**: use `COOKIEBITE.code` / `COOKIEBITE.codeTabs` for a
filename-chipped, line-numbered, **syntax-highlighted** block. It needs the **highlight.js**
tag in `HEAD-LIBS` (ships in the template; the highlight colors are themed from the report's
design tokens via `.hljs` in cookiebite.css — do NOT add highlight.js's own theme CSS, it
fights the tokens). Reach for `CB.diff` for a +/− change and `CB.pseudocode` for annotated
logic instead.

## Common pitfalls
- **CDN order**: load library scripts before the inline `<script>` that uses them, or wrap init in `DOMContentLoaded` / `defer`.
- **Chart sizing**: give chart containers an explicit height (e.g. `h-72`) or the canvas collapses to 0.
- **ECharts resize**: call `chart.resize()` on `window.resize` so charts stay sharp.
- **Lucide**: call `lucide.createIcons()` after the DOM and icon markup exist.
- **Font fallback**: always set a `font-family` fallback to `-apple-system, system-ui, sans-serif`.

## Chart-type gotchas (label collisions especially)

Long Korean labels are the #1 source of broken-looking charts. They overlap, clip,
or push a chart into a degenerate shape. Prevent it at build time, then confirm with
the visual self-check (`scripts/verify-report.sh`).

- **Sankey / flow with long node names**: nodes need room or labels collide into each
  other (e.g. "…불균형" overrunning "span 누수"). Set `label:{ overflow:'truncate' }`
  or `'break'`, raise `nodeGap` (e.g. 18–28), give the chart generous height, and put
  labels `position:'right'`/`'inside'` deliberately. If names are long sentences, a
  Sankey is the wrong choice — use a **vertical step/flow list or a numbered causal
  chain** instead. A causal chain of 5 Korean phrases reads far better as stacked
  cards with arrows than as a cramped Sankey.
- **Pie/donut**: many slices + long labels collide on the rim. Use a legend +
  percentage labels, or switch to a horizontal bar.
- **X-axis category labels**: rotate (`axisLabel:{ rotate:30 }`) or wrap, or use a
  horizontal bar so labels sit on the roomy y-axis.
- **Horizontal bar — let the grid measure the labels, don't hard-code `left`.** Use
  `grid:{ containLabel:true }` so ECharts reserves exactly the width the y-axis labels
  need; a fixed `grid:{ left: 120 }` either clips long Korean labels or wastes space on a
  phone. `CB.chart` also **shrinks `axisName`/`grid` padding on narrow (<640px) containers**
  (its `responsive` default — pass `responsive:false` to opt out), so a horizontal bar
  authored with `containLabel:true` survives the 390px pass without manual breakpoints.
- **Treemap/wordcloud**: small cells truncate text unreadably — set a min font and
  hide labels on tiny cells.
- **General rule**: pick the chart type that *fits the labels you actually have*, not
  the fanciest one. A clean bar beats an impressive-but-unreadable Sankey.

## Treemap (and any ECharts type that ignores the series `color` array)

A treemap (also sunburst, and other hierarchy types) ignores the top-level `color`
palette and paints each leaf from ECharts' **default rainbow** — off-theme. Derive each
leaf's `itemStyle.color` from an **accent ramp** instead, so the figure reads as one
themed family. Two ways:

```js
// (a) per-leaf color from an accent ramp (opacity steps off COOKIEBITE.accentRgba)
const data = leaves.map((d, i) => ({
  name: d.name, value: d.value,
  itemStyle: { color: CB.accentRgba(0.30 + 0.55 * (i / (leaves.length - 1))) },
}));
chart.setOption({ series:[{ type:'treemap', data, breadcrumb:{ show:false } }] });

// (b) or drive it with a visualMap accent gradient keyed to value
chart.setOption({
  visualMap:{ show:false, min, max,
    inRange:{ color:[CB.accentRgba(0.25), CB.theme.ACCENT] } },
  series:[{ type:'treemap', data:leaves }],
});
```

Use resolved colors (`accentRgba`/`theme.ACCENT`), not `var(--*)`/`color-mix` strings —
those render black inside the canvas (see the chart-color caveat above).

**One-call fast path — `COOKIEBITE.ramp(n)`** returns `n` on-theme colors from a single
accent hue (varying L/S, bounded), light → dark, re-reading the live accent so it follows
the dark toggle. Use it for **ordered / sequential** data — funnel slices, a stacked
single-metric series, an ordered bar set, a choropleth — where each step should read as the
same family getting darker:
```js
const colors = CB.ramp(steps.length);              // ['…','…',…] light -> dark
chart.setOption({ series:[{ type:'bar', data: steps.map((v,i)=>({ value:v, itemStyle:{ color:colors[i] } })) }] });
```
**Pick by relationship: `CB.categoricalColors(n)` for PEER series** (regions, vendors,
plans — distinct but on-theme; now a bounded hue arc around the accent, not the full
rainbow wheel) **vs. `CB.ramp(n)` for ORDERED series** (a sequence/magnitude). Misusing the
categorical palette for ordered data is the most common "silently worse" chart. The
`accentRgba` opacity-step approach above still works for a quick hand-rolled ramp; `CB.ramp`
is the named one-call version. The new `CB.funnel` / `CB.heatmap` helpers (`helpers.md`)
already ramp internally.
