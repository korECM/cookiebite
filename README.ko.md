<p align="center">
  <img src="docs/banner.png" width="860" alt="cookiebite — 데이터를 읽고 싶은 리포트로">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-111111?style=flat-square" alt="MIT license">
  <img src="https://img.shields.io/badge/themes-10-111111?style=flat-square" alt="10 themes">
  <img src="https://img.shields.io/badge/output-single--file%20HTML-111111?style=flat-square" alt="single-file HTML">
  <img src="https://img.shields.io/badge/build-none-111111?style=flat-square" alt="no build step">
  <img src="https://img.shields.io/badge/skill-Claude%20Code-111111?style=flat-square" alt="Claude Code skill">
</p>

<p align="center">
  <strong>English README: <a href="README.md">README.md</a></strong>
</p>

---

AI가 만든 리포트는 대개 비슷하게 생겼어요. 불릿 목록 한가득, 회색 표 하나, 아무도 안 시킨 무지개색 차트. 모델이 썼다는 거, 2초면 티가 나죠.

cookiebite은 반대로 가요. Claude Code 스킬인데, 데이터를 던지면 (지표든 장애 기록이든 리서치 노트든 주간 정리든) 기본으로 진짜 *읽고* 싶은 HTML 파일 하나를 만들어 줍니다. 저자가 직접 쓴 시맨틱 HTML로 된 조용한 읽기 문서예요. 목차는 필요할 때만 붙고요. 차트, 정렬되는 표, 용어 툴팁, 모션, 내보내기 같은 더 풍부한 동작은 옵트인이라 리포트가 필요하다고 할 때만 딸려 와요. 파일 하나로 끝이고 빌드도 서버도 없어요. 더블클릭하든 메일로 보내든 슬랙에 붙이든.

그리고 넘기기 전에 페이지를 직접 렌더해서 봐요. 라벨 안 겹쳤나, 차트 안 깨졌나. 이게 생각보다 차이가 큽니다.

<p align="center">
  <strong>▶ <a href="https://korECM.github.io/cookiebite/">예시를 라이브로 보기</a></strong> — 브라우저로 열어서 직접 만져보세요.
</p>

## 퀵스타트

타입드 TSX 리포트를 쓰면 `cookiebite build`가 단일 HTML 파일로 렌더해요.
저작 표면은 **shadcn UI**(`@/components/ui/*`, shadcn 문서와 동일한 import 경로) +
cookiebite shell/data 컴포넌트예요. 빌드가 시각 계약(raw 색 금지, 테마 대비 게이트,
hydration)을 강제해서 서사에 집중할 수 있어요.

```bash
bunx cookiebite new report.tsx
bunx cookiebite build report.tsx
bunx cookiebite verify report.html --runs 3
```

`cookiebite`에서 shell/data를, `cookiebite/themes`에서 프리셋을, `@/components/ui/*`에서
UI를 import해요. 빌드용 테마는 `export const __theme = …`, default export는 `<Report>`를
반환하는 React 컴포넌트 함수예요. raw JSX에는 시맨틱 Tailwind만 써요 (`bg-card`,
`text-muted-foreground`, `border-border`, `bg-primary`, `text-success`). 팔레트 단계나
임의 색은 빌드가 막아요. 차트는 shadcn `ChartContainer` + Recharts이고 색은
`var(--chart-N)` / `var(--color-KEY)`만 허용해요. 표는 TanStack `ColumnDef` +
`DataTable`이에요. `<Report>`는 다크/밀도 토글을 기본으로 띄워요 (`controls={false}`로
끔). `layout="paged"`면 해시 연동 페이지 네비가 붙어요. data key는 영어, 한글은 라벨과
서사에만. 자세한 API는 [packages/cookiebite/README.md](packages/cookiebite/README.md)와
[SKILL.md](SKILL.md)를 보세요.

TSX 예시: [weekly-revenue.tsx](docs/examples-tsx/weekly-revenue.tsx) (article),
[incident-postmortem.tsx](docs/examples-tsx/incident-postmortem.tsx) (paged).

