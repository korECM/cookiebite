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

## The core idea: graphic-first, on-theme

Two things make these reports good, and they pull in slightly different directions —
hold both:

1. **Graphic over textual.** Whenever a point can be a chart, a stat card, a
   timeline, a diagram, a progress ring, or a comparison table instead of a
   paragraph, make it the visual. Lead with the headline number. Let the reader
   *see* the story. Long prose is the fallback, not the default.

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

It reads the **local** repo copies of `cookiebite.css`/`.js` (resolved from the
script's own location, not the report's) and replaces the two lines with inline
`<style>`/`<script>`, preserving the before-Tailwind ordering — `cookiebite.js` carries
no `defer`/`type=module` because its first statement sets `window.tailwind.config` and
it MUST load **before** the Tailwind tag (which auto-runs on load and reads that
config). The per-report inline `:root` THEME block stays in `<head>` so the theme
applies at first paint (no FOUC). **The inlined file is the deliverable** — verify and
open *that*, not the raw report.

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
   use the neutral theme already in the template. If the user has a brand/preset
   (e.g. Persimmon) or asks to adjust colors/font, apply it — see "Theming" (including
   "Setting / using a default theme"). One accent color per report; switch only with a reason.
4. **Choose libraries** from `references/libraries.md`. ECharts for rich/interactive
   data, Chart.js for a few simple charts, Alpine.js for tabs/filters/toggles,
   CountUp for hero numbers, AOS for scroll reveal, Grid.js for sortable tables,
   Tippy.js for glossary tooltips. For richer **opt-in animation** (sequenced intros,
   scroll-triggered reveals, Lottie vector art) see `references/motion.md` — add it
   only when motion genuinely helps. Don't load what you won't use.
5. **Plan the interactions** before building. Read `references/interactions.md` and
   pick the ones that fit the data (see "Interactivity" below for the minimum bar).
