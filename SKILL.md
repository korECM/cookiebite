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
dark-aware (see "Building blocks"); drop to raw HTML only for the bespoke parts.

1. **Find the 1–3 takeaways** the reader must leave with → those become the headline
   visuals.
2. **Start from a TYPE skeleton, not the payments demo**: `bash scripts/scaffold.sh <type>
   <report>.html` (`type` ∈ `dashboard` | `review` | `postmortem` | `explainer` |
   `comparison`, or run the `cookiebite new` command) — it copies the template and swaps
   the demo `SECTIONS`/`REPORT-SCRIPT` (+ `TOC`/`HEADER`/`FOOTER`) for a small, correct,
   on-theme skeleton built from the *right* helpers for that type, slot markers intact.
   (Bare `cp assets/template.html <report>.html` works too if you want the payments demo
   as a reference.) Then `Read` the file (a fresh file — `Edit` fails until you read it)
   and surgical-`Edit` only the `<!-- COOKIEBITE:* -->` slots (`HEAD-THEME`, `HEAD-LIBS`,
   `TITLE`, `TOC`, `HEADER`, `SECTIONS`, `FOOTER`, `REPORT-SCRIPT`) — see
   **`references/snippets.md`** for the section-recipe library to paste in. Set
   `<html lang>` to the report's language.
3. **Pick the theme** (default Persimmon, or a preset / saved default) and **pick the
   chart form by the data's job** — see Workflow step 4.
4. **Author the repetitive sections with the helpers** (`COOKIEBITE.kpis`/`findings`/
   `timeline`/`table`/`chart`/`mermaid`/…); input shapes are in
   **`references/helpers.md`**. Theme every chart from the accent — never the library
   rainbow. **The shipped template is a payments DEMO** — replace its `SECTIONS` /
   `REPORT-SCRIPT` slots wholesale for any other report type (and delete a section's
   matching script block when you remove it — stale `CB.*` calls throw on a missing host).
5. **Hit the interactivity minimum bar** for the report type (see "Interactivity"), and
   give any reader-editable report an export.
6. **Inline → visually self-check → hand over**: `bash scripts/inline.sh <report>.html
   -o <report>.final.html` (mandatory), then `bash scripts/verify-report.sh`, look at
   the pixels, sweep **`references/anti-patterns.md`**, fix, repeat; finally `open` the
   inlined file for the user.

The full workflow (with every guard rail) is in "Workflow" below; the rest of this file
is the reasoning behind each step — read it once, not per build.

## The core idea: graphic-first, on-theme, interactive

1. **Graphic over textual.** Whenever a point can be a chart, a stat card, a
   timeline, a diagram, a progress ring, or a comparison table instead of a
   paragraph, make it the visual. Lead with the headline number — an exec one-pager
   should open with one oversized hero figure via `COOKIEBITE.bigNumber` (the single
   number the reader must leave with), not a wall of KPI cards. Let the reader
   *see* the story. Long prose is the fallback, not the default.
   **The most-missed case is structure described in words** — "A calls B, which
   verifies with C, then returns to A", a request flow, a state machine, a decision
   tree, an entity relationship. Prose like that is a **diagram that hasn't been drawn
   yet**: reach for `COOKIEBITE.mermaid` (flowchart / sequence / state / ER — themed and
   dark-aware, one call, no setup) or a hand SVG flow (`references/motion.md` §6).
   Before shipping a section that is three-plus sentences of "X does Y to Z", ask
   whether it should be a picture — it usually should. Draw system flows natively
   (never GIFs/screenshots) so they stay on-theme, crisp, and dark-aware.

2. **On-theme via design tokens.** The look comes from a small set of design tokens
   (accent, neutrals, semantic colors, typography, spacing, radii) — not from one-off
   choices per element. Hold that discipline: one accent color per report, semantic
   colors only for status (never decoration), consistent type/spacing scale. That's
   what makes a report read as designed instead of a generic AI dashboard. The tokens
   are swappable (see "Theming"): a Persimmon (Korean) default ships built-in, a
   neutral preset is included, and `assets/theme-studio.html` lets the user design
   their own.

3. **Interactive, so the reader can explore.** A static chart answers one question;
   an interactive one answers the ones you didn't anticipate. Default to giving the
   reader controls — filters, view toggles, sortable tables, drilldowns, hover
   detail — not just things to look at. This is the part most easily under-done, so
   push on it: see "Interactivity" below.

When in doubt, ask: *"Is this clearly on-theme and consistent, and would a busy
reader get the point in five seconds?"* Aim for yes on both.

## Output contract

