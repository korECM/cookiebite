import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Standfirst,
  Section,
  Sources,
  KpiRow,
  Claims,
  Findings,
  Glossary,
  DataTable,
  DataTableColumnHeader,
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
  mrr: { label: 'MRR ($K)', color: 'var(--chart-3)' },
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

type ChannelRow = {
  channel: string;
  plan: string;
  segment: string;
  mrr_k: number;
  net_delta_k: number;
  health: string;
};

const channelColumns: ColumnDef<ChannelRow>[] = [
  {
    accessorKey: 'channel',
    header: ({ column }) => (
      <DataTableColumnHeader title="계정" column={column} />
    ),
  },
  {
    accessorKey: 'plan',
    header: ({ column }) => (
      <DataTableColumnHeader title="플랜" column={column} />
    ),
  },
  {
    accessorKey: 'segment',
    header: ({ column }) => (
      <DataTableColumnHeader title="세그먼트" column={column} />
    ),
  },
  {
    accessorKey: 'mrr_k',
    header: ({ column }) => (
      <DataTableColumnHeader title="MRR ($K)" column={column} />
    ),
  },
  {
    accessorKey: 'net_delta_k',
    header: ({ column }) => (
      <DataTableColumnHeader title="순 증감 ($K)" column={column} />
    ),
  },
  {
    accessorKey: 'health',
    header: ({ column }) => (
      <DataTableColumnHeader title="건강도" column={column} />
    ),
  },
];

const channelData: ChannelRow[] = [
  {
    channel: 'Globex Corp',
    plan: '엔터프라이즈',
    segment: '엔터프라이즈',
    mrr_k: 121,
    net_delta_k: 9,
    health: '양호',
  },
  {
    channel: 'Northwind Trading',
    plan: '엔터프라이즈',
    segment: '미드마켓',
    mrr_k: 84,
    net_delta_k: 12,
    health: '양호',
  },
  {
    channel: 'Umbrella Co',
    plan: '엔터프라이즈',
    segment: '엔터프라이즈',
    mrr_k: 96,
    net_delta_k: 4,
    health: '양호',
  },
  {
    channel: 'Stark Industries',
    plan: '엔터프라이즈',
    segment: '엔터프라이즈',
    mrr_k: 142,
    net_delta_k: 1,
    health: '양호',
  },
  {
    channel: 'Initech',
    plan: '프로',
    segment: 'SMB',
    mrr_k: 22,
    net_delta_k: 6,
    health: '양호',
  },
  {
    channel: 'Wonka Labs',
    plan: '프로',
    segment: '미드마켓',
    mrr_k: 31,
    net_delta_k: 3,
    health: '양호',
  },
  {
    channel: 'Soylent Inc',
    plan: '팀',
    segment: 'SMB',
    mrr_k: 14,
    net_delta_k: 5,
    health: '주의',
  },
  {
    channel: 'Hooli',
    plan: '프로',
    segment: '미드마켓',
    mrr_k: 27,
    net_delta_k: -2,
    health: '주의',
  },
  {
    channel: 'Pied Piper',
    plan: '팀',
    segment: 'SMB',
    mrr_k: 9,
    net_delta_k: -4,
    health: '위험',
  },
  {
    channel: 'Vandelay Ind.',
    plan: '프로',
    segment: 'SMB',
    mrr_k: 18,
    net_delta_k: -6,
    health: '위험',
  },
  {
    channel: 'Bluth Company',
    plan: '스타터',
    segment: 'SMB',
    mrr_k: 4,
    net_delta_k: -7,
    health: '위험',
  },
];

export default function App() {
  return (
    <Report
      theme={stripe}
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
            },
            {
              label: '신규 MRR',
              value: '$58K',
              delta: { value: '8.2%', direction: 'down', good: false },
            },
            {
              label: '이탈 MRR',
              value: '$28K',
              delta: { value: '14.0%', direction: 'up', good: false },
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

      <Section id="bridge" title="MRR 브리지">
        <p>
          $1.377M에서 출발해 확장(+$71K)이 모든 음의 요인보다 큰 지렛대였고, 축소(-$18K)와
          이탈(-$28K)이 일부를 되돌려 순효과 +$43K로 $1.420M에 마감했다.
        </p>
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
      </Section>

      <Section id="trend" title="MRR 추세">
        <p>26주 복리 성장. 현재 속도라면 $1.5M 목표는 약 3주 앞이다.</p>
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
          헤더를 눌러 정렬할 수 있다. 확장은 집중돼 있어 상위 4개 계정이 이번 주 $71K
          확장의 절반 이상을 이끌었다.
        </p>
        <DataTable columns={channelColumns} data={channelData} />
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
