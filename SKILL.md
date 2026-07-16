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

**You write a typed TSX report; `cookiebite build` renders it to one offline HTML.** You
own the argument's order, the prose, and the choice of components. Cookiebite owns the
shell (layout, controls, theme tokens), vendored shadcn UI at `@/components/ui/*`, and
build gates that refuse raw colors, contrast failures, and broken hydration. That refusal
is the point: the build carries the fussy invariants so you spend your attention on the
story.

**The default is a quiet reading document** (`layout="article"`). Use `layout="paged"`
when the report is a short stack of named pages with left-rail navigation — not because
"dashboard" sounds impressive.

This skill is for **reading material** (reports, summaries, dashboards, recaps, research
write-ups). It is **not** for building product/console application UI.

## Quickstart

```bash
bunx cookiebite new report.tsx           # typed starter report
bunx cookiebite build report.tsx         # typecheck + lint → SSG → HTML
bunx cookiebite verify report.html --runs 3
```

1. **Plan the claims and evidence first** — decide *article vs paged*, and which points
   want a chart, a KPI, a table, or prose. This happens before you touch the file.
2. **`bunx cookiebite new report.tsx`** scaffolds a starter: `Report` + `KpiRow` + shadcn
   `Card`/`ChartContainer` + `DataTable`. Fill it with the real narrative.
   - Import shell/data components from `cookiebite`, presets from `cookiebite/themes`.
   - Import UI from `@/components/ui/*` — **paths match shadcn docs verbatim**; training
     knowledge applies as-is (Card, Badge, Alert, Tabs, Accordion, Table, Chart, …).
   - **Default export must be a React component function**
     (`export default function App() { return <Report …>…</Report>; }`).
   - **Theme for the build** is `export const __theme = …` (the pipeline reads `__theme`).
3. **`bunx cookiebite build report.tsx`** runs typecheck → source lint → SSG render →
   theme compile (contrast gates) → Tailwind source-scan → client hydration bundle → one
   HTML. Failures print file/line messages.
4. **`bunx cookiebite verify report.html --runs 3`** renders at 390 / 768 / 1280 (plus
   dark) and reports findings. Needs `agent-browser`
   (`npm i -g agent-browser && agent-browser install`).
5. **Look at the actual pixels** for judgments the build can't make (see Verify) and hand
   back the HTML.

## Plan claims + evidence first

Start with **one to three claims, their evidence, and the reader's first question.** Order
sections as an **argument, not an inventory**. Anti-padding: a section added only to look
complete dilutes trust — cut it.

**Article vs paged.** Most investigations and explainers are `article`: `Standfirst`,
`Section`s, charts/tables where evidence is visual, `Sources` at the end. Choose `paged`
when readers jump between named pages (e.g. summary / timeline / cause / actions) and you
want hash-synced sidebar nav. A fixed three-number status is still an article with
`KpiRow`, not a dashboard.

**Graphic over textual.** When a point can be a chart, a KPI, a matrix, or a comparison
instead of a paragraph, make it visual. Prefer shadcn `ChartContainer` + Recharts for
series; use `Matrix` / `RangeDot` / `DataTable` for structured comparisons.

**English data keys.** Object keys in chart data, `ChartConfig`, `ColumnDef` `accessorKey`,
and similar identifiers stay English. Korean (or any locale) belongs in labels, headers,
captions, and narrative only.

## Authoring surface (shadcn + cookiebite)

### Vendored shadcn (`@/components/ui/*`)

