import { Report, Section, Standfirst, Panel, KpiRow } from 'cookiebite';
import { stripe } from 'cookiebite/themes';
import { ChartBarMultiple } from '@/components/chart-bar-multiple';

// 테마는 export const __theme 로 빌드가 읽는다
export const __theme = stripe;

export default function App() {
  return (
    <Report title="레지스트리 리믹스" kicker="라이브 shadcn 레지스트리에서 받은 블록, 가상 데이터">
      <Standfirst>
        이 페이지의 차트 블록은 손으로 만들지 않았다. 리포트 디렉토리에서 <code>npx shadcn@latest add @shadcn/chart-bar-multiple</code>로 받은 공식 레지스트리 원본을 그대로 import했다. 데이터와 라벨만 가상 값으로 바꿨고, 색은 이미 시맨틱 토큰이라 손댈 필요가 없었다.
      </Standfirst>

      {/* 내장 KpiRow — 3개 가상 지표 */}
      <Section id="summary" title="지표 요약">
        <KpiRow
          items={[
            {
              label: '일 평균 접속',
              value: '8.4',
              unit: '만',
              delta: { value: '+12%', direction: 'up', good: true },
              caption: '전월 대비',
            },
            {
              label: '앱 비중',
              value: '57',
              unit: '%',
              delta: { value: '+4pp', direction: 'up', good: true },
            },
            {
              label: '이탈률',
              value: '2.1',
              unit: '%',
              delta: { value: '-0.6pp', direction: 'down', good: true },
              caption: '개편 이후',
            },
          ]}
        />
      </Section>

      {/* 레지스트리에서 받은 블록 — 원본 그대로, 데이터만 가상 */}
      <Section id="traffic" title="접속 추이" lede="웹, 앱 접속을 나란히 비교한다.">
        <ChartBarMultiple />
        <Panel title="블록 출처" description="레지스트리 add 워크플로">
          <p className="text-sm text-muted-foreground">
            <code>chart-bar-multiple</code>은 shadcn 공식 차트 블록이다. <code>components/chart-bar-multiple.tsx</code>에 받은 파일이 그대로 있고, 의존하는 <code>card</code>, <code>chart</code>는 cookiebite 내장 <code>@/components/ui/*</code>로 자동 인식된다. 추가 의존성은 아이콘용 <code>lucide-react</code>뿐이라 별도 설치가 필요 없다.
          </p>
        </Panel>
      </Section>
    </Report>
  );
}
