# cookiebite

타입드 TSX로 쓰고 단일 HTML로 빌드하는 cookiebite 리포트 도구.

## 퀵스타트

```bash
bunx cookiebite new report.tsx    # 타입드 스타터 생성
bunx cookiebite build report.tsx  # typecheck, 토큰 lint 후 report.html 생성
```

- 색은 `var(--cb-*)` 토큰만 허용한다. hex, rgb, 색 이름 리터럴은 빌드가 실패한다.
- default export는 `<Report theme={...} title="...">` 엘리먼트여야 한다.
- 테마는 `cookiebite/themes`의 프리셋(persimmon, neutral, stripe 등)을 쓰거나
  같은 스키마의 객체를 직접 만든다. `dark`를 선언하면 다크 토큰이 함께 실린다.
- 산출물은 기존 cookiebite 검증기(390, 768, 1280px)로 그대로 검증할 수 있다.

## 컴포넌트

| 컴포넌트 | 용도 | 비고 |
| --- | --- | --- |
| Report, Standfirst, Section, Sources | 문서 쉘 | Report가 theme, title, lang을 받는다 |
| KpiRow | KPI 카드 줄 | delta는 방향 기호 + 텍스트 |
| Claims | 주장, 증거 앵커 목록 | evidence는 '#section-id' |
| Findings | 심각도 발견 목록 | 색 단독 금지 — 텍스트 배지 |
| Matrix | rows×cols 히트 테이블 | max 명시로 상수 열 함정 회피 |
| RangeDot | min-max-value 도트 figure | 손 SVG, 차트 의존성 없음 |
| Table | 정렬 표 | sortable이면 table capability 자동 선언 |
| Glossary | 용어 정의 | 키보드 접근, Escape 닫기 (glossary capability) |

Chart(flint 기반)는 Phase ③에서 온다.
