---
name: cookiebite
description: >-
  Build a polished, graphic-rich, interactive single-file HTML report — charts, stat
  cards, clean layout — from a configurable design system (Tailwind + ECharts + light
  JS). Use whenever the user wants data, numbers, metrics, results, findings, notes, or
  a recap turned into a visual page to read or share: a report, dashboard, summary,
  one-pager, or "make an HTML". Trigger even when they never say "report" — e.g.
  "정리해줘", "한 장으로/한 페이지로", "차트로 보기 좋게", "html로 보여줘", "임원 보고용으로
  예쁘게", "lay this out", "visualize these numbers", "for an exec review". Covers
  business/billing/payment metrics (revenue, refunds, success rates, chargebacks),
  sprint retrospectives, research write-ups, and status updates. The look is a swappable
  theme (Persimmon/Korean default built-in; a neutral preset and a theme-studio editor
  included). Do NOT use for building product/console/app UI or components, editing
  markdown/prose, fixing code that emits HTML, or transactional email/notification HTML.
---

# HTML Report

Turn whatever the user gives you — data, analysis, notes, research, metrics, a
status update — into a **single self-contained HTML file** with the visual richness
and interactivity of a great report. The goal is a page someone enjoys reading and
can grasp at a glance, styled by a consistent, swappable design theme.

This skill is for **reading material** (reports, summaries, dashboards, recaps,
research write-ups). It is **not** for building product/console application UI — if
the user wants an actual app screen or component, this isn't the right skill.

## Quickstart (the build path)

Action first; the philosophy below explains *why*, but you can start now. **Reach for
the fast-path helpers first** — they emit ~80% of a typical report on-theme and
dark-aware (see "Building blocks → Runtime fast path"); drop to raw HTML only for the
bespoke parts.

1. **Find the 1–3 takeaways** the reader must leave with → those become the headline
   visuals.
2. **`cp assets/template.html <report>.html`**, then `Read` the copy (a fresh file —
   `Edit` fails until you read it) and surgical-`Edit` only the `<!-- COOKIEBITE:* -->`
   slots (`HEAD-THEME`, `HEAD-LIBS`, `TITLE`, `TOC`, `HEADER`, `SECTIONS`, `FOOTER`,
   `REPORT-SCRIPT`). Set `<html lang>` to the report's language.
3. **Pick the theme** (default Persimmon, or a preset / saved default) and **pick the
   chart/diagram type by the data** — see "Which chart when" in step 4 below.
4. **Author the repetitive sections with the helpers** (`COOKIEBITE.kpis`/`findings`/
   `timeline`/`table`/`chart`/`mermaid`/…); their input shapes are in
   **`references/helpers.md`**. Theme every chart from the accent — never the library
   rainbow. **The shipped template is a payments DEMO** — replace its `SECTIONS` /
   `REPORT-SCRIPT` slots wholesale for any other report type (and delete a section's
   matching script block when you remove it).
5. **Hit the interactivity minimum bar** for the report type (see "Interactivity"), and
   give any reader-editable report an export.
6. **Inline → visually self-check → hand over**: `bash scripts/inline.sh <report>.html
   -o <report>.final.html` (mandatory), then `bash scripts/verify-report.sh` and look at
   the pixels, fix, repeat; finally `open` the inlined file for the user.

The full workflow (with every guard rail) is in "Workflow" below; the rest of this file
is the reasoning behind each step — read it once, not per build.

## The core idea: graphic-first, on-theme

Two things make these reports good, and they pull in slightly different directions —
hold both:

1. **Graphic over textual.** Whenever a point can be a chart, a stat card, a
   timeline, a diagram, a progress ring, or a comparison table instead of a
   paragraph, make it the visual. Lead with the headline number. Let the reader
   *see* the story. Long prose is the fallback, not the default.
   **The most-missed case is structure described in words** — "A calls B, which
   verifies with C, then returns to A", "request flows through gateway → auth →
   service", a state machine, a decision tree, an entity relationship. Prose like
   that is a **diagram that hasn't been drawn yet**: reach for `COOKIEBITE.mermaid`
   (flowchart / sequence / state / ER — themed and dark-aware, one call, no setup) or
   a hand SVG flow (`references/motion.md` §6). Before shipping a section that is
   three-plus sentences of "X does Y to Z", ask whether it should be a picture — it
   usually should. Do **not** reach for GIFs/screenshots for system flows; draw them
   natively so they stay on-theme, crisp, and dark-aware.

2. **On-theme via design tokens.** The look comes from a small set of design tokens
   (accent, neutrals, semantic colors, typography, spacing, radii) — not from one-off
   choices per element. Hold that discipline: one accent color per report, semantic
   colors only for status (never decoration), consistent type/spacing scale. That's
   what makes a report read as designed instead of a generic AI dashboard. The tokens
   are swappable (see "Theming"): a Persimmon (Korean) default ships built-in, a neutral preset is
   included, and `assets/theme-studio.html` lets the user design their own.

3. **Interactive, so the reader can explore.** A static chart answers one question;
   an interactive one answers the ones you didn't anticipate. Default to giving the
   reader controls — filters, view toggles, sortable tables, drilldowns, hover
   detail, an interactive timeline — not just things to look at. This is the part
   most easily under-done, so push on it: see "Interactivity" below.

When in doubt, ask: *"Is this clearly on-theme and consistent, and would a busy
reader get the point in five seconds?"* Aim for yes on both.

## Output contract

- **One self-contained `.html` file.** No build step. The slimmed template references
  the cookiebite runtime via two **placeholder** lines (`./assets/cookiebite.css` +
  `./assets/cookiebite.js`) so the invariant boilerplate is **hosted, not
  model-emitted**; `scripts/inline.sh` then folds those local files into the report to
  produce the portable, double-clickable deliverable (see "Delivery"). The heavy
  third-party libs (Tailwind, ECharts, Alpine, Lucide, …) stay on CDN — see
  `references/libraries.md`.
- Default filename: a descriptive kebab-case name from the content
  (e.g. `q2-billing-incident-review.html`), saved where the user is working.
- Match the copy language to the source (Korean source → Korean copy). The theme's
  font + locale should match (the Persimmon default is Korean/Pretendard; the neutral preset
  is Latin/Inter) — see "Theming".
- After inlining, **open the inlined file** (`open <file>.html` on macOS) so the user
  sees it immediately, and tell them the path.

### Delivery

The slimmed template references the runtime via two **placeholder** lines:

```html
<link rel="stylesheet" href="./assets/cookiebite.css" />
<script src="./assets/cookiebite.js"></script>
```

These don't resolve once the report is `cp`'d out of the skill dir — they're markers
for the inline step, which is **mandatory**. After filling the slots, run:

```bash
bash scripts/inline.sh <report>.html -o <report>.final.html
```

(Omit `-o` and it writes `<report>.inlined.html` next to the input.)

It reads the **local** repo copies of `cookiebite.css`/`.js` (resolved from the
script's own location, not the report's) and replaces the two lines with inline
`<style>`/`<script>`, preserving the ordering — `cookiebite.js` loads immediately
**after** the Tailwind Play CDN tag and carries no `defer`/`type=module` so it runs in
order: its first statement sets `window.tailwind.config` synchronously, and Tailwind
reads that config during its scan (which runs after load), not at parse time. The
per-report inline `:root` THEME block stays in `<head>` so the theme applies at first
paint (no FOUC). **The inlined file is the deliverable** — verify and open *that*, not
the raw report.

