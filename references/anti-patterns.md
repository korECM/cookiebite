# Anti-patterns — what goes wrong

Check the built report against this list **before** handing it over (the Workflow's
self-check step). This is the negative twin of SKILL.md's Quality checklist: if your
output matches an entry here, it is wrong — fix it, don't rationalize it. Every entry
is a failure mode that has actually shipped in a report and been caught.

## Color & encoding

**❌ Dual-axis charts (two y-scales on one plot).** The alignment of the two scales is
arbitrary, so the chart invents a correlation that isn't in the data. ECharts makes
this one `yAxis: [{}, {}]` away — don't.
✅ Two charts side by side (shared x), small multiples, or index both series to a
common base (`= 100` at t0) on **one** axis.

**❌ The library rainbow, or generating a 9th+ hue.** Past ~8 peer series no palette
keeps them tellable-apart (colorblind or not); the fix is structural, not more colors.
`CB.categoricalColors` warns past 8 — listen to it.
✅ Fold the tail into "Other", facet into small multiples, or use
`{ mode:'emphasis' }` to highlight the one series that matters.

**❌ A value-ramp on nominal categories.** Coloring each bar darker-where-bigger
(`CB.ramp` on products/teams/endpoints) double-encodes what bar length already shows
and burns the only free channel.
✅ One series → one color for every bar. `CB.ramp` is for **ordered** sequences only
(funnel stages, tiers, buckets).

**❌ Recolor-on-filter.** Re-deriving the palette from the currently-visible subset
(e.g. inside a `connectFilter` handler), so filtering out a series repaints the
survivors. A reader who learned "Acme is blue" is now misled.
✅ Color follows the **entity**, not its row number: assign slots once from the full
set and index into that fixed array when filtering.

**❌ Full categorical color when the story is one series.** Six equally-loud hues bury
the one line the section is about.
✅ `CB.categoricalColors(n, { mode:'emphasis', focus: i })` — the story wears the
accent, context recedes to gray. Often the honest answer to "make this chart clearer".

**❌ A hue at the diverging midpoint, or two same-temperature poles.** The midpoint
must read as "nothing"; the poles must read as opposite (blue↔aqua fails — both cool).
✅ `CB.diverging(n)`: accent pole ↔ temperature-opposite pole, near-neutral gray center.

**❌ Semantic color as decoration, or as "series 4".** A tone (success/critical/…)
carries meaning; spending it on identity teaches the reader a false signal — and a
series that *does* mean good/bad shouldn't wear a categorical slot either.
✅ Tones only when the color means status; categorical palette when it's identity.
Never both jobs in one chart.

**❌ Eyeballing colorblind safety ("these look different enough").**
✅ It's computable, so compute it: `scripts/verify-report.sh` runs
`scripts/validate-palette.mjs` (CVD ΔE, lightness band, contrast) on every palette the
report generated. Fix FAILs; a CVD WARN needs secondary encoding (direct labels or the
data table); a contrast WARN needs visible labels or the table view.

**❌ Text wearing the series color.** A light series hue (yellow, aqua) is illegible
as text; identity comes from the colored **mark** beside the text.
✅ Labels, values, legends, axis text stay on text tokens (`text-primary`/`secondary`);
the exception is a label *inside* a filled mark, where `inkOn` picks white-or-ink by
luminance.

## Form

**❌ A truncated bar baseline.** A bar/area whose value axis starts above zero —
part of every bar's length becomes fiction, and small differences read as dramatic.
`CB.chart` warns (`truncated-baseline`) when a `min` truncates a length-encoded mark.
✅ Keep the zero baseline for bars/areas. To zoom into a range, switch to a
position-encoded form: line, lollipop, rangeDot (position can float; length can't).

**❌ A one-bar bar chart, or a two-slice pie.** The number is the chart.
✅ `CB.bigNumber` / a KPI card / `CB.gauge` against its target.

**❌ A pie with >3 slices, or a donut for close values.** Rim labels collide and close
angles are unreadable.
✅ A horizontal bar (labels get the roomy y-axis), or the numbers themselves.

**❌ More than ~7 color classes carrying meaning.** Adjacent classes blur.
✅ A `CB.table` (sortable), or table + a chart of the top slice.

**❌ Structure described in prose.** Three-plus sentences of "A calls B, which
verifies with C" is a diagram that hasn't been drawn yet.
✅ `CB.mermaid` (flowchart / sequence / state / ER) or a hand SVG flow (motion.md §6).

**❌ A Sankey/treemap whose node names are sentences.** Long Korean labels collide or
truncate into noise (libraries.md "Chart-type gotchas").
✅ A vertical step list / numbered causal chain, or shorten the labels first.

## Marks & chrome

**❌ A number on every data point.** A value beside every dot or segment is chaos and
goes unread — direct labels work *because* they are sparing.
✅ Label the endpoint, the extreme, or the one series the story is about; the axis,
tooltip, and data-table view carry the rest.

**❌ A legend box for a single series.** One swatch restates the title and costs space.
✅ The chart's title/caption names a lone series; a legend appears at ≥2 series (and
is then always present — never color-matching alone).

