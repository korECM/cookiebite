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

Phase ① 범위: 쉘 컴포넌트 4종(Report, Standfirst, Section, Sources)의 순수
리딩 문서. 차트, 표, capability 컴포넌트는 Phase ② 이후에 온다.
