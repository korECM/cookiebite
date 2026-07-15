# cookiebite

타입드 TSX로 쓰고 단일 오프라인 HTML로 빌드하는 리포트 도구.

저작 표면은 **shadcn UI**(`@/components/ui/*`, 문서와 동일한 import 경로) + cookiebite
shell/data 컴포넌트입니다. 차트는 shadcn Chart + Recharts, 표는 TanStack `ColumnDef`입니다.

## 퀵스타트

```bash
bunx cookiebite new report.tsx    # 타입드 스타터 생성
bunx cookiebite build report.tsx  # typecheck → lint → SSG → HTML
bunx cookiebite verify report.html --runs 3
```

- default export는 **React 컴포넌트 함수**여야 합니다
  (`export default function App() { return <Report …/> }`).
- 빌드가 읽는 테마는 `export const __theme = …`입니다.
- 색 리터럴(hex, rgb, named color)은 소스 lint가 거부합니다. 테마 seed/overrides 객체는
  예외입니다.
- raw JSX에서는 시맨틱 Tailwind만 씁니다 (`bg-card`, `text-muted-foreground`,
  `border-border`, `bg-primary`, `text-success`, …). 팔레트 단계(`bg-red-500`)와
  임의값(`bg-[#…]`)은 CSS가 나오지 않거나 lint에 걸립니다.
- 차트 색은 `var(--chart-N)` / `var(--color-KEY)`만. 리터럴은 빌드 실패.
- data / ChartConfig / `accessorKey`는 영어 식별자, 한글은 라벨과 서사에만.
- 로컬 shadowing: 리포트 옆에 `components/ui/<name>.tsx`를 두면 패키지 UI를 덮어씁니다.

## 기능

- **Shell:** `Report` (article | paged), `Section`, `Page`, `Standfirst`, `Sources`,
  `Glossary`, 다크/밀도 controls(기본 on)
- **Data:** `KpiRow`, `Claims`, `Findings`, `Matrix`, `RangeDot`, `BarList`, `Tracker`,
  `CategoryBar`, `DataTable`
- **UI:** vendored shadcn 18종 (card, chart, table, badge, alert, tabs, accordion, …)
- **Theme:** seed 8키 + CSS 변수 overrides + 프리셋 10종 + 자동 다크 + 대비 게이트
  (`--success` 포함)
- **Pipeline:** typecheck → lint → SSG → theme → Tailwind source-scan → hydration bundle →
  단일 HTML
- **Verify:** hydration / console / chart-empty / overflow / contrast 등 (agent-browser)

## 컴포넌트

| 컴포넌트 | 용도 | 비고 |
| --- | --- | --- |
| `Report` | 문서 쉘 | `title`, `kicker?`, `layout?` (`article`\|`paged`), `controls?` (기본 true), `toc?` (article, 기본 true) |
| `Standfirst` | 리드 문단 | `children` |
| `Section` | 섹션 + accent tick | `id`, `title`, `lede?` 필수 `id` |
| `Page` | paged 한 장 | `id`, `title`, `icon?` — SSR은 전부 스택, hydrate 후 비활성 `hidden` |
| `Sources` | 출처 목록 | `items: { label, href?, note? }[]` |
| `Glossary` | 용어 정의 | `terms: { term, def }[]` |
| `KpiRow` | KPI 카드 줄 | item `{ label, value, unit?, delta?, compare?, spark?, caption? }`; delta `{ value, direction, good? }`. `compare`는 값 아래 비교 문구, `spark`는 미니 스파크라인(`number[]`) |
| `Claims` | 주장 목록 | item `{ text, evidence?, badge? }` |
| `Findings` | 심각도 알림 | item `{ severity: 'critical'\|'warning'\|'info', title, detail? }` |
| `Matrix` | 커버리지 표 | `rows: { label, cells }[]`, `cols: string[]` |
| `RangeDot` | min–max–value | item `{ label, min, max, value, unit? }` |
| `BarList` | 수평 막대 순위 목록 | `items: { name, value, unit? }[]`, `sort?` (`desc` \| `none`, 기본 `desc`) |
| `Tracker` | 상태 블록 스트립 | `data: { status: 'success'\|'error'\|'warning'\|'neutral', label? }[]` |
| `CategoryBar` | 구성비 바 + 범례 | `segments: { label, value }[]` |
| `DataTable` | 정렬 표 | TanStack `columns` + `data`; `DataTableColumnHeader`로 헤더 |

차트는 `@/components/ui/chart`의 `ChartContainer` + Recharts를 직접 조립합니다.

## 테마

```tsx
import { stripe } from 'cookiebite/themes';

export const __theme = {
  ...stripe,
  overrides: {
    '--card': '#FFFFFF',
    '.dark': { '--card': '#1A1A1E' },
  },
};
```

프리셋: `persimmon`, `neutral`, `stripe`, `vercel`, `linear`, `notion`, `supabase`,
`sentry`, `resend`, `raycast`.

seed 8키: `font`, `background`, `text`, `accent`, `spaceUnit`, `measure`, `radius`,
`surface`. `dark`를 생략하면 빌드가 자동 파생합니다. overrides는 `:root` 패치 + 선택적
`.dark` 중첩 객체입니다. 대비 게이트 실패 시 빌드가 중단됩니다.

## 레이아웃 예시

**Article** (기본, TOC scrollspy):

```tsx
<Report title="주간 매출" kicker="Growth, W20">
  <Standfirst>확장과 유지가 성장을 이끈다.</Standfirst>
  <Section id="kpis" title="핵심 지표">
    <KpiRow items={[…]} />
  </Section>
</Report>
```

**Paged** (사이드바 해시 네비):

```tsx
<Report layout="paged" title="인시던트" kicker="SEV-2">
  <Page id="summary" title="요약">…</Page>
  <Page id="timeline" title="타임라인">…</Page>
</Report>
```

controls를 끄려면 `controls={false}`.

## 검증

`cookiebite verify`는 agent-browser가 필요합니다
(`npm i -g agent-browser && agent-browser install`).

390 / 768 / 1280 + 다크 패스. hard finding 예: `hydration-failed`, `hydration-warning`,
`console-error`, `chart-empty`, horizontal overflow, clipped text, contrast.

종료 코드: `0` 통과, `1` hard finding, `2` required manualReview 미기록
(`--manual-ok`로 스킵), `3` 실행 불가. `--runs N`(1–10)으로 flaky를 잡습니다.