- **One self-contained `.html` file.** No build step. The template references the
  cookiebite runtime via two **placeholder** lines that `scripts/inline.sh` folds in
  (see "Delivery"); the heavy third-party libs (Tailwind, ECharts, Alpine, Lucide, …)
  stay on CDN — see `references/libraries.md`.
- Default filename: a descriptive kebab-case name from the content
  (e.g. `q2-billing-incident-review.html`), saved where the user is working.
- Match the copy language to the source (Korean source → Korean copy). The theme's
  font + locale should match (the Persimmon default is Korean/Pretendard; the neutral
  preset is Latin/Inter) — see "Theming".
- After inlining, **open the inlined file** (`open <file>.html` on macOS) so the user
  sees it immediately, and tell them the path.

### Delivery

The template's two runtime placeholder lines —

```html
<link rel="stylesheet" href="./assets/cookiebite.css" />
<script src="./assets/cookiebite.js"></script>
```

— don't resolve once the report is copied out of the skill dir; they're markers for
the **mandatory** inline step. After filling the slots, run:

```bash
bash scripts/inline.sh <report>.html -o <report>.final.html
```

(Omit `-o` and it writes `<report>.inlined.html` next to the input.)

It reads the **local** repo copies of `cookiebite.css`/`.js` (resolved from the
script's own location) and replaces the two lines with inline `<style>`/`<script>`,
preserving the ordering — `cookiebite.js` loads right after the Tailwind Play CDN tag
with no `defer` so its first statement sets `window.tailwind.config` before Tailwind's
scan. The per-report inline `:root` THEME block stays in `<head>` so the theme applies
at first paint. **The inlined file is the deliverable** — verify and open *that*.

**Documented limitations:**
- Only cookiebite's own runtime is inlined; third-party libs stay on CDN. So
  "self-contained" means the file survives the runtime repo moving and works online;
  genuine full-offline needs a vendored Tailwind build (out of scope).
- **Don't ship the output as a claude.ai Artifact** — the Artifact CSP blocks every
  external host, so the CDN libs never load and the page renders broken. Deliver the
  file itself, or host it (internal static hosting) and share the link.

## Workflow

1. **Find the story — in the data, never around it.** Decide the 1–3 claims the
   reader must leave with; those become the headline visuals. Then order the sections
   as an **argument, not an inventory**: each section's takeaway should feed one of
   the headline claims, and a one-line bridge should hand the reader to the next
   section. **Anti-padding rule:** the outline comes *from* the material — if the
   data honestly supports two beats, the report has two sections. A section added to
   look complete (background nobody asked for, a chart restating another chart)
   dilutes the reader's trust in the rest; cut it instead of writing it.
2. **Pick a structure.** Most reports want: a header (title + one-line takeaway +
   date/context), a row of key-stat cards, then sections — each led by a visual.
   When the report is long or the audience is mixed, open with `CB.claims` — the
   executive summary as claims anchored to their evidence sections — and consider
   marking deep-dive sections `data-altitude-detail` + `CB.altitudeToggle()` so one
   document serves both the exec skim and the full read.
3. **Pick the theme.** If the user asks for a specific theme/preset, use it. Otherwise,
   if a saved default exists at `assets/presets/default.json`, apply that; failing that,
   use the template's built-in **Persimmon** default. One accent per report; switch
   only with a reason. Applying/pasting themes and defaulting live in
   `references/design-system.md` → "Applying & defaulting themes".
4. **Pick each visual's form, then its color — in that order.** Form first: what is
   the data's job? Color last: which of the five color jobs is it doing? Most bad
   charts pick colors first.

   **Which chart when (by the data's job):**
   - **bar** — compare a handful of categories; go **horizontal** when labels are long
     (the safe default for Korean labels) or there are many categories.
   - **line / area** — a trend over time; add `dataZoom` on anything wide.
   - **funnel** (`CB.funnel`) — a monotonically *shrinking* stage sequence; auto
     conversion %.
   - **gauge / progress ring** (`CB.gauge`, grid: `gaugeGrid`) — one value against a
     target/max; not for comparing series.
   - **heatmap** (`CB.heatmap`) — **calendar only** (a value per day);
     **matrix** (`CB.matrix`) — any non-calendar rows×cols grid (cohort, confusion).
   - **histogram / boxplot / densityArea** (`CB.shapes.*`) — the *distribution* of a
     sample (binned / quartiles-per-group / smooth).
   - **dumbbell / slope** (`CB.shapes.*`) — a *two-point change* (before→after): dumbbell
     per-row for many items, slope for a few series (`mode:'rank'` for rank shifts).
   - **lollipop / rangeDot** (`CB.shapes.*`) — de-inked *ranking* / where each item sits
     *within a range* (SLO bands).
   - **stackedBar / marimekko** (`CB.shapes.*`) — *composition* per category
     (`mode:'percent'` to normalize; marimekko when column weight also matters).
   - **threshold / annotate** (`CB.threshold` / `.annotate`) — *annotation*, not a new
     chart: merge a reference line/band onto any option; pin a labelled point.
   - **mermaid** (`CB.mermaid`) — *structure*, not magnitude: who-calls-whom, a
     lifecycle, a decision tree, an ER shape.
   - Avoid pie for >3 slices (horizontal bar instead); avoid Sankey/treemap with long
     labels unless verified. **Never a dual-axis chart** (two y-scales invent a
     correlation): two charts, small multiples, or index both to `=100`.
   - The full picker (by the reader's question) is in `references/libraries.md`
     ("which chart-shape builder when") — **read its "Chart-type gotchas" before
     building**; *long Korean labels are the #1 source of broken-looking charts*.

   **The five color jobs** — every chart color does exactly one:
   - **Identity** (peer series): `CB.categoricalColors(n)` — bounded accent-family arc,
     never the library rainbow. Past ~8 peers, fold into "Other" or facet.
   - **Emphasis** (one series is the story): `categoricalColors(n, { mode:'emphasis',
     focus:i })` — the story wears the accent, context recedes to gray. Often the
     honest answer to "make this chart clearer".
   - **Order/magnitude**: `CB.ramp(n)` — one hue, light→dark. Only for *ordered*
     data (funnel, tiers); a value-ramp on nominal categories double-encodes.
   - **Polarity** (above/below a baseline, Likert): `CB.diverging(n)` — two opposing
     poles around a neutral midpoint.
   - **Status**: the semantic tokens via the `tone` contract — reserved for meaning,
     never for "series 4".
   Palettes are **validated, not eyeballed** — the verify script runs
   `scripts/validate-palette.mjs` on every palette the report generated (see
   "Visual self-check").

   **Which CDN tags to keep (also in template.html's head comment):** a KPI/status
   report (uses `CB.kpis`) **keeps `countup`** — without it the numbers render as a
   literal `0`. Delete `echarts` only when there's no chart and no KPI sparkline.
   Delete both **only** for a pure-prose explainer.
5. **Plan the interactions** before building. Read `references/interactions.md` and
   pick the ones that fit the data (see "Interactivity" for the minimum bar).
6. **Build the page** — scaffold → `Read` → surgical-`Edit` the slots (Quickstart
   step 2). The deltas worth knowing:
   - The invariant boilerplate (Tailwind config, number helpers, `baseChart`, dark
     toggle, TOC observer, card hydration) lives in the hosted runtime
     (`cookiebite.js`) — author sections with the fast-path helpers, and drop to raw
     HTML + the exposed primitives for bespoke parts. The two paths share tokens and
     mix freely (see "Building blocks").
   - **Localize `<html lang>`** (template.html:23, the `<!-- /COOKIEBITE:LANG -->`
     line — outside the named slots so it's easy to miss). For a non-Korean report the
     full hand-edit checklist is: (a) `<html lang>`; (b) the **`window.REPORT_LOCALE`**
     block in HEAD-THEME (`number`/`currency`/`symbol`/`bigUnits` — drives separators,
     currency, `만/억` vs `K/M/B`, and the auto data-table / "min read" / chart-toggle
     labels key off `REPORT_LOCALE.number`); and (c) hand-authored copy not under a
     slot — the **`목차`/TOC heading** and any other UI words you typed. Applying a
     preset sets `REPORT_LOCALE` for you.
   - When you replace the demo `SECTIONS`/`REPORT-SCRIPT` wholesale, **delete each
     removed section's matching script block too** — `CB.*` calls throw on a missing
     host. For a non-dashboard starting point see the second worked example
     (explainer/postmortem skeleton) in **`references/components.md`** so a narrative
     report doesn't get bent into KPI-cards-plus-trend-chart.
7. **Theme every chart** from the tokens — `CB.chart` merges over `baseChart` and the
   runtime applies the quiet mark defaults (`CB.markSpecs`: thin bars with a rounded
   data-end, surface gaps between stacked fills, ringed line dots). Pick the palette
   by color job (step 4); never hard-code hexes or the library defaults.
8. **Fold in the runtime** (mandatory): `bash scripts/inline.sh <report>.html -o
   <report>.final.html` (see "Delivery").
9. **Visually self-check** (required — see below). Render, look at the actual pixels,
   sweep `references/anti-patterns.md`, fix (edit the source, re-inline), repeat.
10. Open the inlined file for the user and hand it over.

## Interactivity

This is the dimension most easily left thin, so treat it as a first-class goal, not
a garnish. A report the reader can poke at — filtering, sorting, toggling, drilling
in — is far more useful than a static one.

**Tie-breaker:** if the data has ≥1 dimension a reader would want to slice / sort /
zoom, hit the minimum bar; if it's a fixed summary with no dimension to explore (a
three-number status), a static layout is correct — don't manufacture controls.

**Minimum bar by report type:**
- **Data dashboard**: at least one segment/filter control (`CB.connectFilter`), one
  chart with built-in interactivity on (legend toggle, `dataZoom`, drilldown, or
  cross-chart `connect`), and any table over ~8 rows sortable/searchable (Grid.js).
  The reader should be able to answer a question you didn't pre-chart.
- **Narrative report** (postmortem, recap): an interactive timeline or flow
  (hover/click for detail), expandable detail rows for action items / causes /
  findings, and tabbed or filtered sections when there are peer views. For the one
  chart the whole story hangs on, consider `CB.storyline` — a stepped walkthrough
  where each beat re-shapes the same chart (emphasis, annotation, zoom) while the
  caption says what to notice. One storyline per report at most; on every chart it's
  noise.
- **Explainer**: a TL;DR box up top, collapsible sections so the reader controls
  depth, tabbed code samples where relevant (`CB.code` / `CB.codeTabs`), and glossary
  tooltips on jargon. **An explainer without a single diagram is a red flag** — for
  any sequence, relationship, or decision, draw it (`CB.mermaid`; for an *animated*
  request flow, `references/motion.md` §6 — natively, never a GIF).
- **Comparison / decision**: options side by side with the same rows aligned
  (`CB.compare`), trade-offs colored with semantic tokens, and a recommendation.
  See `references/interactions.md` §12.
- **Code review / change report**: lead with a severity-coded findings list
  (`CB.findings`, sorted worst-first), show the change as a diff (`CB.diff`), explain
  non-obvious logic as pseudocode (`CB.pseudocode`) and real source as highlighted
  cards (`CB.code`/`codeTabs`), and — when the report proposes next steps — a prompt
  editor or copy-as-diff export (`references/interactions.md` §14).

**If the reader can edit or rearrange anything, end with a way to get the result
out** — copy-as-markdown or download (`CB.copyButton` + `sectionToMarkdown`,
interactions.md §13). An interactive page with no export is a dead end.

A report may go one step past *reading* into a small **editing interface** — a config
form that tunes its own numbers, a prompt editor, reorder-then-copy-as-diff
(interactions.md §14) — as long as the artifact stays a report about its own content.
A standalone tool/app screen ("a draggable triage board") is product UI and **out of
scope**. The boundary: edit → preview → export, always.

## Visual & readability craft

The habits that make a report read as **designed** rather than AI-generated — leading
numbers with meaning, setup lines and takeaway captions, annotated charts,
deliberately-sized icons, Grid.js tables, capped line length, shallow hierarchy,
inline jargon tooltips — plus **number/locale formatting**, **accessibility** (never
color-alone; every chart needs a data-table alternative + `aria-label`), and the
**copy-must-match-the-visual** rule are all in **`references/craft.md`**. Read it
while filling the template with real content. The Quality checklist below re-encodes
the must-pass items.

**`.cb-prose` / `.cb-lead` readability defaults.** For longform body text, these
classes clamp line length to `--measure-prose` (default 68ch; `.cb-lead` 58ch).
`COOKIEBITE.lead(html)` emits the standfirst; pass `{ measure:false }` to opt one
paragraph out. The measure is a Look knob — see "Theming".

## Visual self-check (required)

You cannot tell whether a report looks right by reading its source. Charts overlap
their labels, Korean text collides or clips, a flex row bleeds off the edge — none of
it shows up in the HTML. **Render the page and look at the pixels.** Skipping this is
the single biggest quality risk.

```bash
bash scripts/verify-report.sh <path-to-report>.html
# captures LIGHT desktop (1280px) + narrow (390px) + a dark pass:
#   <dir>/.verify/full-desktop.png, desktop-tile-00.png, …
#   <dir>/.verify/full-narrow.png,  narrow-tile-00.png,  …
#   <dir>/.verify/full-dark.png,    dark-tile-00.png,    …  (if the toggle is present)
#   plus checks-desktop.json / checks-narrow.json / checks-dark.json
```

It uses `agent-browser` (not Playwright) and accepts the **raw** report — if the file
isn't inlined yet it folds the runtime into a throwaway `.verify/_inlined.html`, so
the edit→verify loop stays one step (the `inline.sh` deliverable step still runs at
hand-over). Desktop/narrow passes force the light theme; dark gets its own pass.

The `checks-*.json` files flag the cheap structural problems: `horizontalOverflow` is
the primary layout-break signal (Grid.js's internally-scrolling tables are excluded),
collapsed chart containers, the **palette report** — every palette the runtime
generated (`CB.__palettes`), judged by `scripts/validate-palette.mjs` (CVD separation,
lightness band, chroma, contrast vs the live surface) — and **`chartWarnings`**, the
runtime's chart-honesty warnings (truncated zero-baseline, crowded bands, too many
rows/series). Fix palette FAILs (a CVD WARN requires secondary encoding — direct
labels / the data table; a contrast WARN requires visible labels or the table view),
and treat every chartWarning as a real defect, not advice.

Then **Read `full-desktop.png` and every `desktop-tile-*.png`** at legible size,
**skim the narrow and dark tiles**, and scan for:

- **Text/label overlap or collision** — chart axis/series labels, long Korean strings
  (the most common failure; automated checks will NOT catch it).
- **Clipped or cut-off text**, content bleeding past a card or the page edge.
- **Broken/empty/degenerate charts** — blank canvas, collapsed Sankey/treemap,
  unreadable legends, a chart with no height.
- **Caption ↔ visual mismatches** — a caption describing something the chart doesn't
  render.
- **Off-brand or muddy color**, poor contrast, awkward gaps, broken alignment.
- **Narrow**: TOC collapses, cards stack, nothing overflows. **Dark**: charts
  re-themed, contrast intact, no status color washed out.

Finish with a sweep of **`references/anti-patterns.md`** — the catalog of what goes
wrong (color, form, marks, interaction, runtime footguns, locale). If the report
matches an entry, it's wrong. Fix every issue, re-run, repeat until clean.

## Theming

The look is fully driven by **design tokens** exposed as CSS variables; the whole
report re-themes by swapping one block. The template wires Tailwind to the tokens, so
classes like `bg-surface`, `text-primary`, `text-secondary`, `border-line`,
`text-accent`, `bg-accent`, `rounded-small`, `shadow-md`, and the `body-14` /
`title-24` / `headline-36` type utilities work directly.

The token contract (CSS vars on `:root`, set in the template's THEME block):

- Font: `--font-family` (+ a font stylesheet `<link>`)
- Accent: `--accent`, `--accent-strong`, `--accent-weak`, `--accent-on`, plus two
  optional AA-safety tokens — `--accent-text` (darker accent for accent-**as-text**
  sites) and `--accent-on-text` (dark ink for **small text on an accent fill** when
  white fails the 4.5:1 floor). Both default sensibly when a preset omits them; the
  full contract is in `references/design-system.md` → "Applying & defaulting themes".
- Neutrals: `--c-bg`, `--c-surface`, `--c-primary`, `--c-secondary`, `--c-disabled`,
  `--c-placeholder`, `--c-line`, `--c-line-weak`, `--c-disabled-bg`
- Semantic: `--c-critical`, `--c-cautionary`, `--c-positive`, `--c-informative`
- Locale (JS): `window.REPORT_LOCALE = { number, currency, symbol, bigUnits }` drives
  the number helpers (thousands separators, `만/억` vs `K/M/B`).

**Dark mode (built-in, free for every preset).** The runtime ships a top-right
light/dark toggle and a generic `html[data-theme="dark"]` layer *outside* the
swappable THEME block, so it works for any theme with no per-preset dark JSON: it
overrides only the neutrals + `--accent-weak`; the accent stays, so brand identity
holds. First load honours `prefers-color-scheme` (set `window.REPORT_THEME = 'light'`
in the THEME block to force a fixed mode); the choice persists to `localStorage`.
Canvas charts don't follow CSS vars, so on toggle the runtime re-reads tokens and
re-renders every **registered** chart. **Keep that contract for hand-written
charts**: after `echarts.init` + `setOption`, call
`COOKIEBITE.registerChart(chart, renderFn)` (or `onThemeChange(cb)`, or listen for
`'cookiebite:theme'`) and read colors through `CB.css()`/`baseChart`/`theme` — never
hard-coded hexes, or they won't flip. `COOKIEBITE.chart()` registers automatically;
pure CSS/SVG using `var(--*)`/`color-mix` re-themes with no registration. A preset
whose accent is near-black can ship a dark-only `accentDark` override — see
`references/design-system.md` → "Applying & defaulting themes".

**The Look system (structure knobs — orthogonal to color).** Beyond color/font, a
report has an optional **Look**: structural knobs — **density**, **corner radius**,
**elevation**, **surface**, **border**, **chart-palette mode**, **heading font**,
text **measure**, **page background**, **header** style, **semantic preset**, and
**dark-mode tint**. Color asks "what hue?"; the Look asks "how sharp / dense /
bordered / wide?". **Every knob defaults to today's look — a report with no Look is
byte-identical.** Carried by `window.REPORT_LOOK = { …divergent knobs… }` and, in a
preset, a sparse `theme.json` `look:{}`. The theme studio has a Look tab. Full knob
table and the CSS-var/data-attr contract:
`references/design-system.md` → "The Look system".

**Choosing/changing the theme:**

- **Default**: the built-in **Persimmon** preset (Pretendard, Tomato accent, ko-KR/₩,
  East-Asian units). Use it unless the user wants otherwise.
- **Preset library**: `assets/presets/*.json` — 10 ready themes: `persimmon`
  (default), `neutral` (Inter, indigo, en-US), plus brand presets distilled from real
  design systems (`stripe`, `vercel`, `linear`, `notion`, `supabase`, `sentry`,
  `resend`, `raycast`). Apply via
  **`python scripts/apply-theme.py <preset> <report>.html [-o out.html]`** — it
  rewrites the THEME block + `<html lang>` + `REPORT_LOCALE` + any `look:{}`. If the
  user names a brand ("make it look like Stripe"), use that preset.
- **Deep-fidelity theming**: each brand preset has its full source design spec at
  `assets/design-packs/<brand>/DESIGN.md` — read it when you want the brand's layout
  and component principles, not just tokens.
- **Custom / interactive**: open **`assets/theme-studio.html`** — a live editor with
  the preset gallery, per-token pickers, a Look tab, and a preview; persists to
  `localStorage`.
- **Pasted theme.json / global default**: the token-to-THEME-block mapping and the
  default mechanism (`assets/presets/default.json`; priority: explicit request >
  saved default > built-in Persimmon) are in `references/design-system.md` →
  "Applying & defaulting themes".

## Building blocks

> The fast path is a set of helpers on the global `COOKIEBITE` (alias `CB`)
> namespace. **`references/helpers.md` is the API reference** — it opens with the
> full helper index (what each emits) followed by field-level input shapes. Read it
> before calling a helper for a non-payments report. `references/components.md` has
> the hand-built markup the helpers emit; `references/snippets.md` has whole-section
> recipes.

**Freedom is paramount.** The runtime is a **helper library + exposed primitives**,
not a closed framework. The fast path is shorthand for the repetitive ~80%; it never
gates structure. You can always drop raw HTML and a hand-written ECharts option
anywhere and keep it on-theme/dark-aware through the exposed primitives. Helpers emit
the same markup the references teach, so mixing both in one report is fine.

**The helper map** (full signatures in `helpers.md`):

- **Figures & KPIs** — `kpis` (card grid + countup + delta + spark), `bigNumber`
  (the hero figure), `gauge`/`gaugeGrid` (CSS progress rings), `deltaBadge`,
  `trendChip`, `statusDot`.
- **Charts** — `chart` (**the seam**: §10 view-toggle + data-table + aria scaffold
  around an **always author-written** ECharts `option`, merged over `baseChart`,
  registered for dark — never a `{kind}` enum; a `semantics:{x,y}` config declares
  what each channel's number *means* — 'price'/'percent'/'rank'/… — and axis
  formatting + rank inversion follow; misleading charts get structured warnings on
  `CB.__chartWarnings`: truncated zero-baselines, crowded bands, too many rows — and
  a category-row chart with no explicit height **grows with its row count**);
  `shapes.*` (pure option builders:
  waterfall, bullet, sparkline, scatter, radar, dumbbell, slope, lollipop, rangeDot,
  histogram, stackedBar, boxplot, densityArea, marimekko — pass the result to
  `CB.chart`); `funnel`, `heatmap` (calendar), `matrix`, and the full-render heavies
  `treemap`/`sankey`/`gantt` (build their own card — do **not** wrap in `CB.chart`);
  `threshold`/`annotate` (transformers over any option/chart).
- **Structure & narrative** — `claims` (the exec summary as claims anchored to their
  evidence sections), `storyline` (guided walkthrough stepper over one chart),
  `findings` (severity list; `tone` doubles as the severity label), `timeline`,
  `steps`, `leaderboard`, `compare` (decision grid), `cardGrid`, `actionItems`,
  `whatChanged`, `table` (Grid.js with the footguns fixed;
  `cellBar`/`cellHeat`/`cellSpark`/`cellMoney` column formatters), `diff`,
  `pseudocode`, `code`/`codeTabs` (needs the highlight.js tag), `mermaid` (themed,
  dark-aware, ELK layout).
- **Editorial strings** (return **strings** — compose into any HTML) — `pill`,
  `callout`, the admonition family `note/tip/warning/danger/example`, `quote`,
  `takeaway` (TL;DR box), `lead`, `kicker`, `epigraph`, `pullquote`, `figure`
  (numbered figcaption), `fn`/`endnotes` (paired-by-construction footnotes),
  `legend`.
- **Page chrome (opt-in)** — `toc` (enriches the hand-authored `#toc`; NO-OPs over
  one you already filled), `search`, `densityToggle`, `altitudeToggle` (exec/full
  reading altitude — hides `[data-altitude-detail]` sections), `permalinks`,
  `copyReport`, `readingProgress`, `readTime`, `scrollReveal`, `print`, `audit`.
- **Interaction & export** — `tabs`/`reveal` (lazy render + `resize()` — the fix for
  the empty-chart-in-a-hidden-tab footgun), `connectFilter` (chip row → chart
  updates; call the captured instance's `__cbUpdate(option)` in `onChange` so filters
  survive a dark re-theme — worked example in `interactions.md` §1), `copyButton`,
  `sectionToMarkdown`, `glossary` (needs the Tippy tags), `exportPNG`.
- **Color, format & theme** — `categoricalColors(n, {mode})` (identity/emphasis
  peers), `ramp(n)` (ordered), `diverging(n)` (polarity), `fmt(type)` (semantic
  formatter: 'price'/'percent'/'percentPoint'/'delta'/'duration'/'rank'), `markSpecs`
  (the quiet mark defaults — applied automatically by `CB.chart`), `applyLook`,
  `registerChart`/`onThemeChange`, and the primitives below.

There is deliberately **no** `header()`/`page()` layout-shell helper and **no** chart
`{kind}` enum — those would recreate the closed-vocabulary failure mode; the header,
footer, and layout shell stay hand-authored Tailwind.

**What stays escape-hatch (full freedom):** every chart's `option` object, bespoke
`@keyframes`/`color-mix(var(--accent)…)` CSS, hand SVG flows, quadrant boards, all
Alpine filter/tab/accordion/scenario-slider interactions, and the config-form /
prompt-editor / copy-as-diff editing UIs. Reach the **exposed primitives** to stay
on-theme: the CSS-var tokens, `CB.css()`, `CB.readThemeVars()`, `CB.baseChart` +
`CB.theme` (accent at `CB.theme.ACCENT`), `CB.accentRgba()`, `nf`/`money`/
`moneyShort`, `hydrate()`/`refreshIcons()`, `copy()`/`download()`,
`dataTableToggle()` (the data-table alt a hand-written chart still owes), `deepMerge`,
`markSpecs`, `MOTION_OK`. (Legacy `window.*` aliases exist for older reports — new
reports use the `CB.*` names; the list is at the end of `helpers.md`.)

**The silent footguns live in `references/anti-patterns.md`** ("Runtime & helper
footguns") — glossary parse-time timing, fabricated KPI baselines, Grid.js lexical
sorts, `var(--*)` inside a canvas option, unregistered hand charts. Sweep it during
the self-check; skim it before authoring the report script.

**Layout essentials** (hand-authored, kept quiet):

- **TOC sidebar**: include on any report with 3+ sections — a right rail
  (`sticky top-24`, `hidden lg:block`) beside a `flex flex-row-reverse` main column;
  author only the `<ul id="toc">` entries in the `COOKIEBITE:TOC` slot (the runtime's
  `initToc` observer wires active-section highlighting). **Localize the heading word**
  (`목차` → "Contents") — it's inside the editable slot. The full markup shape is in
  the template and `references/components.md` (TOC enrichment).
- **Header**: title (`headline-36`/`title-28`), a one-line takeaway in
  `text-secondary`, context chips (date, scope, author) in
  `bg-accent-weak text-accent-strong`.
- **Section**: a `title-20`/`title-24` heading, one-line setup intro, then the visual
  as the centerpiece.
- **Callouts / timelines / tables**: prefer the helpers; status via the `tone`
  contract (icon + label, never color alone).

## Quality checklist

Before handing over, verify:

- [ ] Opens standalone (double-click works) after inlining; runtime folded in,
      third-party libs via CDN; no console errors that break rendering.
- [ ] The main takeaway is visible within ~5 seconds — a headline number or chart,
      not buried in prose.
- [ ] Sections read as an **argument**: each takeaway feeds a headline claim, bridges
      connect them, and no section exists just to look complete (the anti-padding
      rule — cut filler instead of writing it).
- [ ] At least the key points are visualized (charts/cards/diagrams/timeline), not
      just listed as text.
- [ ] Exactly one accent color; semantic colors only for status/feedback; every
      chart palette picked by its color job (identity / emphasis / order / polarity /
      status) — and the verify script's palette report shows no unaddressed FAIL/WARN.
- [ ] Theme tokens applied consistently (font, accent, neutrals via CSS vars);
      type/spacing/radii/shadow on the template scales, no one-off hexes.
- [ ] Charts are themed (no default rainbow), have titles/labels, a one-line takeaway
      caption, and resize cleanly. No dual-axis chart anywhere; `chartWarnings` in
      the verify checks is empty (no truncated baseline / crowded bands / row cap).
- [ ] Every wide / time-series chart has `dataZoom` (slider + inside).
- [ ] No chart renders blank: charts inside tabs/accordions init lazily on show and
      `resize()` (clicked through in the visual check).
- [ ] Icons are explicitly sized (~16–24px), consistent, never dwarfing the text.
- [ ] Data tables beyond a few static rows use Grid.js via `CB.table` (raw numbers in
      numeric columns).
- [ ] KPI cards lead with the number + a delta badge **only when a real baseline
      exists**; display-size figures stay proportional (`.nums`/tabular only where
      numbers align in columns — tables, axes, delta columns).
- [ ] Numbers consistently formatted (separators, 만/억 or K/M/B per locale, fixed
      precision, %p vs %); nothing wraps mid-figure.
- [ ] Every caption/label matches what its chart actually renders.
- [ ] Status is never color-alone (icon/label paired); every chart has a data-table
      alternative + `aria-label` (hand charts via `dataTableToggle`).
- [ ] Meets the interactivity minimum bar for the report type; the reader can
      explore, not just scroll. Every interaction earns its place.
- [ ] Reads as designed and on-theme: restrained surfaces, shallow hierarchy,
      scannable layout.
- [ ] Sticky TOC sidebar when there are 3+ sections, active-section highlighting,
      heading localized.
- [ ] Responsive: survives the 390px narrow pass (TOC collapses, cards stack, no
      overflow/clipping).
- [ ] **Dark mode reads**: the toggle flips cleanly, charts re-theme, status colors
      still pass — confirmed in the verify script's dark pass.
- [ ] **Rendered and visually verified** with `scripts/verify-report.sh`; the
      **anti-patterns sweep** (`references/anti-patterns.md`) found nothing; issues
      fixed.

## References

- `assets/template.html` — slot-marked report skeleton (`<!-- COOKIEBITE:* -->`).
  References the hosted runtime; ships the built-in light/dark toggle.
- `scripts/scaffold.sh <type> <out.html>` — the non-demo starting point: template +
  a small on-theme skeleton for the TYPE (`dashboard` | `review` | `postmortem` |
  `explainer` | `comparison`). The `cookiebite new` command wraps it.
- `assets/cookiebite.css` / `assets/cookiebite.js` — the **hosted runtime**: tokens,
  dark layer, number helpers, `baseChart` + mark defaults, TOC observer, hydration,
  and every `COOKIEBITE.*` helper. **Never edit per report** — folded in by
  `scripts/inline.sh`.
- `scripts/inline.sh` — fold the runtime into the report (mandatory final step).
- `scripts/verify-report.sh` — render + screenshots (desktop/narrow/dark) + structural
  checks + the palette validation, for the required visual self-check.
- `scripts/validate-palette.mjs` — the standalone palette judge (CVD ΔE, lightness
  band, chroma, contrast; `--ordinal` for ramps). Run by verify-report; usable by hand.
- `references/helpers.md` — **the Helper API reference**: the full helper index, then
  field-level input shapes (required vs optional keys, gotchas) per helper.
- `references/anti-patterns.md` — **what goes wrong**: the negative checklist swept
  during self-check (color, form, marks, interaction, runtime footguns, locale).
- `references/snippets.md` — the section-recipe library: copy-paste on-theme section
  blocks (markup → `SECTIONS`, script → `REPORT-SCRIPT`) and the TYPE skeletons.
- `references/components.md` — hand-built component cheat-sheet: the `tone` contract,
  diff / findings / pseudocode / checklist / SVG-flow / quadrant blocks, the TOC
  shape, and the second (explainer/postmortem) worked example.
- `references/design-system.md` — the token model, accent-token AA contract
  (`--accent-text` / `--accent-on-text` / `accentDark`), the Look system, applying &
  defaulting themes, and the documented Persimmon reference preset.
- `references/libraries.md` — CDN catalog + **which chart/diagram when** + chart-type
  gotchas (long-label collisions) + the palette-function contract.
- `references/interactions.md` — copy-adaptable interaction patterns (filters, view
  toggles, zoom/brush/drilldown/connect, sortable tables, accordions, scenario
  sliders, sticky nav, glossary, comparison §12, state export §13, editing §14).
- `references/craft.md` — visual & readability craft, number/locale formatting,
  accessibility, copy-must-match.
- `references/motion.md` — opt-in animation (scroll reveals, GSAP, Lottie, animated
  SVG flows §6) with reduced-motion guidance.
- `assets/theme-studio.html` / `assets/presets/` / `assets/design-packs/` — the theme
  editor, the 10 token presets, and each brand's full design spec.
