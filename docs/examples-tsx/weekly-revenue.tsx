import {
  Report,
  Standfirst,
  Section,
  Sources,
  KpiRow,
  Claims,
  Findings,
  Glossary,
  BarList,
  CategoryBar,
  Panel,
} from 'cookiebite';
import { stripe } from 'cookiebite/themes';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

// legacy docs/examples/weekly-revenue.html 서사를 v3 표면으로 이식
// 성장 엔진은 신규 로고가 아니라 확장과 유지
export const __theme = stripe;

const bridgeConfig = {
  expansion: { label: '유입 (신규, 확장, 재활성)', color: 'var(--chart-1)' },
  churn: { label: '유출 (축소, 이탈)', color: 'var(--chart-2)' },
} satisfies ChartConfig;

// 워터폴을 grouped bar 로 재구성 — 양수 유입 / 음수 유출을 두 계열로
const bridgeData = [
  { component: '신규', expansion: 58, churn: 0 },
  { component: '확장', expansion: 71, churn: 0 },
  { component: '재활성', expansion: 9, churn: 0 },
  { component: '축소', expansion: 0, churn: 18 },
  { component: '이탈', expansion: 0, churn: 28 },
];

const trendConfig = {
  mrr: { label: 'MRR ($K)', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const trendData = [
  { week: 'W14', mrr: 1221 },
  { week: 'W15', mrr: 1238 },
  { week: 'W16', mrr: 1252 },
  { week: 'W17', mrr: 1268 },
  { week: 'W18', mrr: 1281 },
  { week: 'W19', mrr: 1305 },
  { week: 'W20', mrr: 1332 },
  { week: 'W21', mrr: 1351 },
  { week: 'W22', mrr: 1372 },
  { week: 'W23', mrr: 1389 },
  { week: 'W24', mrr: 1402 },
  { week: 'W25', mrr: 1411 },
  { week: 'W26', mrr: 1420 },
];

// BarList 값은 순 증감($K). 음수는 절댓값으로 표시하지 않고 양수 상위만 노출
const topAccountDeltas = [
  { name: 'Northwind Trading', value: 12, unit: 'K' },
  { name: 'Globex Corp', value: 9, unit: 'K' },
  { name: 'Initech', value: 6, unit: 'K' },
  { name: 'Soylent Inc', value: 5, unit: 'K' },
  { name: 'Umbrella Co', value: 4, unit: 'K' },
  { name: 'Wonka Labs', value: 3, unit: 'K' },
  { name: 'Stark Industries', value: 1, unit: 'K' },
];

const mrrSpark = trendData.slice(-12).map((d) => d.mrr);

export default function App() {
  return (
    <Report
      title="성장과 매출 주간 리뷰"
      kicker="주간 리뷰, 24주차, 2026-06-09 ~ 06-15, Acme Cloud"
    >
      <Standfirst>
        MRR이 $1.42M을 넘겼지만 성장 엔진은 신규 로고가 아니라 확장이다. 확장(+$71K)이
        축소와 이탈을 상쇄해 순증 MRR을 +$43K로 끌어올렸다. NRR(순수익유지율)은 112%를
        유지했지만 신규 로고 속도는 둔화됐고 총이탈은 늘었다.
      </Standfirst>

      <Section id="metrics" title="핵심 지표">
        <KpiRow
          items={[
            {
              label: 'MRR',
              value: '$1.42M',
              delta: { value: '전주 대비 3.1%', direction: 'up', good: true },
              compare: '전주 $1.377M 대비',
              spark: mrrSpark,
            },
            {
              label: '신규 MRR',
              value: '$58K',
              delta: { value: '8.2%', direction: 'down', good: false },
              compare: '전주 $63K 대비',
            },
            {
              label: '이탈 MRR',
              value: '$28K',
              delta: { value: '14.0%', direction: 'up', good: false },
              compare: '전주 $24.5K 대비',
            },
            {
              label: '순신규 로고',
              value: 34,
              delta: { value: '전주 대비 5', direction: 'down', good: false },
            },
            {
              label: 'NRR',
              value: '112',
              unit: '%',
              delta: { value: '2pp', direction: 'up', good: true },
            },
            {
              label: '활성화율',
              value: '62.4',
              unit: '%',
              delta: { value: '1.8pp', direction: 'up', good: true },
              caption: '가입 7일 내 아하 순간 도달',
            },
          ]}
        />
      </Section>

      <Section id="mix" title="매출 구성">
        <p>이번 주 유입 MRR의 구성. 확장이 신규를 앞질렀다.</p>
        <Panel title="유입 MRR 구성" description="신규, 확장, 재활성">
          <CategoryBar
            segments={[
              { label: '신규', value: 58 },
              { label: '확장', value: 71 },
              { label: '재활성', value: 9 },
            ]}
          />
        </Panel>
      </Section>

      <Section id="bridge" title="MRR 브리지">
        <p>
          $1.377M에서 출발해 확장(+$71K)이 모든 음의 요인보다 큰 지렛대였고, 축소(-$18K)와
          이탈(-$28K)이 일부를 되돌려 순효과 +$43K로 $1.420M에 마감했다.
        </p>
        <Panel title="주간 증감 기여" description="유입 3요소와 유출 2요소, 단위 $K">
          <ChartContainer
            id="mrr-bridge"
            config={bridgeConfig}
            className="min-h-[320px] w-full"
          >
            <BarChart accessibilityLayer data={bridgeData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="component"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="expansion"
                fill="var(--color-expansion)"
                radius={4}
              />
              <Bar dataKey="churn" fill="var(--color-churn)" radius={4} />
            </BarChart>
          </ChartContainer>
        </Panel>
      </Section>

      <Section id="trend" title="MRR 추세">
        <p>26주 복리 성장. 현재 속도라면 $1.5M 목표는 약 3주 앞이다.</p>
        <Panel title="W14–W26 주간 마감" description="주간 마감 MRR, 단위 $K">
          <ChartContainer
            id="mrr-trend"
            config={trendConfig}
            className="min-h-[300px] w-full"
          >
            <AreaChart accessibilityLayer data={trendData}>
              <defs>
                <linearGradient id="fillMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-mrr)"
                    stopOpacity={0.28}
                  />
                  <stop offset="95%" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="mrr"
                type="monotone"
                fill="url(#fillMrr)"
                stroke="var(--color-mrr)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </Panel>
      </Section>

      <Section id="claims" title="이번 주 주장">
        <Claims
          items={[
            {
              text: '확장이 성장 엔진이다 — $71K가 음의 요인 합계를 넘었다',
              evidence: 'MRR 브리지, NRR 112%',
              badge: '확인',
            },
            {
              text: '신규 로고 속도가 둔화된다 — 순신규 34, 전주 대비 5 감소',
              evidence: '유료 전환 3.6% (−0.4pp)',
              badge: '주의',
            },
            {
              text: '이탈이 기어오른다 — 11개 계정 $28K (전주 대비 14% 증가)',
              evidence: '엔터프라이즈 2건은 세이브 플레이 검토',
              badge: '위험',
            },
          ]}
        />
      </Section>

      <Section id="health" title="분기 목표와 건강도">
        <p>
          2주 남은 시점에 Q2 순증 MRR 목표의 82%에 있다. 확장이 유지되면 궤도에 있다.
        </p>
        <Findings
          items={[
            {
              severity: 'info',
              title: '확장이 성장 엔진이다',
              detail: '$71K 확장이 모든 음의 요인 합계를 넘었다. NRR 112%.',
            },
            {
              severity: 'warning',
              title: '신규 로고 속도가 둔화된다',
              detail:
                '순신규 로고 34, 전주 대비 5 감소. 유료 전환 3.6%로 0.4pp 하락.',
            },
            {
              severity: 'critical',
              title: '이탈이 기어오른다',
              detail:
                '11개 계정 이탈($28K, 전주 대비 14% 증가). 둘은 엔터프라이즈로 세이브 플레이를 검토한다.',
            },
          ]}
        />
      </Section>

      <Section id="accounts" title="순 MRR 증감 상위 계정">
        <p>
          확장은 집중돼 있어 상위 계정이 이번 주 순 증감의 대부분을 이끌었다.
        </p>
        <Panel title="순 MRR 증감 상위 계정">
          <BarList items={topAccountDeltas} />
        </Panel>
      </Section>

      <Section id="glossary" title="용어">
        <Glossary
          terms={[
            {
              term: 'NRR',
              def: '순수익유지율. 신규 로고를 뺀 기존 고객의 확장, 축소, 이탈을 반영한 수익 지표. 100%를 넘으면 기존 고객만으로도 매출이 자란다.',
            },
            {
              term: 'MRR / ARR',
              def: '월간, 연간 반복 매출. 정규화한 구독 매출이며 ARR = MRR × 12.',
            },
            {
              term: '이탈',
              def: '다운그레이드와 해지로 잃는 매출이나 로고. 총이탈은 손실만, 순이탈은 확장에서 손실을 뺀 값.',
            },
            {
              term: '활성화',
              def: '7일 안에 아하 순간(프로젝트 생성과 팀원 초대)에 닿는 가입 비율.',
            },
          ]}
        />
      </Section>

      <Sources
        items={[
          {
            label: 'Acme Cloud 빌링과 제품 분석 웨어하우스',
            note: '집계 기준 2026-06-15. 수치는 예시다.',
          },
        ]}
      />
    </Report>
  );
}