**Documented limitation:** only cookiebite's own runtime is inlined; the heavy
third-party libs (Tailwind Play CDN, ECharts, Alpine, Lucide, optional Grid.js/Tippy)
stay on CDN. So "self-contained" means the file survives the runtime repo moving or
changing and works online; genuine full-offline (e.g. on a plane) needs a vendored
prebuilt Tailwind CSS, which is out of scope.

## Workflow

1. **Find the story.** Skim the input and decide the 1–3 things the reader must take
   away. Those become the headline visuals. Everything else supports them.
2. **Pick a structure.** Most reports want: a header (title + one-line takeaway +
   date/context), a row of key-stat cards, then sections — each led by a visual.
   A short executive summary up top earns its place when the report is long.
3. **Pick the theme.** If the user asks for a specific theme/preset, use it. Otherwise,
   if a saved default exists at `assets/presets/default.json`, apply that; failing that,
   use the template's built-in **Persimmon** default. If the user has a brand/preset or
   asks to adjust colors/font, apply it — see "Theming" (theme priority, applying a pasted
   theme, and defaulting are in `references/design-system.md`). One accent per report;
   switch only with a reason.
4. **Choose libraries** from `references/libraries.md`. ECharts for rich/interactive
   data, Chart.js for a few simple charts, Alpine.js for tabs/filters/toggles,
   CountUp for hero numbers, AOS for scroll reveal, Grid.js for sortable tables,
   Tippy.js for glossary tooltips. For richer **opt-in animation** (sequenced intros,
   scroll-triggered reveals, Lottie vector art) see `references/motion.md` — add it
   only when motion genuinely helps. Don't load what you won't use. For the CDN-tag
   keep/delete rule, see "Which CDN tags to keep" below.

   **Which chart when (pick by data shape, then read the gotchas):**
   - **bar** — compare a handful of categories; go **horizontal** when labels are long
     (the safe default for Korean labels) or there are many categories.
   - **line / area** — a trend over time; add `dataZoom` on anything wide.
   - **funnel** (`COOKIEBITE.funnel`) — a monotonically *shrinking* stage sequence
     (signup → activation → purchase); shows step-to-step + overall conversion %.
   - **gauge / progress ring** (`COOKIEBITE.gauge`) — one value against a target/max
     (SLA %, quota, completion); not for comparing series.
   - **heatmap** (`COOKIEBITE.heatmap`) — **calendar only**: a value per day over
     weeks/months (calendar density, streaks, seasonality).
   - **matrix** (`COOKIEBITE.matrix`) — a non-calendar rows×cols grid (cohort/retention,
     a confusion matrix, any relationship grid). The grid sibling of `heatmap` (which
     stays calendar-only).
   - **histogram** (`COOKIEBITE.shapes.histogram`) — the *distribution* / spread-and-shape
     of one sample (auto-bins; optional mean line).
   - **dumbbell / slope** (`COOKIEBITE.shapes.dumbbell` / `.slope`) — a *two-point change*
     (before→after): `dumbbell` is the per-row capsule (many items), `slope` the two-axis
     bump for a few series (`mode:'rank'` for rank shifts).
   - **lollipop** (`COOKIEBITE.shapes.lollipop`) — a de-inked *ranking* where a full bar
     is too heavy; `baseline` turns it into a deviation chart.
   - **rangeDot** (`COOKIEBITE.shapes.rangeDot`) — where each item sits *within a range*
     (a min–max capsule + value dot; optional p25–p75 band) — SLO/score bands.
   - **stackedBar** (`COOKIEBITE.shapes.stackedBar`) — *composition* of each category
     (`mode:'percent'` to normalize; `peer:true` for peer parts, else an ordered ramp).
   - **threshold / annotate** (`COOKIEBITE.threshold` / `.annotate`) — *annotation*, not a
     new chart: `threshold(option,…)` merges a reference line/band onto any option before
     `CB.chart`; `annotate(sel,…)` pins a specific point (a peak, an incident) after init.
   - **mermaid** (`COOKIEBITE.mermaid`) — *structure*, not magnitude: who-calls-whom,
     a lifecycle, a decision tree, an ER shape. If you're describing it in three-plus
     sentences, draw it instead.
   - Avoid pie for >3 slices (use a horizontal bar) and avoid Sankey/treemap with long
     labels unless you've checked they don't collide.
   - The full `CB.shapes.*` picker (by the reader's question) is in
     `references/libraries.md` ("which chart-shape builder when").

   **Before building any chart/diagram, read `references/libraries.md`** — "Chart-type
   gotchas" (*long Korean labels are the #1 source of broken-looking charts*)
   and "Diagrams: pick by layout, not by habit". The one-line rule: **pick the chart that
   fits the labels you have.**

   **Which CDN tags to keep (the one rule — also in template.html's head comment):**
   a KPI/status report (uses `COOKIEBITE.kpis`) **keeps `countup`** — its numbers roll
   up via CountUp, and without it they render as a literal `0`. Delete `echarts` only
   when there's no chart and no KPI sparkline. **Delete both** the `echarts` and
   `countup` tags **only** for a pure-prose explainer with no KPIs and no charts.
5. **Plan the interactions** before building. Read `references/interactions.md` and
   pick the ones that fit the data (see "Interactivity" below for the minimum bar).
6. **Build the page** — the `cp` → `Read` the copy → surgical-`Edit` the slots mechanics
   are in Quickstart (step 2); the slot markers are `HEAD-THEME`, `HEAD-LIBS`, `TITLE`,
   `TOC`, `HEADER`, `SECTIONS`, `FOOTER`, `REPORT-SCRIPT`. The deltas worth knowing here:
   - The invariant boilerplate (Tailwind config, number helpers, `baseChart`, dark toggle,
     TOC observer, card hydration) is **no longer in the template** — it lives in
     `cookiebite.js` and costs 0 tokens. Author repetitive sections with the fast-path
     helpers; drop to raw HTML + exposed primitives (`baseChart`, `css()`, `accentRgba()`,
     `registerChart()`, the CSS-var tokens) for bespoke parts. The two paths share tokens
     and helpers — mix them freely. See "Runtime fast path vs hand-building".
   - **Localize `<html lang>`** (template.html:23, the `<!-- /COOKIEBITE:LANG -->` line —
     outside the named slots so it's easy to miss): set it to the report's language (`en`
     for an English report, etc.). `apply-theme.py` rewrites it from the preset locale, but
     a hand-edited report must set it by hand.
   - When you replace the demo `SECTIONS`/`REPORT-SCRIPT` wholesale (Quickstart step 4),
     **delete each removed section's matching script block too**: the report script calls
     `CB.chart`/`CB.table`/etc. against the section's host id, and those **throw on a
     missing host** if the section is gone but its `CB.*` call remains. For a non-dashboard
     starting point that *isn't* the payments demo, see the second worked example (an
     explainer/postmortem skeleton: TL;DR box + mermaid diagram + findings) in
     **`references/components.md`** so a narrative report doesn't get bent into
     KPI-cards-plus-trend-chart.
7. **Theme every chart** with the accent + neutral grid (from CSS vars) — never the
   library's default rainbow palette. Use the template's `baseChart` theme object.
8. **Fold in the runtime** (mandatory): `bash scripts/inline.sh <report>.html -o
   <report>.final.html` to produce the self-contained deliverable (see "Delivery").
   The raw report's two runtime placeholder lines don't resolve until inlined.
9. **Visually self-check the inlined file** (required — see below). Render, look at the
   actual pixels, fix what's broken (edit the source, re-inline), repeat until clean.
10. Open the inlined file for the user and hand it over.

## Interactivity

This is the dimension most easily left thin, so treat it as a first-class goal, not
a garnish. A report the reader can poke at — filtering, sorting, toggling, drilling
in — is far more useful than a static one, and it's what makes these feel alive.

**Tie-breaker (resolves the push-vs-restraint tension below):** if the data has ≥1
dimension a reader would want to slice / sort / zoom, hit the minimum bar; if it's a
fixed summary with no dimension to explore (a three-number status), a static layout is
correct — don't add controls.

**Minimum bar by report type:**
- **Data dashboard**: at least one segment/filter control, one chart with built-in
  interactivity turned on (legend toggle, `dataZoom`, drilldown, or cross-chart
  `connect`), and any table over ~8 rows made sortable/searchable (Grid.js). The
  reader should be able to answer a question you didn't pre-chart.
- **Narrative report** (postmortem, recap): an interactive timeline or flow
  (hover/click for detail), expandable detail rows for action items / causes /
  findings, and tabbed or filtered sections when there are peer views.
- **Explainer** (how something works, a concept, a feature walkthrough): a TL;DR box
  up top, collapsible sections so the reader controls depth, tabbed code samples where
  relevant, and glossary tooltips on jargon. **An explainer without a single diagram is
  a red flag** — these reports live or die on diagrams. For any sequence, relationship,
  or decision, draw it: `COOKIEBITE.mermaid` (sequence diagram for "who calls whom",
  flowchart for branching logic, state diagram for lifecycles, ER for data shapes) is
  the one-call default. For a request/system flow you want *animated*, draw it as
  labelled stages with a packet that travels through them (ByteByteGo-style animated
  flow, `references/motion.md` §6) — build it natively, not as an embedded GIF.
  Scaffolding that makes a new topic navigable reads very differently from the same
  words dumped linearly.
- **Comparison / decision** (which approach/vendor/plan): lay the options side by side
  in columns with the same rows aligned, color the trade-offs with semantic tokens,
  and end with a recommendation. See `references/interactions.md` §12.
- **Code review / change report** (explain a PR, an incident fix, an audit): lead with a
  **severity-coded findings list** (sorted worst-first), show the change as a **diff
  view**, explain non-obvious logic as **pseudocode/annotated code**, and — when the
  report proposes next steps — let the reader assemble them via a **prompt editor** or
  **copy-as-diff** export. All six live in `references/components.md`; the editing pieces
  are `references/interactions.md` §14.

Don't manufacture interactions for data that has nothing to explore — a three-number
summary doesn't need a data grid. Match depth to the data. But when there's real
data, lean in: `references/interactions.md` has copy-adaptable patterns for filters,
view toggles, ECharts zoom/brush/drilldown/connect, sortable tables, accordions,
scenario sliders, side-by-side comparison, and sticky section nav.

**If the reader can edit or rearrange anything in the report, end it with a way to get
the result out** — a copy-as-markdown or download button that turns the current state
back into something they can paste or commit (interactions.md §13). An interactive page
with no export is a dead end. Every interaction should help the reader find, compare,
or take away something — that keeps it within the report's restraint.

A report may go one step past *reading* into a small **editing interface** — a config
form that tunes its own numbers, a prompt editor that composes the next-step prompt, a
reorder-then-copy-as-diff of its own items (`interactions.md` §14). That's in scope as
long as the artifact stays a report and the editing is about the report's own content.
Building a standalone tool/app screen ("make me a draggable triage board") is product UI
and **out of scope** — hand it off. The boundary: edit → preview → export, always.

## Visual & readability craft

The habits that make a report read as **designed** rather than AI-generated — leading
numbers with meaning, takeaway captions, annotated charts, deliberately-sized icons,
Grid.js tables, `tabular-nums` alignment, capped line length, shallow hierarchy, inline
jargon tooltips — plus **number/locale formatting**, **accessibility** (never color-alone;
every chart needs a data-table alternative + `aria-label`), and the **copy-must-match-the-
visual** rule are all in **`references/craft.md`**. Read it while filling the template with
real content. The Quality checklist below re-encodes the must-pass items as checkboxes.

**`.cb-prose` / `.cb-lead` readability defaults.** For longform/narrative body text, the
`.cb-prose` and `.cb-lead` classes clamp line length to `--measure-prose` (default 68ch;
`.cb-lead` falls back to 58ch) so paragraphs stay readable instead of spanning the full
page width. `COOKIEBITE.lead(html)` emits the standfirst class for you; pass
`{ measure:false }` to opt one paragraph out (full-bleed) when you want it wide. The
measure is a Look knob (`--measure-prose`) — see "Theming → Look system".


## Visual self-check (required)

You cannot tell whether a report looks right by reading its source. Charts overlap
their labels, Korean text collides or clips, a Sankey/treemap renders degenerate, a
flex row bleeds off the edge — none of this shows up in the HTML or in a `node
--check`. The only way to catch it is to **render the page and look at the pixels**,
the way the reader will. Skipping this is the single biggest quality risk.

Run the bundled script — it uses `agent-browser` (lightweight; do not use Playwright)
to open the file and capture both a full-page overview and **legible viewport-sized
tiles**, because a single tall screenshot gets downscaled when read and hides the
small collisions that matter most:

```bash
bash scripts/verify-report.sh <path-to-report>.html
# captures TWO viewports so responsive breakage shows up too, + a dark pass:
#   <dir>/.verify/full-desktop.png, desktop-tile-00.png, …   (1280px, primary, LIGHT)
#   <dir>/.verify/full-narrow.png,  narrow-tile-00.png,  …   (390px, mobile stack, LIGHT)
#   <dir>/.verify/full-dark.png,    dark-tile-00.png,    …   (1280px, dark — if toggle present)
#   plus checks-desktop.json / checks-narrow.json / checks-dark.json
```

You can point it at the **raw** report (runtime placeholders still in place): if the file
isn't inlined yet, the script folds the runtime into a throwaway `.verify/_inlined.html`
and renders that — so the edit→verify loop stays a single step and no `.inlined.html`
litters the repo. The `inline.sh` deliverable step is still run explicitly at hand-over.
The desktop and narrow passes are forced to the **light** theme (so a dark-set OS doesn't
make the primary pass render dark and leave the intended default unverified); dark gets its
own pass. The `checks-*.json` `horizontalOverflow` flag is the primary layout-break signal
— `overflowers` now excludes Grid.js's internally-scrolling table nodes (`tableScrollsInternally`
flags that benign case), so a wide sortable table no longer trips a false alarm at 390px.

Then **Read `full-desktop.png` and every `desktop-tile-*.png`** at legible size,
**skim the `narrow-tile-*.png`** to confirm the layout survives a narrow viewport, and
**skim the `dark-tile-*.png`** (emitted when the report has the dark toggle) to confirm
dark mode reads — charts re-themed, contrast intact, no status color washed out.
Scan for:

- **Text/label overlap or collision** — especially chart axis/series labels and long
  Korean strings (the most common failure; automated checks will NOT catch it).
- **Clipped or cut-off text**, content bleeding past a card or the page edge, a
  chart label clipped at the edge (reposition it, e.g. `markLine` label to the start).
- **Broken/empty/degenerate charts** — blank canvas, a Sankey/treemap that collapsed,
  unreadable legends, a chart with no height.
- **Caption ↔ visual mismatches** — a caption describing something the chart doesn't
  actually render (see "Copy must match the visual").
- **Off-brand or muddy color**, poor contrast, awkward gaps, broken alignment.
- **Narrow viewport**: TOC collapses, cards stack, charts/tables don't overflow or
  get clipped.

The `checks-*.json` files flag cheap structural problems (horizontal overflow,
collapsed chart containers) at each width — useful, but a backstop, not a substitute
for looking. Fix every issue you see, re-run the script, and repeat until the tiles
are clean. Only then hand the report over.

## Theming

The look is fully driven by **design tokens** exposed as CSS variables, so the whole
report re-themes by swapping one block. `assets/template.html` already wires Tailwind
to these tokens, so you can use classes like `bg-surface`, `text-primary`,
`text-secondary`, `border-line`, `text-accent`, `bg-accent`, `rounded-small`,
`shadow-md`, and the `body-14` / `title-24` / `headline-36` type utilities directly.

The token contract (CSS vars on `:root`, set in the template's THEME block):

- Font: `--font-family` (+ a font stylesheet `<link>`)
- Accent: `--accent`, `--accent-strong`, `--accent-weak`, `--accent-on`, and the optional
  `--accent-text` — a darker, WCAG-safe variant of the brand accent for accent-**as-text**
  use-sites (KPI numbers, outline-button labels) on the light bg. The brand accent stays
  the **fill**; `--accent-text` is only the text/ink variant. It comes from a preset's
  optional `colors.accentText` field (theme-studio emits it in `buildCSS()` and scores it
  in the light-mode contrast badge; shipped on `supabase` = `#157F56`). Omit it and accent
  text falls back to `--accent`.
- Neutrals: `--c-bg`, `--c-surface`, `--c-primary`, `--c-secondary`, `--c-disabled`,
  `--c-placeholder`, `--c-line`, `--c-line-weak`, `--c-disabled-bg`
- Semantic: `--c-critical`, `--c-cautionary`, `--c-positive`, `--c-informative`
- Locale (JS): `window.REPORT_LOCALE = { number, currency, symbol, bigUnits }` drives
  the number helpers (thousands separators, `만/억` vs `K/M/B`).

**Dark mode (built-in, free for every preset).** The runtime ships a top-right
light/dark toggle and a generic `html[data-theme="dark"]` layer (in `cookiebite.css`/`.js`,
*outside* the swappable THEME block), so it survives preset swaps and works for **any**
theme without a per-preset dark JSON. It overrides only the neutrals + `--accent-weak`
(re-derived from `--accent` via `color-mix`); the accent itself stays, so brand identity
holds in both modes. First load honours `prefers-color-scheme`; the choice persists to
`localStorage`. Canvas charts don't follow CSS vars, so on toggle the runtime re-reads
tokens (`COOKIEBITE.readThemeVars()`, which rebuilds `baseChart`) and re-renders every
**registered** chart. **Keep that contract for hand-written charts**: after
`echarts.init` + `setOption`, call `COOKIEBITE.registerChart(chart, renderFn)` (or
`COOKIEBITE.onThemeChange(cb)`, or listen for the `'cookiebite:theme'` event) so the
chart re-reads fresh tokens and re-renders on toggle — read colors through
`COOKIEBITE.css()`/`baseChart`/`theme`, never hard-coded hexes, or they won't flip.
`COOKIEBITE.chart()` registers its chart automatically. Pure CSS/SVG/`@keyframes` using
`var(--*)`/`color-mix` re-theme automatically and need no registration. (`window.readThemeVars`/
`baseChart`/`ACCENT` remain defined for backward-compat with older hand-rolled reports.)
The visual self-check captures a dark pass automatically (see below). **First load follows
the reader's OS preference** (`prefers-color-scheme`), not a fixed light default — so on a
dark-set machine the report opens dark. To **force a fixed mode** (e.g. a light-locked exec
PDF), set `window.REPORT_THEME = 'light'` (or `'dark'`) in the THEME block; it overrides both
the OS preference and any saved choice on load. The toggle still lets the reader switch.

**`accentDark` — a dark-only accent override (for near-black accents).** A preset whose
accent is near-black (e.g. an ink/black brand) vanishes on the dark surface. Give such a
preset an optional JSON field `accentDark` (a hex string): `apply-theme.py` /
theme-studio then emit, **after** the `:root{…}` block, the line
`html[data-theme="dark"]{ --accent:<accentDark>; --accent-strong:<accentDark>;
--accent-on:<accentOnDark>; }`, so that hex becomes the accent **only in dark mode**. The
`--accent-on` (accent-as-text/ink) **must flip too** — accent-filled text sits on
`--accent`, so if the dark accent is light, the ink has to go dark or the text turns
invisible against it. `accentOnDark` is the optional companion field for that ink; it
defaults to a dark ink (`#111111`) when `accentDark` is present. Presets without
`accentDark` emit nothing extra (unchanged behavior).

**The Look system (structure knobs — orthogonal to color).** Beyond color/font, a report
has an optional **Look**: a set of *structural* knobs — **density** (compact/comfortable/
spacious), **corner radius**, **elevation**, **surface** treatment, **border** weight/style,
**chart-palette mode** (analogous/mono/categorical/sequential), **heading font**, text
**measure** (prose/page width), **page background** (plain/wash/pattern), **header** style,
**semantic preset** (classic/muted/vivid/colorblind-safe), and **dark-mode tint**. Color
asks "what hue?"; the Look asks "how sharp / dense / bordered / wide?".
**Backward-compat is the contract: every knob defaults to today's look, so a report with
no Look is byte-identical to before** — you opt in per knob, never wholesale. A Look is
carried by `window.REPORT_LOOK = { …only the divergent knobs… }` (read once at init by
`CB.applyLook`, which projects each field onto an `html data-*` attr or `:root` var) and,
in a preset, by a sparse `theme.json` `look:{}` object (omitted entirely when all-default).
The **theme studio has a Look tab** for all of it. Full knob table, CSS-var/data-attr
contract, defaults, and the theme.json block are in
**`references/design-system.md` → "The Look system"**; the `CB.applyLook` /
`categoricalColors`/`ramp` `mode` signatures are in `references/helpers.md`.

**Choosing/changing the theme:**

- **Default**: the template ships with the **Persimmon** preset (Pretendard, Tomato
  accent, ko-KR/₩, East-Asian units). Use it unless the user wants otherwise.
- **Preset library**: `assets/presets/*.json` — 10 ready themes: `persimmon` (default)
  and `neutral` (Inter, indigo accent, en-US), plus brand
  presets distilled from real design systems (`stripe`, `vercel`, `linear`, `notion`,
  `supabase`, `sentry`, `resend`, `raycast` — sourced from voltagent/awesome-design-md,
  remapped to a light report surface with a free CDN font). To apply one, set the THEME
  block's `:root` vars, font `<link>`, and `REPORT_LOCALE` from its JSON. If the user
  names a brand ("make it look like Stripe / Linear"), use that preset.
- **Deep-fidelity theming**: each brand preset has the full source design spec at
  `assets/design-packs/<brand>/DESIGN.md`. Read it when you want more than tokens —
  the brand's layout, component, and typographic principles for a higher-fidelity look.
- **Custom / interactive**: when the user wants to browse themes or design/tweak their
  own (colors, font), open **`assets/theme-studio.html`** — a live editor with the
  10-preset gallery (click to preview + apply instantly), per-token pickers, and a
  preview. It persists to `localStorage`, so their last theme is remembered.

- **Applying a pasted theme.json, or setting a global default** — the token-to-THEME-block
  mapping and the default-theme mechanism (`assets/presets/default.json`; priority:
  explicit request > saved default > the template's built-in Persimmon) live in
  **`references/design-system.md` -> "Applying & defaulting themes"**. In short: map the
  JSON's font/accent/neutrals/semantic/locale onto the THEME block's `:root` +
  `REPORT_LOCALE`; to set a global default, write the JSON to `assets/presets/default.json`.


## Building blocks (compose these; don't copy literally)

> For the full declarative cheat-sheet — the unified `tone` contract plus copy-paste
> Diff / findings / pseudocode / checklist / SVG-flow / quadrant components — see
> `references/components.md`. The essentials are summarized here.
>
> For the **field-level Helper API reference** — the exact item/config object shape each
> `COOKIEBITE.*` helper takes (which keys are required vs optional, and gotchas like
> `kpis`'s `prefix` vs `unit` vs `suffix` rendering differently) — see
> **`references/helpers.md`**. The table below lists what each helper *emits*; reach for
> `helpers.md` for what to *pass in*, especially for a non-payments report where the
> demo can't be copied for the shape.

### Runtime fast path vs hand-building

**Freedom is paramount.** The runtime is a **helper library + exposed primitives**,
not a closed framework. The fast path is a shorthand for the repetitive ~80%; it never
gates structure. You can always drop raw HTML and a hand-written ECharts option
anywhere and keep it on-theme/dark-aware by reaching the exposed primitives. The
helpers emit the **same markup the references teach**, so mixing helpers and
hand-written sections in one report is fine and backward-compatible — `references/*.md`
(`components.md`, `interactions.md`, `motion.md`) stay valid for hand-building every
section by hand.

The fast path is a small set of helpers on the global `COOKIEBITE` namespace
(`kpis`/`findings`/`timeline`/`table`/`chart`/`mermaid`/`pill`/`callout`, plus
`compare`/`tabs`/`copyButton`/`sectionToMarkdown`/`glossary`/`categoricalColors`). There
is deliberately **no** `header()`/`page()` layout-shell helper and **no** chart `{kind}`
enum — those would recreate the closed-vocabulary failure mode; the header, footer, and
layout shell stay hand-authored Tailwind. (`COOKIEBITE.toc` is the one exception, and a
narrow one: it *enriches* the canonical hand-authored `#toc` element from your
`section[id]` headings — it is **not** a page shell, and it NO-OPs over a `#toc` you
already filled with links.)

| Fast-path helper | Emits (data → markup) | Hand-built equivalent |
| --- | --- | --- |
| `COOKIEBITE.kpis(target, items, opts?)` | responsive KPI card grid (label + countup number + delta badge + sparkline); `opts.cols` (`'1-2-4'`/`'1-2-3'`/`'1-3'`/`'1-2'`/`'1'`) sets the breakpoint columns, else auto-picked by item count | `components.md` KPI / "Stat cards" + template KPI section |
| `COOKIEBITE.findings(target, items, opts?)` | ranked severity findings list + Alpine filter chips | `components.md` "Severity-coded findings list" |
| `COOKIEBITE.timeline(target, items, opts?)` | Alpine `x-for` vertical timeline (icon-in-badge marker + spine + expandable detail) | incident-timeline pattern (`interactions.md`) |
| `COOKIEBITE.table(target, config)` | Grid.js table, footguns fixed (pager >15, search >10, right-aligned numerics, accent theme) | `interactions.md` §4 |
| `COOKIEBITE.chart(target, config)` | **wrapper only**: §10 view-toggle + data-table + aria scaffold, merges your hand-written `option` over `baseChart`, registers for dark re-theme | `interactions.md` §10 + template trend chart |
| `COOKIEBITE.mermaid(target, definition, opts?)` | text → themed, dark-aware diagram (flowchart / sequence / state / ER / gantt); dynamically imports Mermaid (no CDN tag), themeVars from CSS vars | `libraries.md` "Diagrams" + `references/craft.md` |
| `COOKIEBITE.pill(label, opts)` / `COOKIEBITE.callout(html, opts)` | tone badge / left-accent insight box (return **strings**, compose anywhere) | `components.md` tone table |
| `COOKIEBITE.compare(target, { rows, options, recommendation? })` | side-by-side decision grid: columns = options, rows aligned by construction; recommended column gets an accent ring + badge; collapses to stacked cards below sm; optional `recommendation` renders as a callout | `interactions.md` §12 |
| `COOKIEBITE.tabs(target, panels, opts?)` / `COOKIEBITE.reveal(...)` | vanilla (no-Alpine) tab shell; lazily calls `render(panelEl)` on first show then `requestAnimationFrame`s so charts created inside `resize()` — the fix for the "empty chart box in a hidden tab" footgun | `interactions.md` §6 |
| `COOKIEBITE.copyButton(target, label, builderFn, opts?)` | injects a themed copy `<button>` that calls `CB.copy(builderFn(), btn)` (inherits the fallback + 'Copied ✓' flash) | `interactions.md` §13 |
| `COOKIEBITE.sectionToMarkdown(selector)` | best-effort serializer: a section's headings/paragraphs/lists/tables → a markdown string. Pairs with `copyButton` | `interactions.md` §13 |
| `COOKIEBITE.glossary(map, scope?)` | merges `map` into `window.GLOSSARY` and runs the glossary linker + tippy within `scope` (default `document`); works from inside a `DOMContentLoaded` handler, idempotent. **Needs the Tippy CDN tags** (`.gloss` styling ships in cookiebite.css, but the tooltip lib does not) | `interactions.md` §11 |
| `COOKIEBITE.categoricalColors(n)` | array of `n` on-theme colors from `--accent` for **peer** series (regions/vendors/plans — distinct but on-theme); a bounded hue arc ±~50° around the accent with consistent S/L, and **small-n palettes stay near the accent** (a 2–3 series set reads as the brand family, not a rainbow); re-reads the live accent so it follows dark re-theme. Pair: `categoricalColors` = peer, `ramp` = ordered | — |
| `COOKIEBITE.funnel(target, { steps, caption?, ariaLabel? })` | themed ECharts funnel; auto step-to-step + overall conversion % labels; single-hue accent ramp; registers for dark | `interactions.md` §10 (hand-built funnel) |
| `COOKIEBITE.gauge(target, { value, max?, label?, unit?, target?, tone?, size?, thickness?, sub?, showMax? })` | pure CSS conic-gradient progress ring (no chart lib), center value label, optional target tick; `showMax:true` appends a faint `/max` so the reader sees the denominator; themes via `var(--accent)`, dark-aware with no registration | `components.md` (CSS ring recipe) |
| `COOKIEBITE.heatmap(target, { data, caption?, ariaLabel?, max?, range?, from?, to? })` | ECharts calendar heatmap (one value per `YYYY-MM-DD`), single-hue accent ramp; auto-spans only the months the data covers, or pass `range`/`from`+`to` to fix the span; registers for dark | `libraries.md` (calendar heatmap) |
| `COOKIEBITE.takeaway(pointsOrHtml, opts?)` | returns a **string**: a prominent TL;DR / key-takeaway box (accent-weak surface, accent-strong title); accepts a bullet-string array or raw HTML; `opts.title` | `components.md` "TL;DR box" |
| `COOKIEBITE.deltaBadge(text, { dir, tone })` | returns a **string**: the standalone stat-delta badge (up/down arrow + tone color) that `kpis` uses internally | `components.md` delta badge |
| `COOKIEBITE.cardGrid(target, { items, caption? })` | responsive faceted card grid; builds a **wrap-or-scroll** filter chip row from the union of item `tags` (never a bare flex row) | `components.md` card grid + `interactions.md` filter chips |
| `COOKIEBITE.ramp(n)` | array of `n` on-theme colors from **one** accent hue (varying L/S, bounded) for sequential / stacked data | — |
| `COOKIEBITE.exportPNG(chartSelector, filename?)` | downloads a **registered** chart as PNG via echarts `getDataURL`; `CB.chart`'s `{ exportable: true }` injects a PNG button next to the view-toggle | — |
| `COOKIEBITE.shapes.{waterfall,bullet,sparkline,scatter,radar}(cfg)` | **pure ECharts-`option` builders** — pass the returned option to `CB.chart` (which themes + registers it). waterfall (transparent-base ± deltas), bullet (KPI-vs-target), sparkline (axis-less cell line), scatter/bubble (size → area; optional per-point `group`/`tone`/`color` → one colored series + legend per category), radar (multi-series, `categoricalColors`) | `libraries.md` (chart-type gotchas) |
| `COOKIEBITE.bigNumber(target, { value, label?, delta?, spark?, … })` | one oversized hero number (CountUp; a non-numeric string renders verbatim); reuses `deltaBadge` + spark; built-in empty-state | `components.md` "Stat / KPI card" |
| `COOKIEBITE.steps(target, items[{label, status, detail?}], opts?)` | connected progress stepper (horizontal on sm+, vertical below); `done`→success check, `current`→accent ring, `pending`→hollow; `sr-only` status label per node | `helpers.md` (CB.steps) |
| `COOKIEBITE.leaderboard(target, items[{label, value, deltaRank?, tone?}], opts?)` | numbered rows with value-proportional accent bars, right-aligned `tabular-nums` value, optional rank-change arrow; built-in empty-state | — |
| `COOKIEBITE.cellBar / cellHeat / cellSpark(opts?)` | **Grid.js column-`formatter` factories** — attach as a column's `formatter` in `CB.table`: an inline accent bar / accent-tint heat chip / `data-spark` sparkline (cell = `number[]`) | `helpers.md` (Grid.js formatters) |
| `COOKIEBITE.diff(target, { lines, filename?, … })` | escaped diff view with `+`/`−` gutter + dual old/new line numbers | `components.md` "Diff view" |
| `COOKIEBITE.pseudocode(target, codeOrLines, opts?)` | escaped annotated-code / pseudocode block with numbered gutter + inline notes | `components.md` "Pseudocode" |
| `COOKIEBITE.matrix(target, { rows, cols, data, … })` | generic rows×cols×value grid-heatmap (cohort/retention/confusion), single-hue accent ramp; `heatmap` stays calendar-only | `helpers.md` (CB.matrix) |
| `COOKIEBITE.actionItems(target, items[{title, owner?, due?, priority?, body?}], opts?)` | priority-pill action list + owner/due meta + collapsible `<details>` body + optional copy-as-markdown | `components.md` "Checklist / todo" |
| `COOKIEBITE.shapes.{dumbbell,slope,lollipop,rangeDot,histogram,stackedBar}(cfg)` | **pure ECharts-`option` builders** (pass to `CB.chart`) — dumbbell/slope (two-point change), lollipop/rangeDot (ranking/range), histogram (distribution), stackedBar (composition) | `libraries.md` "which chart-shape builder when" + `helpers.md` |
| `COOKIEBITE.threshold(option, { value, tone, band?, axis? })` / `COOKIEBITE.annotate(chartSel, points)` | **transformers** (not builders): `threshold` merges a themed reference line/band onto an author option (stackable); `annotate` pins labelled points on a registered chart | `helpers.md` (threshold/annotate) |
| `COOKIEBITE.lead(html, opts?)` / `COOKIEBITE.kicker(text, opts?)` | return **strings**: a `.cb-lead` standfirst (opening paragraph) / a `.cb-kicker` section eyebrow above an `<h2>` | `components.md` "Editorial components" |
| `COOKIEBITE.note/tip/warning/danger/example(html, opts?)` / `COOKIEBITE.quote(html, opts?)` | return **strings**: the callout **family** — admonitions with a fixed tone + locale kicker + icon (note/tip/warning/danger/example), plus an inline `.cb-quote` blockquote | `components.md` "Editorial components" |
| `COOKIEBITE.figure(target, { number?, title, note?, source? })` | wraps the host **in place** in a `<figure>` with a numbered `Fig. N` eyebrow + tiered figcaption (title/note/source); idempotent | `components.md` "Editorial components" |
| `COOKIEBITE.statusDot(tone, label, opts?)` / `COOKIEBITE.trendChip(value, opts?)` | return **strings**: a tone dot + **required** label (live status) / an inline up/down/flat trend chip + delta + optional sparkline | `components.md` + `helpers.md` |
| `COOKIEBITE.whatChanged(target, items[{label, from, to, tone?}], opts?)` | a value-diff block: per row `old → new` (old struck) + an auto Δ badge; the textual sibling of the dumbbell chart | `helpers.md` (CB.whatChanged) |
| `COOKIEBITE.epigraph(html, opts?)` / `COOKIEBITE.pullquote(html)` | return **strings**: a small italic opening epigraph / a large accent-glyph lift-out pullquote | `components.md` "Editorial components" |
| `COOKIEBITE.legend(target, items, opts?)` | standalone legend (square/line/dot swatch, optional value column); `interactive:true` + `chart` toggles series on a registered ECharts chart | `helpers.md` (CB.legend) |
| `COOKIEBITE.search(opts?)` | **opt-in** sticky search bar filtering/dimming `[data-searchable]` regions with `<mark>` highlight | `helpers.md` (CB.search) |
| `COOKIEBITE.densityToggle()` / `COOKIEBITE.permalinks(opts?)` | **opt-in** chrome: a compact-density toggle (`html[data-density]`, localStorage) / hover `#` section permalinks (copy section URL) | — |
| `COOKIEBITE.print()` / `COOKIEBITE.audit()` | `print()` forces light + expands `<details>`/tab panels then `window.print()`; `audit()` is a dev-only DOM a11y/contrast audit (also `?audit=1`) | — |
| `COOKIEBITE.treemap / sankey / gantt(target, config)` | **full-render** heavy charts (build card + ECharts + data-table; **don't** wrap in `CB.chart`): treemap (value→lightness hierarchy, flat-by-parent or nested), sankey (single-hue opacity-gradient flow, narrow→vertical), gantt (date-axis lanes + progress fill + today line). Each **warns if `ariaLabel` omitted** | `helpers.md` (Wave B heavy charts) + `libraries.md` "which chart when" |
| `COOKIEBITE.shapes.{boxplot,densityArea,marimekko}(cfg)` + `shapes.fiveNum(values)` | **pure ECharts-`option` builders** (pass to `CB.chart`): boxplot (per-group five-number boxes; `fiveNum` exposed for the table rows), densityArea (KDE curve / `ridgeline` stack), marimekko (column-width = weight × stacked-100% segments; `narrow` → stacked-bar fallback) | `helpers.md` (distribution & composition builders) + `libraries.md` |
| `COOKIEBITE.toc(target, opts?)` | builds the `.cb-toc` sidebar from `main section[id]` + h2/h3, renders into the canonical `#toc`, re-runs `initToc()`'s observer + mobile nav; numbered/nested/progress; **NO-OP over a hand-authored `#toc`** with links (`force:true` overrides) | `interactions.md` §9 + `components.md` (TOC enrichment) |
| `COOKIEBITE.readingProgress(opts?)` / `COOKIEBITE.readTime(target, opts?)` | **opt-in** long-report chrome: a `var(--accent)` scroll bar (`.cb-readingbar`, **null under reduced-motion**) / a CJK-aware "N min read" eyebrow (`.cb-readtime`) | `helpers.md` + `interactions.md` §9 |
| `COOKIEBITE.fn(noteHtml)` / `COOKIEBITE.endnotes(target, opts?)` | footnotes with **ids paired by construction** (`cbfn-ref-N`↔`cbfn-note-N`): `fn` returns a `.cb-fnref` `<sup>` + registers the note; `endnotes` renders them as a `'list'` (↩ back-links) or `'sidenote'` (margin float on wide) | `components.md` "Footnotes & citations" |
| `COOKIEBITE.scrollReveal(scope?, opts?)` | ONE IntersectionObserver fading + lifting `[data-reveal]` (opacity+transform only — no layout shift) + firing CountUp in `[data-count-on-enter]`; **gated on reduced-motion** (shows all, counters → final); no-JS-safe guard added by JS only | `interactions.md` §7 + `components.md` (`[data-reveal]` contract) |

`COOKIEBITE.chart` is the fast/escape **seam**: the wrapper is data, but the ECharts
`option` is **always author-written** (merged over `baseChart`; plain objects deep-merge,
arrays like `series`/`dataZoom` replace wholesale) — never a `{kind}` shortcut.

**What stays escape-hatch (full freedom, never forced declarative):** every chart's
`option` object, the MRR-waterfall / Sankey / candlestick tricks, bespoke
`@keyframes`/`color-mix(var(--accent)…)` CSS, hand SVG flows, quadrant boards, diff /
pseudocode blocks, all Alpine filter/tab/accordion/scenario-slider interactions, and the
config-form / prompt-editor / copy-as-diff editing UIs. Reach the **exposed primitives**
to stay on-theme: the CSS-var tokens (`var(--accent)`, `var(--c-*)`), `COOKIEBITE.css()`,
`COOKIEBITE.readThemeVars()`, `COOKIEBITE.baseChart` + `COOKIEBITE.theme` (the accent is
`COOKIEBITE.theme.ACCENT`), `COOKIEBITE.accentRgba()`, `nf`/`money`/`moneyShort`,
`hydrate()`/`refreshIcons()`, `copy()`/`download()`, `dataTableToggle()` (data-table alt
for a hand-written chart), `MOTION_OK`. (**Legacy aliases**, kept for older hand-rolled
reports — for new reports use the right-hand name: `won`/`wonShort` → `money`/`moneyShort`;
the bare globals `window.ACCENT`/`window.baseChart` → `COOKIEBITE.theme.ACCENT` /
`COOKIEBITE.baseChart`.)

**Dark-aware hand charts must register** — `CB.chart` does it for you; a hand-written
canvas/Mermaid chart must call `COOKIEBITE.registerChart(chart, renderFn)` or it won't
flip on the dark toggle. The full contract (the three registration paths, and why pure
CSS/SVG needs none) lives in **"Theming → Dark mode"** above — don't restate it per chart.

**Fast-path gotchas (read before using the helpers — these bite silently):**
- `findings` reuses `tone` as the **severity label**: `critical` renders "Critical", `warning` "High", `info` "Medium", `neutral` "Low". This is the one place `tone` changes the *text*, not just the color (everywhere else — pill, callout, table — it only sets color). `success` has no severity meaning here, so it falls back to "Note". Pass `label` on the item to override the chip text.
- `kpis` delta/spark are **optional**: a KPI is just `{ label, value }`. **Omit** the `delta` key for no badge at all; pass `delta: null` to render the `—` "no baseline" sentinel. When no KPI has a baseline, omit it on all of them (a row of `—` reads as stray underscores). Likewise omit `spark` for a flat number — don't fabricate a baseline series for a status report that has none. (The template example ships fully loaded to *demo* delta+spark; that's a demo, not a floor.)
- `kpis` column count **auto-picks by item count** (e.g. 4 items → 4-up, 3 → 3-up); override with `opts.cols`: `'1-2-4'` (1 / sm:2 / xl:4), `'1-2-3'` (1 / sm:2 / xl:3), `'1-3'` (1 / xl:3), `'1-2'` (1 / sm:2), or `'1'` (always one column). Pass it when the auto pick fights your layout (e.g. force `'1-2-3'` for 4 items you want as 2×2-then-3).
- `table` auto-hides the search box on small tables (`rows ≤ 10`) and the pager on `rows ≤ 15`; pass `search: true/false` to force it. Don't hand a 5-row table a search field. Pass `csv: true` to inject a "CSV" download of the table rows (there is no standalone `CB.csvButton`).
- A **hand-written** (escape-hatch) chart still owes a data-table alternative + `aria-label` (the a11y rule). `CB.chart` adds them automatically; for a bespoke chart, call `COOKIEBITE.dataTableToggle(chartSelector, { columns, rows, ariaLabel })` to inject the table toggle + table.
- **Glossary: the raw `window.GLOSSARY` path must be a PARSE-TIME assignment.** The runtime reads `window.GLOSSARY` once during its own init; setting it later inside the report's `DOMContentLoaded` handler no-ops (the linker already ran). For glossary terms, either assign `window.GLOSSARY = {…}` at parse time (a top-level `<script>` before the runtime, the obvious "raw" path), **or** call `COOKIEBITE.glossary(map, scope?)` — which works from inside the `DOMContentLoaded` handler (the obvious place), merges into `window.GLOSSARY`, and re-runs the linker + tippy. `CB.glossary` is idempotent, so calling it again only links new terms. Either path needs the **Tippy CDN tags** in HEAD-LIBS — the `.gloss` underline styling ships in `cookiebite.css`, but the tooltip library doesn't.
- **Chart/table toggle labels are locale-driven, and overridable.** The show-table / show-chart button text defaults from the locale: when `window.REPORT_LOCALE && /^ko/i.test(REPORT_LOCALE.number)` it's Korean `'표로 보기'` (show-table) / `'차트로 보기'` (show-chart); otherwise English `'View as table'` / `'View as chart'`. Override per-chart with the optional `tableLabel` / `chartLabel` config keys, accepted on **both** `CB.chart(config)` and `CB.dataTableToggle(opts)`; an author-supplied label always wins over the locale default.

- **Table of contents (sidebar)**: include a TOC by default on any report with 3+
  sections. Put it in a **right rail** that's `sticky top-24` next to the main column,
  and give the main column generous width (wide container, `flex-1` main). Use a
  `flex flex-row-reverse` shell so the `<nav>` sits on the right while staying first
  in DOM order for screen readers; collapse it (`hidden lg:block`) to nothing on
  narrow widths. Each entry links to a section `id`; the active-section highlighting is
  **provided by the runtime** — `initToc` auto-wires an IntersectionObserver against
  `#toc a` + `main section[id]` (accent for the active item, `text-secondary` for the
  rest). You only author the `<ul id="toc">` `<li>` entries in the `COOKIEBITE:TOC`
  slot; no observer JS to write. Keep it quiet — it's a map, not a feature. The shape:
  ```html
  <div class="mx-auto max-w-[1400px] flex flex-row-reverse gap-40">
    <nav class="hidden lg:block w-[190px] shrink-0">
      <div class="sticky top-24">
        <!-- the heading word is part of the editable TOC slot — LOCALIZE it ('Contents'
             for an English report); leaving '목차' on an en report is the footgun. -->
        <p class="text-caption-12 text-text-disabled mb-12 pl-12">목차</p>
        <ul class="space-y-2 text-body-14" id="toc">
          <li><a href="#summary" class="block px-12 py-8 rounded-small text-secondary hover:text-primary">요약</a></li>
          <li><a href="#metrics" class="block px-12 py-8 rounded-small text-secondary hover:text-primary">지표</a></li>
          <!-- … one per section … -->
        </ul>
      </div>
    </nav>
    <main class="min-w-0 flex-1"><!-- sections with matching ids --></main>
  </div>
  ```
  (The runtime observes every `main section[id]`; you just keep the ids in sync. The
  "목차" heading now lives **inside** the `COOKIEBITE:TOC` editable slot — localize it to
  "Contents" for an English report.)
- **Header**: title (`headline-36`/`title-28`), a one-line takeaway in `text-secondary`, context chips (date, scope, author) as small rounded tags in `bg-accent-weak text-accent-strong`.
- **Stat cards**: a responsive grid of `bg-surface border border-line-weak rounded-medium shadow-sm` cards, each with a big accent number (animate with CountUp), a label, and a small delta in a semantic color.
- **Section**: a `title-20`/`title-24` heading, optional one-line intro, then the visual (chart/table/diagram) as the centerpiece.
- **Charts**: themed with the accent (derive tints/shades for multi-series), neutral grid lines (the `--c-line-weak`/`--c-line` tokens), the theme font, tooltips on. Give containers an explicit height.
- **Tables**: quiet borders, tight rhythm, right-aligned numbers, status via semantic-colored tags (with icon/label, not color alone), not raw text color.
- **Callouts**: status/insight boxes using semantic color + a Lucide icon + a short sentence.
- **Timeline / steps**: for sequences (incidents, rollouts, roadmaps) prefer a visual timeline over a numbered list.

## Quality checklist

Before handing over, verify:

- [ ] Opens standalone (double-click works) after inlining; runtime folded in, third-party libs via CDN; no console errors that break rendering.
- [ ] The main takeaway is visible within ~5 seconds — a headline number or chart, not buried in prose.
- [ ] At least the key points are visualized (charts/cards/diagrams/timeline), not just listed as text.
- [ ] Exactly one accent color; semantic colors used only for status/feedback.
- [ ] Theme tokens applied consistently (font, accent, neutrals via CSS vars); type/spacing/radii/shadow use the template scales, no one-off hexes.
- [ ] Charts are themed (no default rainbow), have titles/labels, a one-line takeaway caption, and resize cleanly.
- [ ] Every wide / time-series chart has `dataZoom` (slider + inside) so the reader can zoom and pan.
- [ ] No chart renders blank: any chart inside a tab/accordion/toggle is inited lazily on show and `resize()`d (clicked through in the visual check). Animations are smooth and the moving part stays in sync with what it points at.
- [ ] Icons are explicitly sized (~16–24px), consistent, and never dwarf the text/number beside them.
- [ ] Data tables beyond a few static rows use Grid.js (sortable/searchable), not hand-rolled sort code.
- [ ] KPI cards lead with the number + a delta badge (semantic, vs a real baseline) + a sparkline; figures use `tabular-nums`.
- [ ] Numbers are consistently formatted (thousands separators, KR units like 만/억, fixed precision, %p vs %), nothing wraps mid-figure.
- [ ] Every caption/label matches what its chart actually renders (no copy↔visual mismatch).
- [ ] Status is never color-alone (paired with icon/label); every chart has a "표로 보기" data-table alternative + an `aria-label`.
- [ ] Meets the interactivity minimum bar for the report type (filters/toggles/sortable table/drilldown for dashboards; interactive timeline/expandable detail for narratives). The reader can explore, not just scroll.
- [ ] Every interaction and animation earns its place (helps the reader find/compare); nothing purely decorative or distracting.
- [ ] Reads as designed and on-theme: restrained surfaces, clear shallow hierarchy, scannable layout.
- [ ] Has a sticky TOC sidebar when there are 3+ sections, with active-section highlighting.
- [ ] Status/semantic colors follow the **`tone` contract** (neutral/info/success/warning/critical → the four semantic tokens) consistently across pills, callouts, deltas, findings, and rows — see `references/components.md`.
- [ ] Responsive: survives the 390px narrow pass (TOC collapses, cards stack, no overflow/clipping).
- [ ] **Dark mode reads**: the toggle flips cleanly, charts re-theme (axes/grid legible, no blown contrast), and status colors still pass — confirmed in the verify script's dark pass.
- [ ] **Rendered and visually verified** with `scripts/verify-report.sh`: desktop + narrow tiles read; no label overlap / clipped text / broken charts / edge bleed / copy↔visual mismatch; issues fixed.

## References

- `assets/template.html` — slim, slot-marked report skeleton (`<!-- COOKIEBITE:* -->`
  regions). **`cp` this to start, then surgical-`Edit` the slots.** References the
  hosted runtime; ships the built-in **light/dark toggle** (see "Theming → Dark mode").
- `assets/cookiebite.css` / `assets/cookiebite.js` — the **hosted runtime**: invariant
  boilerplate (Tailwind config, default + dark token layers, number helpers, `baseChart`,
  dark toggle, TOC observer, card hydration, a quiet auto-injected "Made with cookiebite"
  footer credit) plus the `COOKIEBITE.*` fast-path helpers
  and exposed primitives. **Never edit per report** — folded into the deliverable by
  `scripts/inline.sh`.
- `scripts/inline.sh` — fold the **local** runtime copies into a report to produce the
  self-contained deliverable (see "Delivery"). Mandatory final step.
- `references/components.md` — declarative component cheat-sheet: the unified `tone`
  contract (neutral/info/success/warning/critical → semantic tokens) plus copy-paste
  building blocks, including **Diff view, severity-coded findings, pseudocode/annotated
  code, stateful checklist, themed SVG flow diagram, and a spatial quadrant board**.
  Read this when assembling sections, especially for code-review / change reports.
  Also holds the **second, non-dashboard worked example** (explainer/postmortem skeleton).
- `references/helpers.md` — the **field-level Helper API reference**: per-helper
  item/config object shapes (required vs optional keys, one-line meanings) for every
  `COOKIEBITE.*` fast-path helper. Read before calling a helper for a non-payments
  report, where the demo can't be copied for the shape.
- `assets/theme-studio.html` — interactive theme editor (presets, color/font pickers,
  live preview, export CSS/`theme.json`). Open when the user wants a custom theme.
- `assets/presets/` — 10 theme-token presets (persimmon default, neutral, + stripe/vercel/
  linear/notion/supabase/sentry/resend/raycast). `assets/design-packs/<brand>/DESIGN.md`
  holds each brand's full source design spec for deep-fidelity theming.
- `scripts/verify-report.sh` — render + sectioned screenshots (desktop + narrow) for
  the required visual self-check.
- `references/craft.md` — visual & readability craft (KPI/caption/icon/table
  habits), number & locale formatting, accessibility, and the copy-must-match rule.
  Read while filling the template with real content.
- `references/design-system.md` — the design-token model + a documented reference
  preset (Persimmon) with exact values. Read for token meanings or concrete preset values.
- `references/libraries.md` — CDN catalog for charts, interactivity, motion, tables,
  diagrams (pick by layout: ECharts graph/tree/sankey, Graphviz, Mermaid, or inline
  SVG for small figures), plus common pitfalls.
- `references/interactions.md` — copy-adaptable interaction patterns (filters, view
  toggles, ECharts zoom/brush/drilldown/connect, sortable tables, accordions, scenario
  sliders, sticky nav, glossary tooltips, side-by-side comparison §12, state export §13).
  Read this when planning interactivity.
- `references/motion.md` — opt-in animation patterns (scroll reveals, GSAP sequenced
  intros, Lottie vector art) with reduced-motion + restraint guidance. Read only when
  a report genuinely needs motion; the default template stays still.
