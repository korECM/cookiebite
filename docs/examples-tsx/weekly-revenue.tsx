import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Standfirst,
  Section,
  Sources,
  Prose,
  Verdict,
  KpiRow,
  Claims,
  Findings,
  Glossary,
  BarList,
  CategoryBar,
  Panel,
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
import { Badge } from '@/components/ui/badge';
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

type ChannelStatus = '활성' | '베타' | '중단';

type ChannelRow = {
  channel: string;
  plan: string;
  status: ChannelStatus;
  transactions: number;
  successRate: number;
  fee: number;
  mrr: number;
  delta: number;
};

const channelData: ChannelRow[] = [
  {
    channel: 'Card',
    plan: 'Enterprise',
    status: '활성',
    transactions: 48210,
    successRate: 99.2,
    fee: 2.4,
    mrr: 520,
    delta: 18,
  },
  {
    channel: 'Wallet',
    plan: 'Growth',
    status: '활성',
    transactions: 31480,
    successRate: 98.7,
    fee: 2.1,
    mrr: 280,
    delta: 12,
  },
  {
    channel: 'Bank transfer',
    plan: 'Enterprise',
    status: '활성',
    transactions: 12640,
    successRate: 97.4,
    fee: 1.6,
    mrr: 210,
    delta: 8,
  },
  {
    channel: 'ACH',
    plan: 'Starter',
    status: '베타',
    transactions: 8920,
    successRate: 96.1,
    fee: 1.2,
    mrr: 95,
    delta: 4,
  },
  {
    channel: 'Wire',
    plan: 'Enterprise',
    status: '활성',
    transactions: 2140,
    successRate: 98.9,
    fee: 0.8,
    mrr: 140,
    delta: -2,
  },
  {
    channel: 'Crypto',
    plan: 'Growth',
    status: '베타',
    transactions: 3680,
    successRate: 94.8,
    fee: 2.9,
    mrr: 45,
    delta: 6,
  },
  {
    channel: 'Invoice',
    plan: 'Enterprise',
    status: '활성',
    transactions: 5410,
    successRate: 99.5,
    fee: 1.0,
    mrr: 110,
    delta: 3,
  },
  {
    channel: 'Legacy POS',
    plan: 'Starter',
    status: '중단',
    transactions: 820,
    successRate: 91.2,
    fee: 3.1,
    mrr: 20,
    delta: -6,
  },
];

const totalTransactions = channelData.reduce((s, r) => s + r.transactions, 0);
const totalMrr = channelData.reduce((s, r) => s + r.mrr, 0);

// Fixed locale — default toLocaleString() diverges between Node SSR and the browser.
function formatInt(n: number) {
  return n.toLocaleString('en-US');
}

const numericMeta = { className: 'text-right tabular-nums' } as const;

function StatusBadge({ status }: { status: ChannelStatus }) {
  return (
    <Badge
      variant="outline"
      className={status === '중단' ? 'text-muted-foreground' : undefined}
    >
      {status}
    </Badge>
  );
}

function SuccessRateCell({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-end gap-2 tabular-nums">
      <span>{`${value.toFixed(1)}%`}</span>
      <span
        className="inline-block h-1.5 w-16 overflow-hidden rounded bg-muted"
        aria-hidden
      >
        <span
          className="block h-full rounded bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </span>
    </div>
  );
}

function DeltaCell({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={
        up
          ? 'text-right tabular-nums text-success'
          : 'text-right tabular-nums text-destructive'
      }
    >
      {`${up ? '↗' : '↘'} ${up ? '+' : ''}${value}K`}
    </span>
  );
}