**❌ Dashed gridlines or axis rules.** Dashing reads as "projection" or "threshold"
when it's just a grid, and adds noise.
✅ Solid hairlines one step off the surface — `baseChart`'s default; don't override
with `type:'dashed'` for plain grids (reserve dashes for actual thresholds/forecasts).

**❌ Thick saturated blocks, bars filling the whole band.** Reads loud at scale.
✅ The runtime's mark defaults (`CB.markSpecs`, applied by `CB.chart`): bars cap at
24px with a rounded data-end, stacked segments separate by a surface gap, 2px lines,
8px ringed dots. Don't fight them without a reason.

**❌ A label clipped by its own mark** — `overflow:hidden` cropping an in-segment
label's first/last characters is worse than no label.
✅ Only label inside a mark when it fits with padding; else outside the bar end, or
drop to tooltip/legend (the value stays in the table view).

**❌ A fixed chart height that excludes the x-axis band**, giving the card a tiny
nested scroll.
✅ `grid:{ containLabel:true }` (baseChart default) + a height that includes the axis
labels; let the container grow rather than clip.

**❌ Thirty category rows crushed into a 300px chart.** Bars and labels merge into
noise. `CB.chart` warns (`crowded-bands` / `too-many-rows`).
✅ Omit `height` and let the elastic default grow with the row count (~28px/row,
capped); past the cap, show a top-N and put the full set in `CB.table`.

**❌ `tabular-nums` on a hero/KPI figure.** Equal-width digits make a big standalone
`121` look loose at display sizes.
✅ Display-size figures stay proportional (the helpers already do); `.nums` is for
columns that must align vertically — table cells, axis ticks, delta columns.

**❌ Unsized icons, or standard-Tailwind icon sizes.** Here `w-4` = **4px** (the scale
maps `wN → N px`), and an undefined key falls back to rem and explodes (the historical
56px checkmark).
✅ Explicit `w-16 h-16` / `w-20 h-20` / `w-24 h-24`; one icon per section/card; never
let an icon dwarf the number beside it.

**❌ `text-title-16`.** Not a generated class — it silently no-ops to body text.
✅ The type scale jumps `body-18` → `title-20` → `title-24`; for a quiet h3 step use
`body-18 font-semibold`.

## Interaction & accessibility

**❌ A tooltip as the only way to read a value.** Hover gates keyboard and
screen-reader users out.
✅ Tooltips enhance, never gate: `CB.chart` ships the data-table toggle + `aria-label`
automatically; a hand-written chart owes `CB.dataTableToggle(...)` + `aria-label`.

**❌ Per-chart filters inside a chart card.** Readers can't tell what a control
scopes, and sibling charts silently disagree.
✅ One filter row above everything it scopes (`CB.connectFilter`); every chart below
re-renders against the same slice.

**❌ Status by color alone.** Colorblind readers and grayscale printouts lose the
meaning.
✅ Pair every tone with an icon or label: `✓ 정상`, a `위험` tag — the tone contract
(components.md).

**❌ An editable/interactive report with no way out.** Reordered items, tuned
numbers, composed prompts that the reader can't extract are a dead end.
✅ End with an export: `CB.copyButton` + `sectionToMarkdown`, `csv:true`, or
`CB.copyReport` (interactions.md §13–14).

