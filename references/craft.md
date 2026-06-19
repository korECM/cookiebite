# Visual & readability craft

Read this while filling the template with real content. These are the habits that
separate a report that looks **designed** from one that looks AI-generated. The
template bakes them in; keep them as you replace its content. SKILL.md's Quality
checklist re-encodes the must-pass items as checkboxes.

## The habits

- **Lead each number with meaning, not just a figure.** A KPI is a label + the big
  number + a **delta badge** (`▲/▼` with a semantic color vs the previous period) +
  a **sparkline**. The reader should see the value *and* its direction at a glance.
  Only show a delta when you actually have a baseline; never invent one (sentinel over
  fake zero). In `COOKIEBITE.kpis`, **omit** the `delta` key for no badge at all; pass
  `delta: null` to render the `—` sentinel. When *no* KPI has a baseline, omit it on all
  of them — a row of `—` reads as stray underscores, not data.
- **Give every chart a one-line takeaway caption** above or below it that says what
  to *notice* ("금요일, 토요일에 매출이 몰리며 평균을 14% 상회"), not what is plotted. The
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
  - **The spacing scale is px-valued — size icons with `w-16 h-16` / `w-20 h-20` /
    `w-24 h-24` (= 16/20/24px), or `w-14`/`w-18` for tight inline.** Two footguns,
    both producing wrong-sized icons that the source looks innocent for:
    1. **Don't borrow the standard-Tailwind icon idiom** `w-4 h-4` / `w-5 h-5` /
       `w-6 h-6` expecting 16/20/24px — here `w-4` = **4px**, `w-6` = **6px** (a
       near-invisible icon). The scale maps `wN → N px`, not the rem default.
    2. The scale is `theme.extend`, so a **key that isn't defined falls back to
       Tailwind's rem default and explodes** — historically `w-14`/`h-14` rendered at
       **56px** (3.5rem), the classic "giant checkmark" bug. The common px keys (incl.
       14, 18) are now filled in `cookiebite.js`, but stay on the documented sizes
       above rather than guessing a key. **The visual self-check catches oversized
       icons — look for them.**
- **Use a real table library for data tables.** Anything beyond a tiny 2–3 row table
  should be a **Grid.js** table (sortable, searchable) rather than a hand-rolled
  `<table>` with custom sort code — it's less code, fewer bugs, and consistent.
  `COOKIEBITE.table` themes it and fixes the footguns; for a hand-rolled one see
  `references/interactions.md` §4. **Paginate only when the data overflows the screen**
  — Grid.js draws the pager even for one page, so a table that fits ends up with a
  useless "1–7 / 7" strip; turn pagination off (>~15 rows before it earns a pager).
  Reserve hand-written `<table>` for short, static tables. **Pass raw numbers, not
  formatted strings, for sortable numeric columns** — Grid.js sorts `'72,000'`
  lexically (ranking `'9,402'` after it); feed it raw `Number`s and format for display
  with a per-column `formatter` (`CB.money`/`CB.nf`). (`COOKIEBITE.table` does this for
  you via `numericCols`.)
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

## Number & locale formatting

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
  small unit suffix) — `COOKIEBITE.kpis` already applies `whitespace-nowrap` to the
  number+prefix+suffix and to the delta badge.

## Accessibility (not optional, and it makes reports better for everyone)

- **Never communicate status by color alone** — a core design-system principle and an
  a11y baseline (colorblind readers, grayscale printouts). Pair every colored status with
  an icon or a text label: a green dot becomes `✓ 정상`, a red cell becomes a tag
  reading `위험`. The semantic color reinforces; it doesn't carry the meaning alone.
- **Give every chart a data-table alternative.** A canvas/SVG chart is invisible to
  screen readers and hides exact numbers. `COOKIEBITE.chart` adds a "표로 보기" toggle
  automatically; for a hand-written chart call
  `COOKIEBITE.dataTableToggle(chartSelector, { columns, rows, ariaLabel })` (or the
  `references/interactions.md` §10 pattern), and put an `aria-label` on the chart
  container. This helps sighted readers too — they can read precise figures when the
  chart only shows shape.
- **Keep contrast and targets sane**: the theme's text grays on white already pass;
  don't put `text-secondary` on a colored fill. Interactive controls should be real `<button>`s.

## Copy must match the visual

State only what the chart actually renders. If the caption says "버블 크기는 볼륨을
나타냅니다", the chart had better encode volume as bubble size — a bar chart with that
caption is a bug. After building, re-read each caption/label against its chart and fix
mismatches. The visual self-check is where you catch these.
