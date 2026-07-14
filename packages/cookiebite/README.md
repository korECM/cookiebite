# cookiebite

타입드 TSX로 쓰고 단일 HTML로 빌드하는 cookiebite 리포트 도구.

## 퀵스타트

```bash
bunx cookiebite new report.tsx    # 타입드 스타터 생성
bunx cookiebite build report.tsx  # typecheck, 토큰 lint 후 report.html 생성
bunx cookiebite verify report.html --runs 3
```

- 색은 `var(--cb-*)` 토큰만 허용한다. hex, rgb, 색 이름 리터럴은 빌드가 실패한다.
- raw JSX에서는 시맨틱 Tailwind 색 유틸만 허용한다 (`bg-card`, `text-muted-foreground`,
  `border-border`, `bg-primary`, `text-primary-foreground`). `bg-red-500`, `bg-[#hex]`는
  CSS가 산출되지 않는다.
- default export는 `<Report theme={...} title="...">` 엘리먼트여야 한다.
- 테마는 `cookiebite/themes`의 프리셋(persimmon, neutral, stripe 등)을 쓰거나
  같은 스키마의 객체를 직접 만든다. `dark`를 생략하면 빌드가 자동 파생한다.
- `<Report>`는 다크/밀도 토글을 기본으로 띄운다 (`controls` 기본 true). 끄려면
  `controls={false}`.
- data, semanticTypes, encodings, columns의 key는 영어 식별자, 한글은 라벨과 본문에만.
- 산출물은 기존 cookiebite 검증기(390, 768, 1280px + 항상 다크 패스)로 검증할 수 있다.

## 컴포넌트

| 컴포넌트 | 용도 | 비고 |
| --- | --- | --- |
| Report, Standfirst, Section, Sources | 문서 쉘 | Report가 theme, title, lang, controls를 받는다. controls 기본 true(다크/밀도 토글), false면 생략. Section은 옵셔널 `id`로 앵커를 고정한다 |
| KpiRow | KPI 카드 줄 | delta는 방향 기호 + 텍스트 |
| Claims | 주장, 증거 앵커 목록 | evidence는 `#section-id` (Section `id`와 짝) |
| Findings | 심각도 발견 목록 | 색 단독 금지 — 텍스트 배지 |
| Matrix | rows×cols 히트 테이블 | max 명시로 상수 열 함정 회피 |
| RangeDot | min-max-value 도트 figure | 손 SVG, 차트 의존성 없음 |
| Table | 정렬 표 | sortable이면 table capability 자동 선언 |
| Glossary | 용어 정의 | 키보드 접근, Escape 닫기 (glossary capability) |
| Chart | flint semantic spec 차트 | 빌드 시점 ECharts 컴파일, 라이트/다크 2회, ariaLabel 필수 |

## 검증

빌드된 HTML은 `cookiebite verify`로 브라우저에서 자동 검사할 수 있다. 이 명령을 쓰려면 agent-browser가 먼저 설치되어 있어야 한다 (`npm i -g agent-browser && agent-browser install`).

검증기는 390px, 768px, 1280px 세 브레이크포인트에서 각각 fresh render로 레이아웃과 접근성을 측정한다. 모든 리포트는 `resolveTheme`으로 다크 토큰을 갖으므로 라이트 패스 뒤 **항상 다크 패스**를 한 번 더 돈다.

종료 코드는 다음 규약을 따른다. 0은 통과이고 1은 hard finding이 남았을 때다. 2는 required manualReview 항목이 아직 기록되지 않았을 때이며 `--manual-ok`로 해당 게이트를 건너뛸 수 있다. 3은 검증을 실행하지 못했을 때다 — agent-browser 부재, 파일 없음, cookiebite 리포트가 아닌 페이지, 다크 패스 초기화 실패가 여기에 해당한다.

`--runs N`(1부터 10까지)은 전체 검증 패스를 N번 반복해 flaky를 잡는다. 어떤 finding이 일부 런에서만 나타나면 verification.json의 flaky 목록에 표시되지만 hard finding은 flaky로 분류되어도 실패로 처리된다.

차트가 포함된 리포트에서는 `.cb-chart` 블록마다 canvas가 실제로 그려졌는지를 개별적으로 확인한다.