## 레거시(기존 리포트 재빌드 전용)

예전 freeform 경로는 **이미 그 방식을 쓰는 리포트를 재빌드할 때만** 동작해요.
새 리포트는 여기서 시작하지 마세요.

```bash
bash scripts/scaffold.sh report.html    # 조용한 읽기 스켈레톤 — core 런타임만
# report.html 편집: 섹션을 쓰고, 필요한 capability를 <!-- COOKIEBITE:USE -->에 선언
bash scripts/inline.sh report.html      # 선언한 의존성만 assemble
```

동작은 `<!-- COOKIEBITE:USE -->` 마커로 옵트인해요. `chart`, `table`, `glossary`,
`motion`, `export`를 적으면 그것만 딸려 와요. 풀 런타임 호환 템플릿은 이렇게요.

```bash
bash scripts/scaffold.sh dashboard report.html   # 또는: review, postmortem, explainer, comparison
```

이 다섯 개는 `assets/cookiebite.css`, `assets/cookiebite.js`로 렌더돼요.
아래 보이는 풍부한 리포트가 그거예요.

## 무엇을 만드나

같은 스킬로 만든 리포트 세 개예요. 데이터는 다르지만 테마는 모두 Persimmon이에요.

| 주간 성장 대시보드 | 장애 회고 | 서킷 브레이커 explainer |
|:---:|:---:|:---:|
| <img src="docs/screenshots/example-metrics.png" alt="Persimmon 테마의 SaaS 성장·매출 대시보드"> | <img src="docs/screenshots/example-postmortem.png" alt="Persimmon 테마의 장애 회고"> | <img src="docs/screenshots/example-flow.png" alt="Persimmon 테마의 서킷 브레이커 패턴 설명"> |
| Persimmon 테마. MRR 워터폴, 가입 퍼널, 코호트 리텐션 히트맵, 목표 게이지, 정렬되는 계정 표. | Persimmon 테마. 영향 요약, 펼쳐지는 타임라인, 줌 가능한 레이턴시 곡선, 번호 매긴 근본 원인 사슬, 액션 표. | Persimmon 테마. Mermaid 상태 다이어그램, 단계별로 상태를 짚어주는 클릭 walkthrough, 용어집. |

셋 다 HTML은 [docs/examples/](docs/examples/)에 있어요. 브라우저로 열어서 차트 줌해보고, walkthrough 눌러보고, 표 정렬하고, 점선 친 용어에 마우스도 올려보세요.

그리고 HTML이니까, 움직임이 도움이 될 땐 리포트가 *움직일* 수도 있어요. 여기선 서킷 브레이커가 Closed → Open → Half-Open 상태를 도는데, 활성 상태가 은은하게 빛나요. 외부 GIF를 박은 게 아니라 네이티브로 만든 거예요.

<p align="center">
  <img src="docs/screenshots/flow.gif" width="720" alt="서킷 브레이커 상태 배지 애니메이션: Closed → Open → Half-Open을 돌며 활성 상태가 빛납니다">
</p>

## 테마 10종, 아니면 직접

리포트 외형은 작은 디자인 토큰 묶음에서 나와요. 액센트 하나, 중립 색 단계, 시맨틱 컬러, 폰트. 토큰만 바꾸면 리포트 전체가 다시 칠해집니다. 기본으로 10종 들어 있고요. 깔끔한 중립 테마 하나에, 실제 디자인 시스템에서 뽑아낸 아홉 개.

| | | | |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/report-neutral.png" alt="Neutral 테마"><br>Neutral | <img src="docs/screenshots/report-stripe.png" alt="Stripe 테마"><br>Stripe | <img src="docs/screenshots/report-supabase.png" alt="Supabase 테마"><br>Supabase | <img src="docs/screenshots/report-persimmon.png" alt="Persimmon 테마"><br>Persimmon |

