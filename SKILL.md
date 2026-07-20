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

## 리포트 스파인

같은 데이터를 넣어도 **뼈대(spine)** 가 다르면 읽는 속도가 달라진다. 아래 다섯은
자주 쓰는 골격이다. 예시는 `docs/examples-tsx/`에 있다.

1. **주간 상태** — Standfirst에 결론을 먼저 두고, `KpiRow` 스트립 → 추이 `Panel`(차트) →
   `Claims` → "다음 주" 한 절로 닫는다. 상태 공유용 article.
   예: `weekly-revenue.tsx`
2. **인시던트 / 포스트모템** — `layout="paged"`. 요약 / 타임라인 / 원인 / 후속 조치처럼
   이름 있는 페이지로 점프하게 한다. 시간 축이 핵심일 때.
   예: `incident-postmortem.tsx`
3. **딥다이브 분석** — `numbered` article. 요약 → `Columns`로 차트 밀도 → 상세
   `DataTable` → 권고. 조사·분석 리포트 장르.
   예: `abuse-analysis.tsx`
4. **의사결정 메모** — 배경 산문 → 선택지 `Matrix` → 리스크 `Findings` → 권고
   `Claims`. 회의 전에 결정을 좁힐 때.
   예: `quarterly-strategy.tsx`
5. **컴포넌트 카탈로그 / 갤러리** — 스토리보다 표면 샘플이 목적. 차트 형태·레지스트리
   블록을 늘어놓는다.
   예: `chart-gallery.tsx`, `registry-remix/`

**스파인 수는 내용이 정한다 — 섹션을 채우려 내용을 늘리지 말고, 내용이 없으면 섹션을
버린다.**

## Authoring surface (shadcn + cookiebite)

### 컴포넌트 선택 루틴

순서를 지키면 이미 테마·lint·verify와 맞춰 둔 경로를 타고, 손으로 짠 UI가 빌드를 깨는
일을 줄인다. 컴포넌트를 고를 때마다 아래 순서로 본다. 손으로 새 UI를 짜는 것은 마지막
수단이다.

1. **내장에서 먼저 찾는다** — 셸/데이터 컴포넌트와 `@/components/ui/*` 18종
   (accordion, alert, badge, breadcrumb, button, card, chart, collapsible, hover-card,
   progress, scroll-area, separator, skeleton, table, tabs, toggle, toggle-group,
   tooltip)은 토큰과 게이트가 이미 통과돼 있다. 있으면 그대로 쓴다.
2. **없으면 레지스트리를 검색한다** — `cookiebite new`가 `components.json`을 스캐폴드해
   두었으니, 손으로 그리기 전에 받을 수 있다:

   ```bash
   npx shadcn@latest search pagination     # 레지스트리 검색
   npx shadcn@latest view pagination       # import, 의존성 확인
   npx shadcn@latest add pagination        # 받기 (@/ 경로로 자동 인식)
   ```

3. **받은 파일의 색 리터럴은 시맨틱 토큰으로 치환한다** — hex, `rgb()`, `hsl()`,
   `oklch()`는 빌드 lint가 거부한다. `var(--chart-1)`, `bg-card`,
   `text-muted-foreground` 등으로 바꾼다. 리터럴을 남기면 테마 스왑과 대비 게이트가
   의미 없어진다.
4. **추가 npm 의존성**은 리포트 디렉토리에서 `pnpm add`한다 — 빌드가 로컬
   `node_modules`를 해석한다.
5. **마지막에 `cookiebite build` + `cookiebite verify`를 돌린다** — hard finding이
   없어야 한다(hard=0). 픽셀 판단은 verify와 육안에 맡긴다.

**부스터(선택):** `.mcp.json`(공식 shadcn MCP)은 `cookiebite new`가 스캐폴드한다.
`npx skills add shadcn/ui`를 더하면 `components.json`을 읽어 레지스트리 작업을 돕는다.

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

**Escape hatch — local shadowing:** any `@/<path>` resolves to a file under the report
directory first (`components/…`, `lib/…`, `data/…`, …), then falls back to built-in
`@/components/ui/*` → package `src/ui/*` and `@/lib/*` → `src/lib/*`. Place
`components/ui/<name>.tsx` next to the report to override a vendored primitive, or add
custom blocks under `components/blocks/` and import them as `@/components/blocks/…`.

### 내장에 없는 컴포넌트가 필요할 때