Eighteen components ship in the package (accordion, alert, badge, breadcrumb, button,
card, chart, collapsible, hover-card, progress, scroll-area, separator, skeleton, table,
tabs, toggle, toggle-group, tooltip). Import exactly as in the [shadcn docs](https://ui.shadcn.com):

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
```

Use semantic Tailwind utilities (`bg-card`, `text-muted-foreground`, `border-border`,
`bg-primary`, `text-success`, …). Palette steps (`bg-red-500`) and arbitrary colors
(`bg-[#hex]`, inline hex/rgb) fail the build.

**Escape hatch — local shadowing:** place `components/ui/<name>.tsx` (or `lib/<name>.ts`)
next to the report file. The bundler resolves `@/components/ui/<name>` to the local file
first, then the package. Use this to tweak a single UI primitive without forking the
package.

### Shell (`cookiebite`)

| Component | Props | Role |
| --- | --- | --- |
| `Report` | `{ title, kicker?, layout?: 'article'\|'paged', controls?: boolean, toc?: boolean, numbered?: boolean, children?, className? }` | Document shell. `layout` default `article`. `controls` default `true` (dark + density toggles); `controls={false}` hides them. `toc` (article only) default `true` — right-rail scrollspy ("목차") from direct `Section` children at `min-width: 1400px`. `numbered` (article only) default `false` — prefixes Section headings + TOC with `01`, `02`, … (number replaces the accent tick). Fluid container `max-w-[1400px]`. |
| `Standfirst` | `{ children, className? }` | Lead paragraph under the title. |
| `Section` | `{ id, title, lede?, children?, className? }` | `section` + accent-tick `h2`. `id` is required (TOC / anchors). When parent `Report` has `numbered`, the tick becomes a tabular `01`/`02`… index. |
| `Columns` | `{ n?: 2\|3, children?, className? }` | Side-by-side Panel grid. Default `n={2}` → `md:grid-cols-2`; `n={3}` → `md:grid-cols-3`. Below `md` always 1 column. |
| `Page` | `{ id, title, icon?, children?, className? }` | One page under `layout="paged"`. SSR stacks all pages; after hydration inactive pages are `hidden` (restored in print). Under `article`, still renders as a section (tolerant). |
| `Sources` | `{ items: { label, href?, note? }[], className? }` | Source / method list. |
| `Glossary` | `{ terms: { term, def }[], className? }` | Definition list. |
| `Prose` | `{ children, className? }` | Measure-limited prose wrapper. |

`PageNav` / `Controls` are used by the shell internally; you rarely import them.

**Fragment limit:** `Report` collects `Section` / `Page` / `Standfirst` from **direct
children only**. Do not wrap them in `<>…</>` if you need TOC or paged nav.

### Data components (`cookiebite`)

| Component | Props | Role |
| --- | --- | --- |
| `KpiRow` | `{ items, className? }` — item `{ label, value, unit?, delta?, compare?, spark?, caption? }`; delta `{ value, direction: 'up'\|'down', good? }` | Joined KPI strip (one card, inner cell dividers). `good` defaults to `direction === 'up'`. Tinted delta pills (`text-success` / `text-destructive`), never color alone. `compare` sits beside the delta; `spark` is a mini sparkline backdrop (`number[]`). |
| `Panel` | `{ title, description?, actions?, children?, className? }` | Data-unit card frame for charts/tables/lists. Section = narrative unit; Panel = data unit. |
| `Claims` | `{ items, className? }` — item `{ text, evidence?, badge? }` | Claim list with optional evidence line and outline badge. |
| `Findings` | `{ items, className? }` — item `{ severity: 'critical'\|'warning'\|'info', title, detail? }` | Severity alerts (shadcn `Alert`). |
| `Matrix` | `{ rows, cols, caption?, className? }` — row `{ label, cells: (boolean\|string)[] }` | Coverage / comparison table (check / dash / string). |
| `RangeDot` | `{ items, domain?, className? }` — item `{ label, min, max, value, unit? }` | min–max range with value dot. |
| `BarList` | `{ items, sort?, className? }` — item `{ name, value, unit? }`; sort `'desc'\|'none'` (default `desc`) | Horizontal ranked bar list; bar width scales to the max value. |
| `Tracker` | `{ data, className? }` — block `{ status: 'success'\|'error'\|'warning'\|'neutral', label? }` | Status block strip; `label` becomes the block `title` tooltip. |
| `CategoryBar` | `{ segments, className? }` — segment `{ label, value }` | Stacked composition bar with legend; segment width is proportional to value. |
| `DataTable` | `{ columns: ColumnDef<T>[], data: T[], className? }` | TanStack Table. Use `DataTableColumnHeader` in `header` for sortable columns. Grouped headers (nested `columns` under a group `header`) and column `footer` totals are supported. |

### Charts (shadcn chart idiom)

There is **no** cookiebite `Chart` / flint / ECharts authoring path on the v3 surface.
Compose Recharts inside `ChartContainer`:

```tsx
const chartConfig = {
  count: { label: '건수', color: 'var(--chart-1)' },
} satisfies ChartConfig;

<ChartContainer id="bars" config={chartConfig} className="min-h-[220px] w-full">
  <BarChart accessibilityLayer data={chartData}>
    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
  </BarChart>
</ChartContainer>
```

- Config `color` must be `var(--chart-1)` … `var(--chart-5)` (or theme tokens).
- Series `fill` / `stroke` use `var(--color-KEY)` matching the config key.
- **Color literals in chart config or marks fail the build lint.**
- Give `ChartContainer` a stable `id` when multiple charts appear on one page.

## Theme

Pass a `ThemeDocument` via `export const __theme`. Presets from `cookiebite/themes`:
`persimmon` (default Korean), `neutral`, `stripe`, `vercel`, `linear`, `notion`,
`supabase`, `sentry`, `resend`, `raycast`.

```tsx
import { stripe } from 'cookiebite/themes';
export const __theme = stripe;
```

Seed (eight keys) is the complete shared visual input:

| Key | Meaning | Valid values |
| --- | --- | --- |
| `font` | reading type family | CSS family list |
| `background` | page / card strategy input | opaque six-digit hex |
| `text` | body text | opaque six-digit hex |
| `accent` | primary emphasis | opaque six-digit hex |
| `spaceUnit` | base spacing unit | integer `2..12` |
| `measure` | prose line length | e.g. `'68ch'` |
| `radius` | soft edge | integer `0..32` |
| `surface` | surface strategy | `border`, `tonal`, or `shadow` |

`schemaVersion: 1` is required when you hand-author a document. Optional `dark` is a
partial seed (omitted keys inherit). **If `dark` is omitted, the build auto-derives it.**

**Overrides** patch compiled shadcn CSS variables after seed derivation:

```tsx
export const __theme = {
  ...stripe,
  overrides: {
    '--card': '#FFFFFF',
    '--chart-1': '#635BFF',
    '.dark': {
      '--card': '#1A1A1E',
    },
  },
};
```

Root keys apply to `:root` only; nest a `.dark` object for dark patches. After overrides,
contrast gates re-run (including `--success` on `--card`). If you override `--card` but
not `--success`, success is re-derived.

Gates (fail the build on violation): foreground/background, primary-foreground/primary,
card-foreground/card ≥ 4.5:1; muted-foreground/muted and success/card ≥ 3:1.

Authored colors live only in `__theme` object literals — source lint skips those
spans. Everywhere else, use tokens / semantic classes.

## Layouts + controls

**Article** — title / kicker / standfirst / optional controls; fluid `max-w-[1400px]`
shell; right TOC rail (scrollspy, `min-[1400px]`) from `Section` ids; prose keeps
`max-w-prose`, data blocks span the content column.

**Paged** — same fluid header width; mobile page select + desktop left-rail nav; hash sync
(`#page-id`); no-JS / pre-hydration shows all pages stacked. Active `Page` heading uses
the same accent-tick treatment as `Section`.

Controls (dark mode + density) default on. Hide with `controls={false}`.

Visual language: Stripe-editorial / Tremor panel grammar — accent-tick eyebrows, tinted
page background with white cards, joined KPI strip, Panel frames for data units, colored
text deltas.

## Build pipeline + gates

Order inside `cookiebite build`:

1. **typecheck** — TS / prop errors fail first.
2. **source lint** — bans hex, `rgb()` / `oklch()`, named colors in authored TSX (theme
   seed/overrides exempt).
3. **SSG render** — React static markup.
4. **theme compile** — seed → `:root` + `.dark` variables; contrast gates (incl. `--success`).
5. **Tailwind source-scan** — semantic tokens only; palette wiped; preflight on.
6. **client bundle** — React hydration IIFE for interactivity (sort, nav, toggles, charts).
7. **assemble** — single offline HTML.

`cookiebite verify` then catches runtime issues the compiler cannot see: hydration
timeout / failed / warning, `console-error`, `chart-empty` (no SVG shapes after hydrate),
horizontal overflow, clipped text, contrast, keyboard reachability, resource failures.
`--runs N` (1–10) repeats the pass for flaky findings. Exit `0` pass, `1` hard finding,
`2` incomplete manual review (`--manual-ok` skips), `3` could not run.

**Do not ship as a claude.ai Artifact** — CSP blocks inlined behavior unpredictably.
Deliver the file or host it.

## Quality checklist

**Already enforced:** typed props; no raw colors outside theme; contrast-safe theme;
hydrated charts have SVG shapes (verify); English keys in data structures.

**Still your judgment** (look at the rendered page):

- [ ] Conclusion visible in ~5 seconds.
- [ ] Sections/pages read as an argument, not padding.
- [ ] Article vs paged chosen for the right reason.
- [ ] Right points became visuals; captions match figures.
- [ ] `verification.json` has no unaddressed hard finding; required `manualReview`
      entries recorded.

## Localization

Match copy to the source language. Presets set `locale` (`number` / `currency`) for you
(Persimmon → Korean/Pretendard/₩; neutral → Latin/Inter/en-US). UI words you type in TSX
you localize by hand. Data keys stay English.

## Legacy (rebuild only)

The older freeform hand-authored path (`scripts/scaffold.sh`, editing `COOKIEBITE:*`
slots, `scripts/inline.sh`) and the full-runtime compatibility templates (`dashboard`,
`review`, `postmortem`, `explainer`, `comparison` with `assets/cookiebite.css/.js`) still
work **only for rebuilding reports that already use them** — never author a new report
this way; new reports use the TSX pipeline above. When you do rebuild a legacy file, load
its detail **conditionally**: `DESIGN.md` for the freeform token contract, and
`references/*.md` for the full-runtime path. Do not read those for a TSX report.

## References

- `packages/cookiebite/README.md` — npm-oriented surface summary.
- `packages/cookiebite/src/index.ts` — public exports.
- `packages/cookiebite/src/themes.ts` — presets; `lib/theme-compile.mjs` — overrides + gates.
- `packages/cookiebite/templates/starter.tsx` — minimal article starter.
- `docs/examples-tsx/weekly-revenue.tsx` — article + charts + DataTable.
- `docs/examples-tsx/incident-postmortem.tsx` — paged layout demo.
- `docs/examples-tsx/quarterly-strategy.tsx` — prose-first article (strategy memo).
- `docs/examples-tsx/abuse-analysis.tsx` — numbered analysis-report genre (`Columns` + donut/bar density).

**Legacy full-runtime references — load only when rebuilding a legacy report:**
`references/helpers.md`, `components.md`, `snippets.md`, `design-system.md`,
`libraries.md`, `interactions.md`, `craft.md`, `anti-patterns.md`, `motion.md`, and the
monolithic `assets/cookiebite.css` / `assets/cookiebite.js` runtime.
