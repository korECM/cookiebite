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

Turn whatever the user gives you — data, analysis, notes, research, metrics, a status
update — into a **single self-contained HTML file** someone enjoys reading and can grasp
at a glance.

**The default is a quiet reading document.** The author owns semantic HTML, CSS, SVG,
and the argument's order. Cookiebite supplies a small visual contract (contrast-safe
theme tokens) and optional, opt-in behavior. It never chooses a layout, and it never
draws a card, section, or control for you. Most reports read in sequence — answer,
evidence, takeaway, sources — and want no runtime beyond the core. A dashboard, and the
older full-runtime with its helper library, is an explicit path you take **only when the
material demands it** (see "Compatibility path").

This skill is for **reading material** (reports, summaries, dashboards, recaps, research
write-ups). It is **not** for building product/console application UI — if the user wants
an app screen or component, this isn't the right skill.

**`DESIGN.md` is the frozen contract** for everything below — read it once as the source
of truth for the freeform system (theme seed, token ABI, capabilities, verification).

## Quickstart (the freeform path)

1. **Plan the claims and evidence first** — one to three claims, the evidence for each,
   the reader's first question. Decide *reading vs dashboard* here (see below). This
   happens before any file.
2. **Scaffold the reading default**: `bash scripts/scaffold.sh <out>.html` (no type) emits
   the freeform reading template — semantic HTML you own, the core runtime only, an inert
   theme seed, an empty `<!-- COOKIEBITE:USE -->` marker. (`scaffold.sh reading <out>` is
   identical.) Then `Read` the file and surgical-`Edit` the `<!-- COOKIEBITE:* -->` slots
   (`LANG`, `TITLE`, `HEADER`, `SECTIONS`, `FOOTER`, `MODULES`, `REPORT-SCRIPT`).
3. **Choose a theme seed** — edit the eight values in the `<script id="cookiebite-theme">`
   block, or paste a whole preset seed (see "Theme seed").
4. **Declare behavior in the marker** only if you need it — e.g. `<!-- COOKIEBITE:USE chart
   table -->`. Then just write the author calls in `COOKIEBITE:REPORT-SCRIPT`; the inliner
   injects each declared module into `COOKIEBITE:MODULES` for you (leave that slot empty).
   A pure reading doc needs none of this (see "Capabilities").
5. **Inline selectively**: `bash scripts/inline.sh <report>.html -o <out>.html` — a
   marker-bearing report is routed through the assembler, which inlines **only** the
   dependencies you declared and emits a dependency summary (see "Inline").
6. **Verify (release gate)**: run the evidence verifier (see "Verify"). Hard findings
   block; required manual-review entries must be recorded before a release is complete.

The rest of this file is the reasoning behind each step — read it once, not per build.

## Plan claims + evidence first

Start with **one to three claims, their evidence, and the reader's first question.** Order
the sections as an **argument, not an inventory**: each section's takeaway feeds one
claim, and a one-line bridge hands the reader to the next section. **Anti-padding:** the
outline comes *from* the material. A section added to look complete (background nobody
asked for, a chart restating another chart) dilutes trust — cut it.

**Reading vs dashboard.** Most investigations, proposals, and explainers read in
sequence: `main`, an `h1`, a standfirst paragraph, `section`s, `figure`s where evidence
is visual, a source/method `footer`. **A dashboard is right only when readers must scan
and slice live dimensions** — a fixed three-number status is not a dashboard. When the
report is long or the audience mixed, lead with the claims (as a standfirst or a claims
list) so a reader who trusts them can stop, and a doubted one is one section away from its
proof.

**Graphic over textual, still.** When a point can be a chart, a stat, a timeline, a
diagram, or a comparison instead of a paragraph, make it the visual — as authored markup
(`figure`, `table`, hand SVG) or, where it earns the dependency, a declared `chart`. The
most-missed case is **structure described in words** — "A calls B, which verifies with C"
is a diagram that hasn't been drawn yet. Draw system flows natively (never GIFs), so they
stay on-theme, crisp, and re-themeable.

## Scaffold (the reading default)

`bash scripts/scaffold.sh <out>.html` copies `assets/template.html` verbatim — the
finished freeform skeleton. It carries:

- Semantic `main` / `header` / `section` / `footer` markup you own outright. One-off CSS
  values are fine; promote a value to a report-local custom property only when it repeats
  in the report, and to the shared theme only when it repeats with the same meaning across
  reports.
- The inert theme seed (`<script type="application/json" id="cookiebite-theme">`).
- The core CSS/JS (`assets/core/cookiebite-core.*`) — reset, typography, responsive
  measure, focus, print, locale formatting, theme state, capability registration,
  lifecycle disposal, verification instrumentation. **The core creates no page, title,
  section, icon, card, control, or wrapper.**
- An empty `<!-- COOKIEBITE:USE -->` marker and empty `COOKIEBITE:MODULES` /
  `REPORT-SCRIPT` slots.

Localize `<html lang>` (the `COOKIEBITE:LANG` slot) and prose by hand for non-Korean
reports (see "Localization").

## Theme seed

Core documents carry one inert theme document — eight `seed` values are the complete
shared visual input:

| Key | Meaning | Valid values |
| --- | --- | --- |
| `font` | reading type family | a safe CSS family list |
| `background` | page background | opaque six-digit hex |
| `text` | authored body text | opaque six-digit hex |
| `accent` | one emphasis color | opaque six-digit hex |
| `spaceUnit` | base spacing unit | integer `2..12` |
| `measure` | prose line length | integer `45..90ch` |
| `radius` | soft edge | integer `0..32` |
| `surface` | surface strategy | `border`, `tonal`, or `shadow` |

`schemaVersion: 1` is mandatory. Optional `dark`, `status`, `resources`, `locale`, and
`overrides` refine the seed; a partial `dark` inherits omitted values from `seed`.
`overrides` may name only semantic roles (`textMuted`, `divider`, `accentStrong`,
`surfaceRaised`, `focus`) — component names are invalid. `resources` owns external font
stylesheets; naming a font family is not an implicit network request.

**To reskin:** swap individual values, or paste a whole preset's `seed`/`resources`/
`locale` from `assets/presets/*.json` (persimmon default, neutral, plus brand seeds:
stripe, vercel, linear, notion, supabase, sentry, resend, raycast). If the user names a
brand ("make it look like Stripe"), use that preset.

**The compiler** (`assets/theme-compiler.js`, run at inline time via
`scripts/compile-theme.mjs`) turns the seed into the stable `--cb-*` token ABI
(`--cb-background`, `--cb-surface`, `--cb-text`, `--cb-accent`, `--cb-on-accent`,
`--cb-focus`, `--cb-measure`, `--cb-radius`, …). **Authored colors are never silently
changed.** Text/background and on-accent pairs must meet `4.5:1`; a focus outline must
meet `3:1` against its adjacent surface — only *derived* tones are tuned to satisfy them.
It emits literal resolved colors, so rendering never depends on relative-color browser
support. `CB.theme.current()` returns the active compiled theme; `CB.theme.set('light' |
'dark')` exists only when the seed declares `dark`, and never injects a toggle.

## Capabilities (the `COOKIEBITE:USE` marker)

Behavior is **explicit in the marker** and nothing else: `<!-- COOKIEBITE:USE chart table
-->`. Five capabilities exist. **Each enhances authored markup — none creates a card,
section, control, or wrapper.** Write the author call in `COOKIEBITE:REPORT-SCRIPT`; the
inliner injects each declared module into `COOKIEBITE:MODULES` (you may also write the
module `<script src=".../capabilities/X.js">` yourself — the inliner inlines it in place).

| Capability | Authored host + call | It must NOT create |
| --- | --- | --- |
| `chart` | `CB.chart(host, { option, data: { columns, rows }, ariaLabel })` → `{ instance, update, resize, dispose }` | frame, caption, toolbar, title, section |
| `table` | `CB.sortable(table, { numericColumns })` → `{ dispose }` | a replacement table, grid, filter, wrapper |
| `glossary` | `CB.glossary(term, { definition })` → `{ dispose }` | visible chrome, a parent surface |
| `motion` | `CB.motion(target, { play })` → `{ play, cancel, dispose }` | animation controls, a layout wrapper |
| `export` | `CB.export(region, { format: 'print' \| 'html' })` → `{ run, dispose }` | a button, toolbar, implicit raster image |