내 색을 쓰고 싶으면 테마 스튜디오를 열면 돼요. 프리셋 고르고, 액센트 조절하고, 폰트 바꾸면 미리보기가 실시간으로 따라와요. 다 됐으면 CSS 블록이나 JSON 파일로 내보내면 되고요.

<p align="center">
  <img src="docs/screenshots/theme-studio.png" width="760" alt="테마 스튜디오: 왼쪽에 10개 프리셋 갤러리, 오른쪽에 실시간 리포트 미리보기">
</p>

## 리포트에 들어가는 것들

리포트가 동작을 옵트인했거나 풀 런타임 타입을 스캐폴딩했을 때 꺼내 쓰는 것들이에요.

- **글보다 그림.** 차트나 지표 카드, 타임라인, 다이어그램으로 보여줄 수 있는 건 그렇게 보여줘요. 풍부하게 가야 하면 ECharts, 간단하면 되는 건 Chart.js.
- **만져지는 것들.** 필터, 보기 전환, 정렬되는 표, 드릴다운, 펼쳐지는 타임라인. 정적 차트는 질문 하나에만 답하잖아요. 인터랙티브하면 미처 안 던진 질문에도 답해주고요.
- **용어 툴팁.** 전문 용어에 마우스 올리면 쉬운 말로 풀어줘요. 아는 사람은 그냥 지나가고, 모르는 사람은 도움 받고.
- **제대로 읽히는 숫자.** 천 단위 콤마, 통화 단위, 소수 자릿수 고정, 부호 맞는 증감. 자릿수 맞게 정렬되는 숫자까지.
- **접근성은 기본.** 상태를 색깔만으로 표시 안 해요. 아이콘이랑 라벨이 같이 붙죠. 차트마다 "표로 보기" 토글이랑 aria-label도 있고요.

## 어떻게 품질을 지키나