기본 경로는 위 **컴포넌트 선택 루틴**이다. 내장에 없으면 손으로 짜기 전에 레지스트리를
검색해 받는다(`npx shadcn@latest search → view → add`). 두 가지 보조 경로가 있다:

1. **Local shadowing** — `@/`는 리포트 디렉토리 우선. 받은 파일이나 직접 만든 블록을
   리포트 옆에 두면(`components/ui/<name>.tsx`, `components/blocks/…`) 그대로 import된다.
2. **상용 레지스트리** — `npx shadcn@latest add @registry/block-name`. shadcnblocks 등
   상용 레지스트리 라이선스는 사용자 책임이다.

상용 레지스트리 블록도 색 리터럴은 lint가 거부하니 시맨틱 토큰으로 손질한다(루틴 3단계).

JSX 산문은 하드랩하지 않는다 — 한 문단을 한 줄로 쓰고 soft wrap에 맡긴다. JSX가 줄바꿈을 공백으로 합치므로 한국어 문장을 중간에서 꺾으면 렌더 결과에 의도치 않은 공백이 생긴다.

한국어 조사가 라틴 문자나 닫는 괄호 뒤에서 줄 머리로 떨어지는 문제는 워드 조이너(U+2060)로 막는다. `Section`(title, lede), `Page`(title), `Sources`(label, note), `Glossary`(term, def), `Panel`(title, description), `KpiRow`(label, compare, caption), `Claims`(text, evidence), `Findings`(title, detail), `BarList`(name), `Matrix`(행 라벨, 문자열 셀), `CategoryBar`(세그먼트 라벨)의 문자열 prop은 자동으로 처리된다. 자유 산문에서 조사가 줄 머리로 떨어지면 `koGlue`로 감싼다(`import { koGlue } from 'cookiebite'`).

### Shell (`cookiebite`)

| Component | Props | Role |
| --- | --- | --- |
| `Report` | `{ title, kicker?, layout?: 'article'\|'paged', width?: 'default'\|'full', controls?: boolean, toc?: boolean, numbered?: boolean, children?, className? }` | Document shell. `layout` default `article`. `width` default `default` (fluid `max-w-[1800px]`); `width="full"` drops the max-width cap (edge-to-edge `w-full` + horizontal padding only). `controls` default `true` (dark + density toggles); `controls={false}` hides them. `toc` (article only) default `true` — right-rail scrollspy ("목차") from direct `Section` children at `min-width: 1400px`. `numbered` (article only) default `false` — prefixes Section headings + TOC with `01`, `02`, … (number replaces the accent tick). |
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

**지원 차트** (verify `chart-empty` gate 통과 확인됨 — `docs/examples-tsx/chart-gallery.tsx`):

- Area — gradient, stacked
- Bar — grouped, stacked, horizontal (`layout="vertical"`), negative (Cell 양/음)
- Line — multi-series, step + dots
- Pie — donut + `ChartLegend`, labels + `labelLine`
- Radar — 2-series (`PolarGrid`, `PolarAngleAxis`)
- Radial — `RadialBarChart` + `RadialBar` background
- Composed — `ComposedChart` bar + line (shadcn 문서엔 없지만 Recharts 지원)

## 피해야 할 것 (이름 붙은 안티패턴)

이름이 있으면 리뷰에서 짚기 쉽다. **빌드가 이미 잡는 것**과 **저작자 판단**을 구분한다.

| 안티패턴 | 왜 | 누가 잡나 |
| --- | --- | --- |
| 균일한 라운드+그림자 남발 | 모든 면이 같은 깊이면 계층이 사라진다 | 판단 (`surface`·토큰으로 절제) |
| 모든 것 센터 정렬 | 표·KPI·산문이 한가운데면 스캔이 느려진다 | 판단 |
| 제목 밑 장식 액센트 라인 | `Section` 액센트 틱 위에 또 그으면 장식이 된다 | 판단 |
| 채우기용 컬러 바/아이콘 | 의미 없는 색·아이콘은 노이즈다 | 판단 (색 리터럴은 lint) |
| 한 화면에 같은 차트 타입 3개 이상 | 비교가 아니라 반복으로 읽힌다 | 판단 |
| 뻔한 파랑-보라 그라디언트 | 기본 AI 룩으로 보이고 브랜드가 지워진다 | 리터럴은 lint; 토큰 그라데이션은 판단 |
| KPI 6개 초과 한 줄 욱여넣기 | 셀이 쪼그라들어 결론이 안 보인다 | 판단 (crowding은 verify 보조) |
| 표로 충분한 것을 차트로 만들기 | 정확한 수치 비교는 표가 더 빠르다 | 판단 |
| placeholder 문구 잔존 | `lorem`·`TODO`·`샘플 데이터` 등이 남으면 미완성으로 보인다 | **빌드 WARNING** (content-gate) |