- **chart** requires an authored host, an `ariaLabel`, and a structured `data:{columns,
  rows}` equivalent. The `option` callback receives the active theme and re-evaluates
  after an allowed theme change — read colors through it, never hard-coded hexes. Misleading
  charts (truncated baseline, crowded bands, too many rows) raise structured warnings.
- **table** — `numericColumns` is zero-based. Sorting is stable, locale-aware,
  keyboard-operable, updates `aria-sort`, and restores authored markup on `dispose()`.
- **glossary** — terms are authored `dfn` / focusable elements; the definition opens from
  keyboard focus/activation and closes with Escape.
- **motion** observes reduced motion and does nothing unless explicitly played.
- **export** runs only from an author-provided trigger; scoped print or HTML only.

**A known-but-omitted capability fails fast** — its stub throws an error naming the exact
marker addition needed. `compat` cannot be combined with a modular capability. The core
records every runtime capability call for verification.

## Inline (selective assembly)

`bash scripts/inline.sh <report>.html -o <out>.html`. When the file carries a
`COOKIEBITE:USE` marker, `inline.sh` routes it through the assembler
(`scripts/assemble-report.mjs`), which inlines **only the declared dependencies**:
compiled theme CSS, then declared external resources (**ECharts only if `chart` is
declared**), then core CSS, core JS, the selected capability modules, then the authored
report scripts — in that order. It rejects unknown capabilities and undeclared direct
calls before writing; declared-but-unused capabilities are warnings. Assembly writes a
temp file and renames only after every dependency resolves.

It emits one dependency-summary JSON block (`id="cookiebite-dependency-summary"`):
`mode`, `declared`, `includedModules`, `externalResources`, `versions`. **The inlined
file is the deliverable** — verify and open *that*. A marker-less legacy report falls
through to the monolithic path unchanged (see "Compatibility path").

**Do not ship the output as a claude.ai Artifact** — the Artifact CSP blocks every
external host, so any CDN library (fonts, ECharts) never loads. Deliver the file, or host
it and share the link.

## Verify (release gate)

The evidence verifier classifies rendered measurements into severity-tagged findings.
`scripts/verify-report-dom.js` + `scripts/build-verification-report.mjs`, driven by
`evals/verifier-runner.mjs`, produce `verification.json` (`schemaVersion`, `complete`,
`passed`, `findings`, `inventory`, `manualReview`). Each finding carries a rule ID,
severity, viewport, theme, selector/chart id, measured data, and screenshot/rectangle
evidence. The deterministic pass runs at **390, 768, and 1280px**; core dark verification
runs only when the seed declares `dark`.

**Hard findings block** (and gate the release): horizontal overflow, clipped or
overlapping text/chart labels, degenerate charts, uncaught errors, required-resource
failures, insufficient contrast, unreachable keyboard interaction, absent chart ARIA or
data alternative, truncated bar baseline, and a declared/runtime **capability mismatch**.
Warnings cover repeated literal candidates, extra surfaces/shadows/icons/controls, unused
capabilities, and long documents with no navigation aid.

**Some judgments are deliberately human** and live in `manualReview`: caption meaning vs
data, status-by-color in arbitrary authored graphics, duplicated claims, prose-vs-visual
suitability, and whether the conclusion is visible in five seconds. **A release is
incomplete — exit 2 — while required manual-review entries are unrecorded**, not
successful. Look at the actual pixels for the human judgments; you cannot tell whether a
report reads right by reading its source.

## Compatibility path (the legacy full-runtime)

The five legacy report types still work, unchanged, for when you genuinely need the
helper library and full runtime (KPI card grids, `CB.*` helpers, storyline, Grid.js
tables, the built-in light/dark toggle):

```bash
bash scripts/scaffold.sh <dashboard|review|postmortem|explainer|comparison> <out>.html
```

These render from `assets/template-compat.html` with the full `assets/cookiebite.css` +
`assets/cookiebite.js` runtime (Tailwind + ECharts + light JS). Inlining a **marker-less**
legacy report keeps the monolithic inline path — `inline.sh` folds `cookiebite.css/.js`
inline and leaves third-party libs on CDN. Legacy reports are never rewritten, and their
scaffold goldens are frozen.