const channelColumns: ColumnDef<ChannelRow>[] = [
  {
    accessorKey: 'channel',
    header: '채널',
    footer: () => <span className="font-medium">합계</span>,
  },
  {
    accessorKey: 'plan',
    header: '플랜',
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: '거래',
    header: () => <div className="text-center">거래</div>,
    columns: [
      {
        accessorKey: 'transactions',
        header: ({ column }) => (
            <div className="flex justify-end">
              <DataTableColumnHeader title="거래수" column={column} />
            </div>
          ),
          cell: ({ row }) => formatInt(row.original.transactions),
          footer: () => formatInt(totalTransactions),
          meta: numericMeta,
        },
        {
          accessorKey: 'successRate',
          header: () => <div className="text-right">성공률</div>,
          cell: ({ row }) => <SuccessRateCell value={row.original.successRate} />,
          meta: numericMeta,
        },
      ],
    },
    {
      id: '수익',
      header: () => <div className="text-center">수익</div>,
      columns: [
        {
          accessorKey: 'fee',
          header: () => <div className="text-right">수수료</div>,
          cell: ({ row }) => `${row.original.fee.toFixed(1)}%`,
          meta: numericMeta,
        },
        {
          accessorKey: 'mrr',
          header: ({ column }) => (
            <div className="flex justify-end">
              <DataTableColumnHeader title="MRR" column={column} />
            </div>
          ),
        cell: ({ row }) => `$${row.original.mrr}K`,
        footer: () => `$${formatInt(totalMrr)}K`,
        meta: numericMeta,
      },
      {
        accessorKey: 'delta',
        header: () => <div className="text-right">증감</div>,
        cell: ({ row }) => <DeltaCell value={row.original.delta} />,
        meta: numericMeta,
      },
    ],
  },
];

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

      <Section id="metrics" title="확장이 순증을 만들었다">
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
              compare: '전주 39 대비',
            },
            {
              label: 'NRR',
              value: '112',
              unit: '%',
              delta: { value: '2pp', direction: 'up', good: true },
              compare: '전주 110% 대비',
            },
            {
              label: '활성화율',
              value: '62.4',
              unit: '%',
              delta: { value: '1.8pp', direction: 'up', good: true },
              compare: '전주 60.6% 대비',
              caption: '가입 7일 내 아하 순간 도달',
            },
          ]}
        />
      </Section>

      <Section id="mix" title="확장이 신규를 대체했다">
        <Prose>
          <p>유입을 어디서 벌었는지가 이번 주 해석을 가른다. 신규 로고로 번 돈과 기존 고객을 키워 번 돈은 지속 가능성이 다르기 때문이다. 신규는 매주 새로 사냥해야 하지만 확장은 이미 확보한 계정에서 나온다.</p>
        </Prose>
        <Panel title="확장이 유입의 절반을 넘겼다" description="신규를 $13K 앞선 확장 축">
          <CategoryBar
            segments={[
              { label: '신규', value: 58 },
              { label: '확장', value: 71 },
              { label: '재활성', value: 9 },
            ]}
          />
        </Panel>
        <Verdict label="판정">
          <p>확장 $71K가 신규 $58K를 $13K 앞섰다. 유입의 절반 이상을 기존 고객이 만들었다는 뜻이고, 이 구성이면 신규 로고가 둔화돼도 한동안 순증이 버틴다. 다만 같은 이유로 확장 여력이 큰 상위 계정에 매출이 몰리는 집중 위험이 함께 커진다 — 아래 상위 계정 절에서 그 집중도를 따로 본다.</p>
        </Verdict>
      </Section>

      <Section id="bridge" title="확장이 음의 요인을 덮었다">
        <Prose>
          <p>$1.377M에서 출발해 확장(+$71K)이 모든 음의 요인보다 큰 지렛대였고, 축소(-$18K)와 이탈(-$28K)이 일부를 되돌려 순효과 +$43K로 $1.420M에 마감했다. 브리지를 세워 보면 이번 주 순증이 한 축에 의존한다는 사실이 드러난다.</p>
        </Prose>
        <Panel title="확장 +$71K가 순증의 지렛대다" description="축소와 이탈 합보다 큰 확장 한 축">
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
        <Verdict label="판정">
          <p>확장 한 축이 축소와 이탈을 합친 것보다 크다. 바꿔 말하면 확장이 $46K 아래로 내려가는 주에는 순증이 곧바로 음수로 돌아선다. 이번 주 성적은 견고해 보이지만 완충 구간이 $25K뿐이라는 뜻이고, 그래서 다음 주 권고 첫 줄을 확장 방어에 뒀다.</p>
        </Verdict>
      </Section>

      <Section id="trend" title="복리 성장이 $1.5M을 3주 앞으로 당긴다">
        <Prose>
          <p>주간 스냅샷은 흔들리지만 13주 축에 놓으면 추세가 보인다. 연속 상승이 한 번도 끊기지 않았고, 최근 4주 기울기가 앞선 9주보다 가파르다. 목표 도달 시점을 추정할 근거는 이 기울기다.</p>
        </Prose>
        <Panel title="13주 연속 상승이 $1.42M에 닿았다" description="현재 속도면 $1.5M까지 약 3주">
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
        <Verdict label="판정">
          <p>현재 속도면 $1.5M까지 약 3주다. 이 추정은 최근 4주 평균 순증 $41K가 유지된다는 가정 하나에 얹혀 있고, 그 가정은 확장이 계속 $65K 위에 머무를 때만 성립한다. 신규 로고 둔화가 확장까지 옮겨붙으면 도달 시점은 3주가 아니라 5주 밖으로 밀린다.</p>
        </Verdict>
      </Section>

      <Section id="claims" title="다음 주 권고">
        <Claims
          items={[
            {
              text: 'Growth팀이 다음 주까지 상위 확장 계정 7곳에 업셀 플레이북을 적용하고, 주간 확장 MRR $65K 이상을 기준으로 삼는다',
              evidence: 'MRR 브리지, NRR 112%',
              badge: '실행',
            },
            {
              text: '마케팅이 2주 안에 유료 전환 퍼널을 점검해 전환율 4.0% 복구를 성공 기준으로 둔다',
              evidence: '유료 전환 3.6% (−0.4pp)',
              badge: '주의',
            },
            {
              text: 'CS가 이번 주 안에 엔터프라이즈 이탈 후보 2건 세이브 플레이를 시작하고, 주간 이탈 MRR $24K 이하를 기준으로 삼는다',
              evidence: '엔터프라이즈 2건은 세이브 플레이 검토',
              badge: '위험',
            },
          ]}
        />
      </Section>

      <Section id="health" title="Q2 목표의 82%에 있다">
        <Prose>
          <p>분기 마감까지 2주 남은 시점에 Q2 순증 MRR 목표의 82%에 있다. 남은 18%를 2주에 나눠 담으면 주당 $39K로, 이번 주 순증 $43K보다 낮다. 지금 속도만 유지해도 목표에 닿는다는 뜻이다.</p>
        </Prose>
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
        <Verdict label="한계" tone="caution">
          <p>이번 해석은 24주차 한 주 스냅샷과 상위 계정 7곳 표본에 기댄다. 시즌성과 프로모션 교란을 분리하지 않았으므로, 확장 $71K 중 얼마가 6월 초 연간 계약 갱신 주기에서 온 일회성인지 이 리포트만으로는 가를 수 없다. 다음 주 수치가 $55K 아래로 떨어지면 갱신 주기 효과였다고 보는 편이 맞다.</p>
        </Verdict>
      </Section>

      <Section id="accounts" title="상위 계정이 확장을 집중한다">
        <Prose>
          <p>확장이 성장 엔진이라면 그 엔진이 몇 기통인지가 다음 질문이다. 계정별 순 증감을 늘어놓으면 이번 주 성장이 넓게 퍼진 것인지 몇 곳에 몰린 것인지 바로 드러난다.</p>
        </Prose>
        <Panel title="상위 7계정이 순 증감의 대부분을 이끈다" description="확장 집중도가 높다">
          <BarList items={topAccountDeltas} />
        </Panel>
        <Verdict label="판정">
          <p>상위 7곳이 순 증감의 대부분을 이끌었다. 성장이 넓게 퍼진 게 아니라 소수에 얹혀 있다는 뜻이고, 이 중 한 곳만 이탈해도 주간 순증이 절반으로 준다. 업셀 플레이북을 이 7곳에 먼저 붙이라는 권고는 기회가 아니라 위험 관리에서 나온다.</p>
        </Verdict>
      </Section>

      <Section id="channels" title="Card와 Wallet이 MRR 절반을 맡는다">
        <Prose>
          <p>채널별로 쪼개면 매출이 어떤 결제 수단에 묶여 있는지 보인다. 채널 하나가 무너질 때의 노출 규모를 가늠하려면 비중과 함께 추세를 같이 봐야 한다. 합계 MRR은 위에서 본 $1.42M과 맞는다.</p>
        </Prose>
        <Panel title="Card와 Wallet이 합계의 절반을 넘긴다" description="Legacy POS는 중단 대기">
          <DataTable columns={channelColumns} data={channelData} />
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
