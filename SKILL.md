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

**You write a typed TSX report; `cookiebite build` renders it to one HTML file.** You own
the argument's order, the prose, and the choice of components. Cookiebite owns the visual
contract — theme tokens, layout primitives, accessibility, chart compilation — and the
build refuses anything that would break it (off-palette colors, a chart with no aria
label, a capability you use but don't declare). That refusal is the point: the build
carries the fussy invariants so you spend your attention on the story.

**The default is a quiet reading document.** Most reports read in sequence — answer,
evidence, takeaway, sources — as authored `Section`s. A dashboard is an explicit choice you
make **only when readers must scan and slice live dimensions** — not the default.

This skill is for **reading material** (reports, summaries, dashboards, recaps, research
write-ups). It is **not** for building product/console application UI — if the user wants
an app screen or component, this isn't the right skill.

## Quickstart

```bash
bunx cookiebite new report.tsx           # typed starter report
bunx cookiebite build report.tsx         # typecheck + token lint → report.html
bunx cookiebite verify report.html --runs 3
```

1. **Plan the claims and evidence first** (see below) — decide *reading vs dashboard*, and
   which points want to be a chart, a stat, a table, or a diagram. This happens before you
   touch the file.
2. **`bunx cookiebite new report.tsx`** scaffolds a typed starter: a `<Report>` with a
   theme import and a couple of sections. Fill it with the real narrative and data using
   the components below. Import components from `cookiebite`, themes from `cookiebite/themes`.
   The file's **default export must be the `<Report …>` element itself**
   (`export default (<Report theme={…} title="…">…</Report>)`) — the build reads it to
   assemble the document; keep that shape if you write or regenerate the file by hand.
3. **`bunx cookiebite build report.tsx`** typechecks the TSX, lints every color to the
   `var(--cb-*)` token ABI, compiles each `Chart` for light and dark, and emits a single
   `report.html`. A type error, an off-palette color, an empty chart aria label, or a
   used-but-undeclared capability **fails the build** with a file/line message.
4. **`bunx cookiebite verify report.html --runs 3`** renders the HTML at three breakpoints
   (and a dark pass when the theme declares `dark`) and reports layout/accessibility
   findings. `--runs 3` repeats the whole pass to catch flaky findings. It needs
   `agent-browser` installed (`npm i -g agent-browser && agent-browser install`).
5. **Look at the actual pixels** for the judgments the build can't make (see "Verify") and
   hand back the HTML.

The rest of this file is the reasoning behind each step — read it once, not per build.

## Plan claims + evidence first

Start with **one to three claims, their evidence, and the reader's first question.** Order
the sections as an **argument, not an inventory**: each section's takeaway feeds one
claim, and a one-line bridge hands the reader to the next section. **Anti-padding:** the
outline comes *from* the material. A section added to look complete (background nobody
asked for, a chart restating another chart) dilutes trust — cut it.

**Reading vs dashboard.** Most investigations, proposals, and explainers read in
sequence: a `Standfirst`, `Section`s, a `Chart` or `Table` where evidence is visual, a
`Sources` footer. **A dashboard is right only when readers must scan and slice live
dimensions** — a fixed three-number status is not a dashboard. When the report is long or
the audience mixed, lead with the claims (use `Claims`, whose evidence anchors link to the
`Section` that proves each one) so a reader who trusts them can stop, and a doubted one is
one click from its proof.

**Graphic over textual, still.** When a point can be a chart, a stat, a timeline, a
diagram, or a comparison instead of a paragraph, make it the visual — `Chart`, `KpiRow`,
`Matrix`, `RangeDot`, `Table`, or hand-authored SVG in a `Section`. The most-missed case is
**structure described in words** — "A calls B, which verifies with C" is a diagram that
hasn't been drawn yet. Draw system flows as hand SVG (never GIFs) so they stay on-theme,
crisp, and re-themeable; color them with `var(--cb-*)` tokens so the build's lint passes.

## Component catalog

Import from `cookiebite`. Every component enhances the document — **none invents a card,
section, or control you didn't ask for.** Any color you write in raw JSX must be a
`var(--cb-*)` token (see "Theme"); the build's lint fails on a literal hex, rgb, or color
name.

| Component | Signature | Role |
| --- | --- | --- |
| `Report` | `{ theme, title, lang?, children }` | Document shell. The build reads `theme` / `title` / `lang` to assemble `<head>`. Wraps everything. |
| `Standfirst` | `{ kicker?, headline, children? }` | Lead block: optional kicker line, the `h1`, an optional standfirst paragraph. |
| `Section` | `{ title, children, id? }` | A `section` + `h2`. Give it an `id` to make it a `Claims` evidence anchor. |
| `Sources` | `{ children }` | Source / method footer. |
| `KpiRow` | `{ items }` — item `{ label, value, unit?, delta?, note? }` | KPI card row. `delta` is `{ dir: 'up'\|'down'\|'flat', text, tone: 'success'\|'critical'\|'neutral' }` — a direction glyph plus text, never color alone. |
| `Claims` | `{ items, title? }` — item `{ claim, evidence?, value?, tone? }` | Claim → evidence anchor list. `evidence` is a `'#section-id'` matching a `Section` `id`. |
| `Findings` | `{ items }` — item `{ tone, title, where?, note?, label? }` | Severity finding list. `tone` is `critical\|warning\|info\|neutral\|success`; the badge is text, never color alone. |
| `Matrix` | `{ rows, cols, data, max?, format?, ariaLabel, caption? }` | Accent-overlay heat table. Pass `max` explicitly to avoid a constant-column trap. `data` is `number[][]`. |
| `RangeDot` | `{ rows, domain?, format?, unit?, ariaLabel }` | min–max–value dot figure as hand SVG — no chart dependency. Row `{ label, min, max, value }`. |
| `Table` | `{ columns, rows, sortable?, caption? }` | Table. With `sortable`, it declares the `table` capability itself; sorting is stable, locale-aware, keyboard-operable. Column `{ header, numeric? }`. |
| `Glossary` | `{ term, definition }` | Inline term definition (declares the `glossary` capability). Opens from keyboard focus/activation, closes with Escape. |
| `Chart` | `{ type, data, semanticTypes, encodings, ariaLabel, height? }` | flint semantic-spec chart, compiled at build time (see "Chart"). |

The exact prop types live in the signature-index comment atop
`packages/cookiebite/src/components.tsx` and `capability-components.tsx` — and the build
typechecks your usage, so a wrong prop is a compile error, not a silent bug.

## Theme

Pass a `ThemeDocument` to `Report`'s `theme` prop. Use a preset from `cookiebite/themes`
(`persimmon` default, `neutral`, plus `stripe`, `vercel`, `linear`, `notion`, `supabase`,
`sentry`, `resend`, `raycast`), or build the same object yourself. If the user names a
brand ("make it look like Stripe"), import that preset.

```tsx
import { stripe } from 'cookiebite/themes';
// …
<Report theme={stripe} title="Weekly revenue" lang="en"> … </Report>
```

A `ThemeDocument` is `{ schemaVersion: 1, seed, dark?, status?, resources?, locale?,
overrides? }`. The eight `seed` values are the complete shared visual input:

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

`schemaVersion: 1` is mandatory. Optional `dark` (a partial seed — omitted values inherit
from `seed`) ships dark tokens and **turns on the verifier's dark pass automatically**.
`overrides` may name only semantic roles (`textMuted`, `divider`, `accentStrong`,
`surfaceRaised`, `focus`) — component names are invalid. `resources` owns external font
stylesheets; naming a font family is not an implicit network request. `locale`
(`{ number, currency }`) drives separators, currency, and `만/억` vs `K/M/B`; a preset sets
it for you.

The build compiles the seed into the stable `--cb-*` token ABI (`--cb-background`,
`--cb-surface`, `--cb-text`, `--cb-accent`, `--cb-on-accent`, `--cb-focus`, `--cb-measure`,
`--cb-radius`, …) and emits literal resolved colors. **Your authored colors are never
silently changed** — text/background and on-accent pairs must meet `4.5:1` and a focus
outline `3:1`, and only *derived* tones are tuned to satisfy them; a seed that can't be
made contrast-safe fails the build. Reference `var(--cb-*)` tokens in any raw JSX style or
hand SVG — never a hard-coded color.

**The two first-class ways to get a custom theme** are (a) a preset from
`cookiebite/themes`, and (b) writing a `ThemeDocument` object yourself from the seed table
above. The **edit-cookiebite-theme** skill's live theme studio is a third, visual way to
*explore* colors — but its export is a different shape (`{ name, font, colors, locale }`),
**not** a `ThemeDocument`, and there is no converter. To use a studio export, copy its
values into a seed by hand: `colors.bg` → `background`, `colors.primary` → `text`,
`colors.accent` → `accent`, `font.family` joined with `font.fallback` → `font`,
`font.url` → `resources.fontStylesheets`, and `locale` carries over as-is. The remaining
seed keys (`spaceUnit`, `measure`, `radius`, `surface`) aren't in the export — start from
a preset's values (persimmon: `4`, `'68ch'`, `12`, `'border'`).

## Chart

`Chart` takes a **flint semantic spec**, not an ECharts option:

- `type` — a flint chart type string (`"Bar Chart"`, `"Line Chart"`, `"Area Chart"`,
  `"Funnel Chart"`, `"Stacked Bar Chart"`, `"Pie Chart"`, …).
- `data` — an array of homogeneous row objects (every row has the same keys).
- `semanticTypes` — each field's role, e.g. `{ week: 'Category', mrr: 'Quantity' }`.
- `encodings` — channel → field, e.g. `{ x: 'week', y: 'mrr', color: 'plan' }`.
- `ariaLabel` — **required, and keep it short.** The build compiles a hidden data-table
  whose `<caption>` is this label; a long sentence sets a wide minimum table width and can
  overflow at 390px. Write "p99 latency over the incident", not a full paragraph.
- `height?` — optional pixel height (default 320).

The build compiles the spec to ECharts once for light and once for dark, reading colors
from the active theme, and registers the `chart` capability for you. **Only declarative
chart types are supported.** Types whose bars are drawn by a `custom` series + `renderItem`
function (e.g. Waterfall) are rejected at build time — the sanitizer strips functions, so
the canvas would render empty. Use a declarative type instead (a `Bar Chart` with negative
values reproduces a waterfall's story). Do not hand-write ECharts options.

## Verify

`bunx cookiebite verify report.html` renders the built HTML in a real browser at **390,
768, and 1280px** (plus a dark pass when the theme declares `dark`) and classifies findings
by severity into `verification.json`. `--runs N` (1–10) repeats the whole pass to surface
flaky findings; a hard finding counts as failure even if it's flaky.

**Exit codes:**

- `0` — passed.
- `1` — a hard finding remains: horizontal overflow, clipped/overlapping labels, a
  degenerate or blank chart, an uncaught error, a required-resource failure, insufficient
  contrast, unreachable keyboard interaction, or a missing chart aria/data alternative.
- `2` — a required `manualReview` entry is unrecorded (a release is *incomplete*, not
  passed, until you record it). `--manual-ok` skips this gate.
- `3` — verification could not run: agent-browser missing, the file does not exist,
  the page is not a cookiebite report, or the dark pass failed to initialize.

**Some judgments are deliberately human** and land in `manualReview`: whether a caption
matches what its figure renders, whether status color is paired with a label in
hand-authored graphics, whether two claims duplicate, whether a point should have been a
visual, and whether the conclusion is visible in five seconds. **Look at the actual
pixels** for these — you cannot tell whether a report reads right by reading its source.

**Do not ship the output as a claude.ai Artifact** — the Artifact CSP blocks every external
host, so the CDN ECharts library never loads. Deliver the file, or host it and share the
link.

## Quality checklist

**The build already enforces these — you don't police them by hand:** every color is a
`var(--cb-*)` token; authored text/background/on-accent are unchanged and contrast-safe;
every `Chart` has a non-empty `ariaLabel` and a `data:{columns,rows}` alternative; the
capabilities you use (`chart`, `table`, `glossary`) are declared to match; props are
well-typed. The verifier then enforces the 390/768/1280 passes (and dark when declared)
with no hard findings.

**What still needs your judgment** (look at the rendered page):

- [ ] The conclusion is visible within ~5 seconds — the claim/headline first, not buried
      in prose.
- [ ] Sections read as an **argument**: each takeaway feeds a claim, bridges connect them,
      no section exists just to look complete.
- [ ] Reading vs dashboard chosen for the right reason — a dashboard only when readers must
      scan/slice live dimensions.
- [ ] The right points became visuals; nothing that should be a chart/stat/diagram is left
      as a paragraph.
- [ ] Every caption matches what its figure actually renders; numbers read consistently per
      locale; nothing wraps mid-figure.
- [ ] **Verified** — `verification.json` has no unaddressed hard finding, and every required
      `manualReview` entry is recorded.

## Localization

Match copy to the source language (Korean source → Korean copy). Set `Report`'s `lang` prop
(`lang="ko"` / `lang="en"`), and the theme's `locale` (`{ number, currency }`) for
separators, currency, and `만/억` vs `K/M/B` — a preset sets `locale` for you. The Persimmon
default is Korean/Pretendard/₩; the neutral preset is Latin/Inter/en-US. Any UI words you
type in the TSX you localize by hand.

## Legacy (rebuild only)

The older freeform hand-authored path (`scripts/scaffold.sh`, editing `COOKIEBITE:*` slots,
`scripts/inline.sh`) and the full-runtime compatibility templates (`dashboard`, `review`,
`postmortem`, `explainer`, `comparison` with `assets/cookiebite.css/.js`) still work
**only for rebuilding reports that already use them** — never author a new report this way;
new reports use the TSX pipeline above. When you do rebuild a legacy file, load its detail
**conditionally**: `DESIGN.md` for the freeform token contract, and `references/*.md`
(component markup, `CB.*` helper API, interaction patterns, anti-patterns) for the
full-runtime path. Do not read those for a TSX report.

## References

- `packages/cookiebite/README.md` — the component table and the verify contract.
- `packages/cookiebite/src/components.tsx` / `capability-components.tsx` / `chart.tsx` —
  the signature-index comments and exact prop types.
- `packages/cookiebite/src/themes.ts` — the `ThemeDocument` type and the exported presets.
- `docs/examples-tsx/weekly-revenue.tsx` / `incident-postmortem.tsx` — worked reports that
  exercise most components (charts, matrix, sortable table, findings, glossary, claims).
- `DESIGN.md` — the frozen visual contract the TSX layer consumes (theme seed, `--cb-*`
  token ABI, capability rules, verification). Read it to understand the invariants; you
  don't edit it per report.

**Legacy full-runtime references — load only when rebuilding a legacy report:**
`references/helpers.md`, `components.md`, `snippets.md`, `design-system.md`,
`libraries.md`, `interactions.md`, `craft.md`, `anti-patterns.md`, `motion.md`, and the
monolithic `assets/cookiebite.css` / `assets/cookiebite.js` runtime.