Reach for this path when the material is a scan-and-slice dashboard, or a report whose
value is in the interactive helper components — not as the default. **Load the legacy
detail conditionally** — only when actually building one of these — from the existing
`references/*.md` (component markup, helper API, interaction patterns). Do not read them
for a freeform reading doc.

## Localization

Match copy to the source language (Korean source → Korean copy). For a non-Korean report,
hand-edit: (a) `<html lang>` in the `COOKIEBITE:LANG` slot; (b) the seed's `locale`
(`{ number, currency }`) which drives separators, currency, and `만/억` vs `K/M/B`; and
(c) any UI words you typed that aren't under a slot. Applying a preset seed sets `locale`
for you. The Persimmon default is Korean/Pretendard/₩; the neutral preset is
Latin/Inter/en-US.

## Quality checklist

Before handing over, verify:

- [ ] Opens standalone after inlining; declared dependencies folded in, third-party libs
      via CDN; no console errors that break rendering.
- [ ] The conclusion is visible within ~5 seconds — the claim/headline first, not buried
      in prose (a manual-review judgment).
- [ ] Sections read as an **argument**: each takeaway feeds a claim, bridges connect them,
      no section exists just to look complete.
- [ ] Reading vs dashboard chosen for the right reason — a dashboard only when readers
      must scan/slice live dimensions.
- [ ] Exactly one accent; authored text/background/on-accent unchanged and contrast-safe;
      status never color-alone (icon/label paired).
- [ ] Every declared `chart` has an `ariaLabel` and a `data:{columns,rows}` alternative;
      no misleading-chart warnings (truncated baseline / crowded bands / row cap).
- [ ] The marker declares exactly what's used — no undeclared calls, no unused
      capabilities.
- [ ] Numbers consistently formatted per locale; nothing wraps mid-figure; every caption
      matches what its figure renders.
- [ ] Survives the 390 / 768 / 1280 verifier passes with no hard findings; dark verified
      when the seed declares `dark`.
- [ ] **Verified** — `verification.json` has no unaddressed hard finding, and every
      required manual-review entry is recorded.

## References

- **`DESIGN.md`** — the frozen freeform contract: theme seed, resolved token ABI, core +
  capability rules, assembly and verification contracts. The source of truth; read it
  first.
- `assets/template.html` — the reading (freeform) scaffold with `COOKIEBITE:*` slots and
  the inert theme seed.
- `assets/theme-compiler.js` / `scripts/compile-theme.mjs` / `assets/theme-seed.schema.json`
  — the seed→`--cb-*` compiler and its schema.
- `scripts/scaffold.sh` — reading default (no type) or a legacy type; `scripts/inline.sh`
  → `scripts/assemble-report.mjs` — selective assembly (marker) or monolithic (legacy).
- `scripts/verify-report-dom.js` / `scripts/build-verification-report.mjs` /
  `evals/verifier-runner.mjs` — the evidence verifier (release gate).
- `assets/presets/*.json` / `assets/theme-studio.html` — preset seeds and the live theme
  editor.

**Legacy full-runtime references — load conditionally, only when building a legacy type:**

- `references/helpers.md` — the `CB.*` helper API index and per-helper input shapes.
- `references/components.md` — hand-built component markup, the `tone` contract, worked
  examples.
- `references/snippets.md` — copy-paste on-theme section recipes and the TYPE skeletons.
- `references/design-system.md` — the legacy token model, the Look system, applying &
  defaulting themes.
- `references/libraries.md` — CDN catalog, which chart/diagram when, chart-type gotchas.
- `references/interactions.md` — filters, view toggles, zoom/drilldown, sortable tables,
  comparison, state export, editing.
- `references/craft.md` — visual & readability craft, number/locale formatting,
  accessibility, copy-must-match.
- `references/anti-patterns.md` — the negative checklist (color, form, marks, interaction,
  runtime footguns, locale).
- `references/motion.md` — opt-in animation with reduced-motion guidance.
- `assets/cookiebite.css` / `assets/cookiebite.js` — the legacy monolithic runtime; never
  edit per report, folded in by `inline.sh`.