**❌ Manufactured interactivity.** A three-number status doesn't need a data grid or
filter chips.
✅ Match depth to the data: if there's no dimension to slice, a static layout is
correct (SKILL.md "Interactivity" tie-breaker).

**❌ A chart inited inside a hidden tab/accordion** — zero-size canvas, empty box on
first show.
✅ `CB.tabs`/`CB.reveal` (lazy `render(panelEl)` + `resize()` on first show), or
re-`resize()` on your own toggle.

## Runtime & helper footguns

**❌ Removing a section but keeping its script block.** `CB.*` calls **throw on a
missing host** — one stale call can kill every later chart in the report script.
✅ When you replace `SECTIONS`, delete each removed section's matching
`REPORT-SCRIPT` block in the same edit.

**❌ Deleting the `countup` CDN tag while KPIs remain** — every KPI renders a literal
`0`. (Delete `echarts`/`countup` only for a pure-prose explainer; SKILL.md "Which CDN
tags to keep".)

**❌ Fabricating a KPI baseline.** A made-up delta/spark is worse than none.
✅ **Omit** `delta` for no badge; `delta: null` renders the `—` no-baseline sentinel;
when *no* KPI has a baseline, omit on all (a row of `—` reads as stray underscores).

**❌ Formatted strings in sortable numeric columns.** Grid.js sorts `'72,000'`
lexically (`'9,402'` ranks above it).
✅ Raw `Number`s + `numericCols` (or a per-column `formatter`) — `CB.table` handles it.

**❌ A search box on a 5-row table / a pager reading "1–7 / 7".**
✅ `CB.table` auto-thresholds (search >10 rows, pager >15); only force with
`search:true/false` for a reason.

**❌ `window.GLOSSARY` assigned inside `DOMContentLoaded`.** The linker already ran —
it silently no-ops.
✅ Assign at parse time (top-level `<script>` before the runtime) or call
`CB.glossary(map)` (works late, idempotent). Either path needs the Tippy CDN tags.

**❌ `var(--*)` / `color-mix(...)` strings inside an ECharts option.** The canvas
parses colors itself — they render black.
✅ Resolved values only: `CB.accentRgba(a)`, `CB.css('--accent')`, `CB.theme.ACCENT`,
`CB.categoricalColors/ramp/diverging`.

**❌ A hand-written canvas chart that never registers.** It keeps light-mode colors
after the dark toggle.
✅ `CB.registerChart(chart, renderFn)` (or listen for `'cookiebite:theme'`); `CB.chart`
registers automatically. `findings`' `tone` doubling as the **severity label**
(success → "Note") is the one tone-changes-text case — pass `label` to override.

## Locale & copy

**❌ `목차` (or any Korean UI word) left on an English report.** The TOC heading lives
in the editable slot; `REPORT_LOCALE` drives the rest.
✅ The localize checklist in SKILL.md Workflow step 6: `<html lang>`,
`window.REPORT_LOCALE`, and every hand-typed UI word.

**❌ Inconsistent number formatting.** `97%` here and `97.1%` there; a count without
thousands separators; a figure wrapping mid-number; `%` where `%p` is meant.
✅ craft.md "Number & locale formatting": one precision per metric, `CB.nf`/`money`
helpers, `whitespace-nowrap` on figure+unit.

**❌ A caption describing something the chart doesn't render.** "버블 크기는 볼륨"
over a bar chart is a bug, not copy.
✅ Re-read every caption against its visual during the self-check (the
copy-must-match rule, craft.md).

**❌ Decorative structure.** Numbered markers (01/02/03) on content with no real
order; an eyebrow/divider that encodes nothing.
✅ Structural devices encode something true — number only sequences, label only
categories that exist.

**❌ Filler sections.** A background section nobody asked for, a chart restating the
previous chart, a "considerations" list padding the outline to look complete —
forced structure generates forced content, and every filler section dilutes the
reader's trust in the real ones.
✅ The outline comes from the material: two honest beats → two sections. A claim in
the summary with no real evidence section behind it is the same smell — write fewer
claims, not thinner sections.

**❌ The generic-AI look.** Emoji as section markers, a gradient hero, everything
centered, `rounded-lg` on everything, one-off hexes beside the tokens.
✅ The theme system exists precisely so reports don't read as generic AI output: stay
on the tokens, one accent, semantic color only for status.