스킬이 리포트를 헤드리스 브라우저에서 렌더하고, 데스크톱이랑 좁은 폭으로 나눠서
스크린샷을 찍어요. **다크 패스는 모든 리포트에서 항상** 돌아요(테마마다 다크 토큰이
실리니까). 그리고 그 조각들을 직접 읽고 점검하죠. 겹친 라벨, 잘린 글자, 무너진 차트,
모바일에서 깨지는 레이아웃. 이런 건 HTML 소스나 문법 검사로는 안 잡혀요. 눈으로 봐야
잡히죠. 그래서 보고, 고치고, 또 봅니다. 스크린샷 도구는
[agent-browser](https://github.com/built-by-as/agent-browser)를 써요.

색은 눈이 아니라 계산으로 잡아요. 리포트가 생성한 팔레트 전부를 내장 검증기가 판정해요. 색약 시뮬레이션(Machado + CIEDE2000) 기반 분리도, 밝기 밴드, 채도 하한, 실제 surface 대비까지요. 판정 결과는 스킬이 원래 읽던 체크 파일에 같이 들어가요. 완성된 리포트는 차트 안티패턴 카탈로그(이중 축, 순서 없는 카테고리에 명암 램프, 점마다 숫자 라벨 같은 것들)와도 대조하고 나서야 내보내요.

## 설치

[skills](https://github.com/vercel-labs/skills) CLI로 설치하면 돼요. 에이전트 스킬 설치하는 표준 방식이에요.

```bash
npx skills add korECM/cookiebite
```

git이 편하면 스킬 디렉터리에 바로 클론해도 되고요.

```bash
git clone https://github.com/korECM/cookiebite ~/.claude/skills/cookiebite
```

설치본에는 스킬 디렉터리 안에 중첩 테마 스킬이 같이 들어가요. 이 스킬이 cookiebite의 asset 디렉터리를 형제 경로로 찾아서, 복사한 설치본에서도 테마가 계속 동작해요.

비주얼 셀프체크랑 테마 스튜디오 스크린샷을 쓰려면 [agent-browser](https://github.com/built-by-as/agent-browser)를 PATH에 두세요. 없어도 리포트는 만들어져요. 다만 결과를 직접 보진 못하고요.

**Claude가 알아서 집어들게 하기.** 스킬이 리포트성 요청에 이미 발동하지만, `CLAUDE.md`에 한 줄 넣어두면 더 확실해요.

```md
HTML 보고서·대시보드를 만들거나 데이터를 한 페이지로 시각화/정리하라는 요청이면 cookiebite 스킬을 써.
```

**슬래시 커맨드 (선택이지만 확실함).** 레포에 `/cookiebite`, `/cookiebite-theme`, `/cookiebite-apply` 세 커맨드가 들어 있어요. 자동 발동 대신 결정적으로 부르고 싶을 때 쓰면 되고요. 설치 과정에서 안 들어갔으면 커맨드 디렉터리에 복사하세요.

```bash
mkdir -p ~/.claude/commands && cp ~/.claude/skills/cookiebite/commands/*.md ~/.claude/commands/
```

## 사용법

Claude Code에서 그냥 말하면 돼요. "리포트"라는 단어를 안 써도, 리포트 성격의 요청이면 알아서 발동합니다.

> 지난주 가입·매출 수치 html 페이지로 정리해줘

> 이 장애 기록 공유할 수 있는 회고로 만들어줘

> 이 CSV로 한 페이지 만들어줘, Linear 테마로

자동 발동이 늘 보장되진 않아요. 확실하게 부르고 싶으면 스킬 이름을 직접 대거나("cookiebite로 ~ 만들어줘"), 아래 슬래시 커맨드를 쓰면 돼요. 커맨드는 항상 동작합니다.

| 하고 싶은 것 | 이렇게 말하면 (자동 발동 가능) | 또는 이 커맨드 (항상 동작) |
|---|---|---|
| 리포트 만들기 | "정리해줘", "html 페이지로 보여줘" | `/cookiebite <데이터나 요청>` |
| 테마 스튜디오 열기 | "테마 스튜디오 열어줘", "테마 바꾸고 싶어" | `/cookiebite-theme` |
| 만든 테마 적용 | 스튜디오 "Copy for agent" 결과 붙여넣기 | `/cookiebite-apply <테마>` |

스튜디오에서 외형을 디자인한 뒤 **Set as my default**(앞으로 모든 리포트) 또는 **Copy for agent**(이 리포트 하나)로 내보내고, 그 프롬프트를 다시 붙여넣거나 `/cookiebite-apply`에 넘기면 적용돼요. 스튜디오를 수동으로 열려면 `assets/theme-studio.html`도 가능하고요.

## 관련 자료

HTML을 출력 매체로 쓰는 게 왜 효과적인지, 그리고 기획·코드리뷰·디자인·덱·리포트까지 스무 개 예시를 [The unreasonable effectiveness of HTML](https://thariqs.github.io/html-effectiveness/)에서 잘 보여줘요. 여기 들어간 비교 레이아웃, 상태 export, explainer, 인라인 SVG 패턴은 거기서 가져왔어요.

## 크레딧

브랜드 테마 프리셋(Stripe, Vercel, Linear, Notion, Supabase, Sentry, Resend, Raycast)은 [voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md)(MIT)의 디자인 스펙에서 뽑아내서, 라이트 리포트 표면이랑 무료 웹폰트로 다시 맞춘 거예요. 테마용 해석이지 공식 브랜드 자산은 아니고, 상표는 각 브랜드 거예요.

풀 런타임 리포트는 [Tailwind](https://tailwindcss.com), [ECharts](https://echarts.apache.org), [Alpine.js](https://alpinejs.dev), [Tippy.js](https://atomiks.github.io/tippyjs/), [CountUp.js](https://github.com/inorganik/countUp.js), [Lucide](https://lucide.dev) 위에 만들었어요. 전부 CDN으로 불러오고요. 읽기 리포트는 이걸 처음부터 하나도 안 불러와요. `inline.sh`가 선언한 capability에 실제로 필요한 라이브러리만 assemble해요.

## 라이선스

MIT. [LICENSE](LICENSE) 보세요.