시크릿 문자열(AWS 키, GitHub PAT, `sk-…`, JWT, private key 헤더)은 **빌드 FAIL**.

## 숫자 포맷

통화·퍼센트·큰 수는 한 리포트 안에서 규칙을 통일한다. 관례 예:

- 정수 천 단위: `1,234` (`n.toLocaleString('en-US')`)
- 축약 통화: `$1.4M` / `₩12억` 등 문맥에 맞게 한 형식만
- 퍼센트: `62.4%` (소수 자릿수 고정)
- 포인트 차: `3.1pp`

**로케일은 고정한다.** 기본 `toLocaleString()`은 Node SSR과 브라우저가 달라
하이드레이션이 깨질 수 있다. 예제처럼 `toLocaleString('en-US')`(또는 테마
`locale`에 맞춘 고정 태그)를 쓴다.

표의 숫자 컬럼은 **우측 정렬 + `tabular-nums`**. `ColumnDef.meta.className`으로 이미
지원한다:

```tsx
const numericMeta = { className: 'text-right tabular-nums' } as const;
// columns: [{ accessorKey: 'mrr', meta: numericMeta, … }]
```

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

**Article** — title / kicker / standfirst / optional controls; fluid `max-w-[1800px]`
shell (`width="full"` for uncapped edge-to-edge); right TOC rail (scrollspy,
`min-[1400px]`) from `Section` ids; prose keeps
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
7. **assemble** — single offline HTML. Pretendard-ish first family embeds a subsetted
   Pretendard Variable woff2 as a `data:font/woff2` URI (~1.7MB binary → multi-MB HTML);
   a custom seed whose first family is not Pretendard skips embedding.
8. **content gate** — assembled HTML 본문에서 placeholder 잔재는 stderr WARNING,
   시크릿 유사 문자열은 빌드 FAIL. SSR 마크업의 `<tr`가 300을 넘으면 사전 집계
   (pre-aggregation) 권고 WARNING(비치명).

`cookiebite verify` then catches runtime issues the compiler cannot see: hydration
timeout / failed / warning, `console-error`, `chart-empty` (no SVG shapes after hydrate),
horizontal overflow, clipped text, contrast, keyboard reachability, resource failures.
`--runs N` (1–10) repeats the pass for flaky findings. Exit `0` pass, `1` hard finding,
`2` incomplete manual review (`--manual-ok` skips), `3` could not run.

**빌드가 시크릿을 거부하고 placeholder 잔재와 300행 초과 표를 경고한다.** 색 리터럴·
대비·타입은 그 앞 단계에서 이미 막는다.

**Do not ship as a claude.ai Artifact** — CSP blocks inlined behavior unpredictably.
Deliver the file or host it.

## Quality checklist

**Already enforced:** typed props; no raw colors outside theme; contrast-safe theme;
hydrated charts have SVG shapes (verify); English keys in data structures; secrets
rejected at build; placeholder residue and dense tables (`<tr>` > 300) warned.

**Still your judgment** (look at the rendered page):

- [ ] Conclusion visible in ~5 seconds.
- [ ] Sections/pages read as an argument, not padding.
- [ ] Article vs paged (and which spine) chosen for the right reason.
- [ ] Right points became visuals; captions match figures.
- [ ] Named anti-patterns above avoided where the build cannot see them.
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
- `docs/examples-tsx/chart-gallery.tsx` — every supported chart shape (verify testbed).
- `docs/examples-tsx/registry-remix/` — 실제 레지스트리에서 받은 블록 데모(`npx shadcn add`).

**Legacy full-runtime references — load only when rebuilding a legacy report:**
`references/helpers.md`, `components.md`, `snippets.md`, `design-system.md`,
`libraries.md`, `interactions.md`, `craft.md`, `anti-patterns.md`, `motion.md`, and the
monolithic `assets/cookiebite.css` / `assets/cookiebite.js` runtime.