6. **Build the page**: `cp assets/template.html <report>.html`, then **`Read` the copy**
   (it's a new file — `Edit` fails with "File has not been read yet" otherwise; reading the
   template original doesn't count) and make **surgical `Edit`s into the named
   `<!-- COOKIEBITE:* -->` slot markers** (`HEAD-THEME`,
   `HEAD-LIBS`, `TITLE`, `TOC`, `HEADER`, `SECTIONS`, `FOOTER`, `REPORT-SCRIPT`) —
   don't rewrite the whole file. The slimmed template references the hosted runtime;
   the invariant boilerplate (Tailwind config, number helpers, `baseChart`, dark
   toggle, TOC observer, card hydration) is **no longer in the template** — it lives
   in `cookiebite.js` and costs 0 tokens. Author the repetitive sections with the
   fast-path helpers (`COOKIEBITE.kpis`/`findings`/`timeline`/`table`/`chart`/`pill`/
   `callout`); drop to raw HTML + exposed primitives (`baseChart`, `css()`,
   `accentRgba()`, `registerChart()`, the CSS-var tokens) for anything bespoke. The
   two paths share the same tokens and helpers — mix them freely. See "Runtime fast
   path vs hand-building".
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
  relevant, and glossary tooltips on jargon. For a request/system flow, draw it as
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

The difference between a report that looks AI-generated and one that looks designed
is a handful of habits. The template already bakes these in — keep them as you fill
it with real content:

- **Lead each number with meaning, not just a figure.** A KPI is a label + the big
  number + a **delta badge** (`▲/▼` with a semantic color vs the previous period) +
  a **sparkline**. The reader should see the value *and* its direction at a glance.
  Only show a delta when you actually have a baseline; never invent one (sentinel over
  fake zero). In `COOKIEBITE.kpis`, **omit** the `delta` key for no badge at all; pass
  `delta: null` to render the `—` sentinel. When *no* KPI has a baseline, omit it on all
  of them — a row of `—` reads as stray underscores, not data.
- **Give every chart a one-line takeaway caption** above or below it that says what
  to *notice* ("금·토에 매출이 몰리며 평균을 14% 상회"), not what is plotted. The
  chart shows the data; the caption delivers the point.
- **Annotate charts** with reference lines — an average/target `markLine`, a
  threshold, an event `markArea`. A bare chart makes the reader do the comparison; an
  annotated one makes the point for them.
- **Icons earn their keep — and stay small.** A small Lucide icon on each section
  header or stat card speeds scanning. Size them deliberately and consistently: ~16px
  inline with body text, ~18–20px on section headings, ~20–24px on a stat card. Give
  every icon an explicit `width`/`height` (Lucide renders at 24px and scales up
  otherwise — an unsized icon looks oversized and clumsy next to text). One per
  section/card is plenty; never let an icon dwarf the number or label beside it.
- **Use a real table library for data tables.** Anything beyond a tiny 2–3 row table
  should be a **Grid.js** table (sortable, searchable) rather than a hand-rolled
  `<table>` with custom sort code — it's less code, fewer bugs, and consistent. Theme it
  with the accent (see `references/interactions.md` §4). **Paginate only when the data
  overflows the screen** — Grid.js draws the pager even for one page, so a table that
  fits ends up with a useless "1–7 / 7 · ‹ 1 ›" strip; turn pagination off (>~15 rows
  before it earns a pager). Reserve hand-written `<table>` for short, static tables.
- **Align and digit-pad numbers.** Use `tabular-nums` (the `.nums` class) on anything
  numeric and right-align numeric columns **together with their headers** so figures
  line up and stay comparable — don't let a right-aligned header float over left-aligned
  cells (Grid.js left-aligns by default; right-align the numeric columns explicitly).
- **Respect line length and rhythm.** Cap prose width (~68ch, the `.prose-measure`
  class) so paragraphs stay readable; keep consistent vertical spacing between
  sections; let whitespace separate groups instead of borders everywhere.
- **Hierarchy is shallow and obvious.** One headline, clear section titles, then
  content. Don't nest headings deeply — console-style reports read fast.
- **Define jargon inline when the audience is mixed.** If a technical report will be
  read by non-experts too (execs, other teams), mark technical terms with a dotted
  underline + a hover/focus tooltip giving a plain-language definition (glossary
  tooltips, `references/interactions.md` §11). Experts skim past; everyone else gets
  help without dumbing down the report. Tag a term once, only real jargon.

### Number & locale formatting

Inconsistent number formatting is an instant tell. Be consistent:

- Thousands separators on every count (`184,302`, not `184302`) — use the runtime's
  `COOKIEBITE.nf`/`COOKIEBITE.money` helpers (`Intl.NumberFormat`, locale-driven).
- Korean money reads better in units: `₩24.2억` / `₩412만`, not `₩2,418,500,000` in a
  card. Use `COOKIEBITE.moneyShort()` for headline figures; keep full precision in
  tables/tooltips. (`won`/`wonShort` exist as aliases of `money`/`moneyShort` for
  older snippets.)
- Pick a decimal precision per metric and hold it (`97.07%` everywhere, not `97%`
  here and `97.1%` there). Percentage-point deltas use `%p`, ratio deltas use `%`.
- Currency symbol and unit stay attached and never wrap mid-figure (`whitespace-nowrap`,
  small unit suffix) — see the 매출 card in the template.

### Accessibility (not optional, and it makes reports better for everyone)

- **Never communicate status by color alone** — a core design-system principle and an
  a11y baseline (colorblind readers, grayscale printouts). Pair every colored status with
  an icon or a text label: a green dot becomes `✓ 정상`, a red cell becomes a tag
  reading `위험`. The semantic color reinforces; it doesn't carry the meaning alone.
- **Give every chart a data-table alternative.** A canvas/SVG chart is invisible to
  screen readers and hides exact numbers. Add a "표로 보기" toggle that reveals the
  same data as a real `<table>` (pattern in `references/interactions.md` §10), and
  put an `aria-label` on the chart container summarizing what it shows. This helps
  sighted readers too — they can read precise figures when the chart only shows shape.
- **Keep contrast and targets sane**: the theme's text grays on white already pass;
  don't put `text-secondary` on a colored fill. Interactive controls should be real `<button>`s.

### Copy must match the visual

State only what the chart actually renders. If the caption says "버블 크기는 볼륨을
나타냅니다", the chart had better encode volume as bubble size — a bar chart with that
caption is a bug. After building, re-read each caption/label against its chart and fix
mismatches. The visual self-check is where you catch these.

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
#   <dir>/.verify/full-desktop.png, desktop-tile-00.png, …   (1280px, primary)
#   <dir>/.verify/full-narrow.png,  narrow-tile-00.png,  …   (768px, responsive)
#   <dir>/.verify/full-dark.png,    dark-tile-00.png,    …   (1280px, dark — if toggle present)
#   plus checks-desktop.json / checks-narrow.json / checks-dark.json
```

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
- Accent: `--accent`, `--accent-strong`, `--accent-weak`, `--accent-on`
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

- **Applying a theme the user pasted (do this yourself — no scripts needed).** The
  studio's "Copy for agent" gives the user a prompt with their `theme.json` inline.
  When a user pastes a theme.json (or its token values) and asks to use/apply it,
  **set the report's THEME block directly from those tokens** — you don't need any
  script or to know where the skill is installed. Map the JSON to the THEME block:
  - `font.url` → the font `<link href>`; `font.family` + `font.fallback` → `--font-family`
  - `colors.accent/accentStrong/accentWeak/accentOn` → `--accent` / `--accent-strong` / `--accent-weak` / `--accent-on`
  - the nine neutrals → `--c-bg`, `--c-surface`, `--c-primary`, `--c-secondary`,
    `--c-disabled`, `--c-placeholder`, `--c-line`, `--c-line-weak`, `--c-disabled-bg`
  - the four semantic → `--c-critical` / `--c-cautionary` / `--c-positive` / `--c-informative`
  - `locale` → `window.REPORT_LOCALE`
  Replace the existing `<!-- THEME … -->`…`<!-- end THEME -->` block (or build it into a
  new report). To make it reusable by name, save the JSON to `assets/presets/<name>.json`
  and the user can later just say "use the `<name>` theme". (`scripts/apply-theme.py`
  does the same swap from the CLI if the repo is cloned, but it's optional.)

### Setting / using a default theme

A user can set **one global default theme** that applies to every report they make from
now on, separate from the per-report "Copy for agent" apply above.

**Theme priority for a report** (highest wins):

1. A theme/preset the user explicitly asks for in this request.
2. The user's saved default at `assets/presets/default.json` (in this skill's directory).
3. The template's built-in default (Persimmon).

- **Using it.** When the user hasn't asked for a specific theme/preset for a report,
  check whether `assets/presets/default.json` exists in this skill's directory. If it
  does, apply it as the report's THEME block using the same token→THEME-block mapping
  documented just above. Otherwise fall back to the template's built-in default.
  `default.json` is not shipped, so out of the box this falls through to the built-in
  default.
- **Setting it.** When the user says "set this as my default" / "make this my default
  theme" (typically with a pasted theme.json, e.g. from the theme studio's "Set as my
  default" button), write that JSON to this skill's `assets/presets/default.json`.
  Confirm that all future reports will use it until they change it — the user reverts by
  deleting that file or setting a new default.

## Building blocks (compose these; don't copy literally)

> For the full declarative cheat-sheet — the unified `tone` contract plus copy-paste
> Diff / findings / pseudocode / checklist / SVG-flow / quadrant components — see
> `references/components.md`. The essentials are summarized here.

### Runtime fast path vs hand-building

**Freedom is paramount.** The runtime is a **helper library + exposed primitives**,
not a closed framework. The fast path is a shorthand for the repetitive ~80%; it never
gates structure. You can always drop raw HTML and a hand-written ECharts option
anywhere and keep it on-theme/dark-aware by reaching the exposed primitives. The
helpers emit the **same markup the references teach**, so mixing helpers and
hand-written sections in one report is fine and backward-compatible — `references/*.md`
(`components.md`, `interactions.md`, `motion.md`) stay valid for hand-building every
section by hand.

The fast path is exactly **6 helpers** on the global `COOKIEBITE` namespace. There is
deliberately **no** `header()`/`page()`/`toc()` shell helper and **no** chart `{kind}`
enum — those would recreate the closed-vocabulary failure mode; the header, footer,
layout shell, and `<ul id="toc">` stay hand-authored Tailwind.

| Fast-path helper | Emits (data → markup) | Hand-built equivalent |
| --- | --- | --- |
| `COOKIEBITE.kpis(target, items, opts?)` | responsive KPI card grid (label + countup number + delta badge + sparkline) | `components.md` KPI / "Stat cards" + template KPI section |
| `COOKIEBITE.findings(target, items, opts?)` | ranked severity findings list + Alpine filter chips | `components.md` "Severity-coded findings list" |
| `COOKIEBITE.timeline(target, items, opts?)` | Alpine `x-for` vertical timeline (marker + expandable detail) | incident-timeline pattern (`interactions.md`) |
| `COOKIEBITE.table(target, config)` | Grid.js table, 3 footguns fixed (pager >15, right-aligned numerics, accent theme) | `interactions.md` §4 |
| `COOKIEBITE.chart(target, config)` | **wrapper only**: §10 view-toggle + data-table + aria scaffold, merges your hand-written `option` over `baseChart`, registers for dark re-theme | `interactions.md` §10 + template trend chart |
| `COOKIEBITE.pill(label, opts)` / `COOKIEBITE.callout(html, opts)` | tone badge / left-accent insight box (return **strings**, compose anywhere) | `components.md` tone table |

`COOKIEBITE.chart` is the fast/escape **seam**: the wrapper is data, but the ECharts
`option` is **always author-written** (merged over `baseChart`; plain objects deep-merge,
arrays like `series`/`dataZoom` replace wholesale) — never a `{kind}` shortcut.

**What stays escape-hatch (full freedom, never forced declarative):** every chart's
`option` object, the MRR-waterfall / Sankey / candlestick tricks, bespoke
`@keyframes`/`color-mix(var(--accent)…)` CSS, hand SVG flows, quadrant boards, diff /
pseudocode blocks, all Alpine filter/tab/accordion/scenario-slider interactions, and the
config-form / prompt-editor / copy-as-diff editing UIs. Reach the **exposed primitives**
to stay on-theme: the CSS-var tokens (`var(--accent)`, `var(--c-*)`), `COOKIEBITE.css()`,
`COOKIEBITE.readThemeVars()`, `COOKIEBITE.baseChart` + `COOKIEBITE.theme`,
`COOKIEBITE.accentRgba()`, `nf`/`money`/`moneyShort`, `hydrate()`/`refreshIcons()`,
`copy()`/`download()`, `dataTableToggle()` (data-table alt for a hand-written chart), `MOTION_OK`.

**Dark-aware hand charts must register.** Any canvas/Mermaid/CSS-var-reading-JS that
should follow the dark toggle MUST call `COOKIEBITE.registerChart(chart, renderFn)` (or
`onThemeChange(cb)`, or listen for `'cookiebite:theme'`) — unregistered hand charts won't
flip. Pure CSS/SVG using `var(--*)` re-themes automatically (see "Theming → Dark mode").

**Fast-path gotchas (read before using the helpers — these bite silently):**
- `findings` reuses `tone` as the **severity label**: `critical` renders "Critical", `warning` "High", `info` "Medium", `neutral` "Low". This is the one place `tone` changes the *text*, not just the color (everywhere else — pill, callout, table — it only sets color). `success` has no severity meaning here, so it falls back to "Note". Pass `label` on the item to override the chip text.
- `kpis` delta: **omit** the `delta` key for no badge at all; pass `delta: null` to render the `—` "no baseline" sentinel. When no KPI has a baseline, omit it on all of them (a row of `—` reads as stray underscores).
- A **hand-written** (escape-hatch) chart still owes a data-table alternative + `aria-label` (the a11y rule). `CB.chart` adds them automatically; for a bespoke chart, call `COOKIEBITE.dataTableToggle(chartSelector, { columns, rows, ariaLabel })` to inject the "표로 보기" toggle + table.

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
      <ul class="sticky top-24 space-y-2 text-body-14" id="toc">
        <li><a href="#summary" class="block px-12 py-8 rounded-small text-secondary hover:text-primary">요약</a></li>
        <li><a href="#metrics" class="block px-12 py-8 rounded-small text-secondary hover:text-primary">지표</a></li>
        <!-- … one per section … -->
      </ul>
    </nav>
    <main class="min-w-0 flex-1"><!-- sections with matching ids --></main>
  </div>
  ```
  (The runtime observes every `main section[id]`; you just keep the ids in sync.)
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
- [ ] Responsive: survives the 768px narrow pass (TOC collapses, cards stack, no overflow/clipping).
- [ ] **Dark mode reads**: the toggle flips cleanly, charts re-theme (axes/grid legible, no blown contrast), and status colors still pass — confirmed in the verify script's dark pass.
- [ ] **Rendered and visually verified** with `scripts/verify-report.sh`: desktop + narrow tiles read; no label overlap / clipped text / broken charts / edge bleed / copy↔visual mismatch; issues fixed.

## References

- `assets/template.html` — slim, slot-marked report skeleton (`<!-- COOKIEBITE:* -->`
  regions). **`cp` this to start, then surgical-`Edit` the slots.** References the
  hosted runtime; ships the built-in **light/dark toggle** (see "Theming → Dark mode").
- `assets/cookiebite.css` / `assets/cookiebite.js` — the **hosted runtime**: invariant
  boilerplate (Tailwind config, default + dark token layers, number helpers, `baseChart`,
  dark toggle, TOC observer, card hydration) plus the `COOKIEBITE.*` fast-path helpers
  and exposed primitives. **Never edit per report** — folded into the deliverable by
  `scripts/inline.sh`.
- `scripts/inline.sh` — fold the **local** runtime copies into a report to produce the
  self-contained deliverable (see "Delivery"). Mandatory final step.
- `references/components.md` — declarative component cheat-sheet: the unified `tone`
  contract (neutral/info/success/warning/critical → semantic tokens) plus copy-paste
  building blocks, including **Diff view, severity-coded findings, pseudocode/annotated
  code, stateful checklist, themed SVG flow diagram, and a spatial quadrant board**.
  Read this when assembling sections, especially for code-review / change reports.
- `assets/theme-studio.html` — interactive theme editor (presets, color/font pickers,
  live preview, export CSS/`theme.json`). Open when the user wants a custom theme.
- `assets/presets/` — 10 theme-token presets (persimmon default, neutral, + stripe/vercel/
  linear/notion/supabase/sentry/resend/raycast). `assets/design-packs/<brand>/DESIGN.md`
  holds each brand's full source design spec for deep-fidelity theming.
- `scripts/verify-report.sh` — render + sectioned screenshots (desktop + narrow) for
  the required visual self-check.
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
