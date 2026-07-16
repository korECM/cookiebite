import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Standfirst,
  Section,
  Sources,
  Columns,
  Panel,
  KpiRow,
  Claims,
  Findings,
  BarList,
  DataTable,
  DataTableColumnHeader,
} from 'cookiebite';
import { stripe } from 'cookiebite/themes';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

// 가상 데이터 — 실제 회사, 유저 식별자 없음. MID는 마스킹.
export const __theme = stripe;

function formatInt(n: number) {
  return n.toLocaleString('en-US');
}

const numericMeta = { className: 'text-right tabular-nums' } as const;
const monoMeta = { className: 'font-mono text-sm' } as const;

type AbuserRow = {
  rank: number;
  mid: string;
  count: number;
  total: number;
  avgPrice: number;
  firstSeen: string;
  lastSeen: string;
  mainCurrency: string;
};

const abuserRows: AbuserRow[] = [
  {
    rank: 1,
    mid: 'XQ****61',
    count: 148,
    total: 41280,
    avgPrice: 279,
    firstSeen: '2025-11-04',
    lastSeen: '2026-06-18',
    mainCurrency: 'TWD',
  },
  {
    rank: 2,
    mid: 'HK****93',
    count: 121,
    total: 33890,
    avgPrice: 280,
    firstSeen: '2025-12-12',
    lastSeen: '2026-06-17',
    mainCurrency: 'TWD',
  },
  {
    rank: 3,
    mid: 'JP****44',
    count: 97,
    total: 27160,
    avgPrice: 280,
    firstSeen: '2026-01-08',
    lastSeen: '2026-06-16',
    mainCurrency: 'JPY',
  },
  {
    rank: 4,
    mid: 'TW****17',
    count: 86,
    total: 24080,
    avgPrice: 280,
    firstSeen: '2026-01-22',
    lastSeen: '2026-06-15',
    mainCurrency: 'TWD',
  },
  {
    rank: 5,
    mid: 'KR****08',
    count: 74,
    total: 19980,
    avgPrice: 270,
    firstSeen: '2026-02-03',
    lastSeen: '2026-06-14',
    mainCurrency: 'KRW',
  },
  {
    rank: 6,
    mid: 'US****52',
    count: 68,
    total: 19040,
    avgPrice: 280,
    firstSeen: '2026-02-18',
    lastSeen: '2026-06-13',
    mainCurrency: 'USD',
  },
  {
    rank: 7,
    mid: 'EU****29',
    count: 55,
    total: 14850,
    avgPrice: 270,
    firstSeen: '2026-03-01',
    lastSeen: '2026-06-12',
    mainCurrency: 'EUR',
  },
  {
    rank: 8,
    mid: 'SG****76',
    count: 49,
    total: 13230,
    avgPrice: 270,
    firstSeen: '2026-03-14',
    lastSeen: '2026-06-11',
    mainCurrency: 'USD',
  },
  {
    rank: 9,
    mid: 'VN****33',
    count: 41,
    total: 11070,
    avgPrice: 270,
    firstSeen: '2026-03-28',
    lastSeen: '2026-06-10',
    mainCurrency: 'USD',
  },
  {
    rank: 10,
    mid: 'TH****85',
    count: 36,
    total: 9720,
    avgPrice: 270,
    firstSeen: '2026-04-05',
    lastSeen: '2026-06-09',
    mainCurrency: 'USD',
  },
];

const abuserColumns: ColumnDef<AbuserRow>[] = [
  {
    accessorKey: 'rank',
    header: '#',
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.rank}
      </span>
    ),
  },
  {
    accessorKey: 'mid',
    header: 'MID',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.mid}</span>
    ),
    meta: monoMeta,
  },
  {
    accessorKey: 'count',
    header: ({ column }) => (
      <DataTableColumnHeader title="횟수" column={column} />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="tabular-nums">
        {formatInt(row.original.count)}
      </Badge>
    ),
  },
  {
    accessorKey: 'total',
    header: ({ column }) => (
      <div className="flex justify-end">
        <DataTableColumnHeader title="합계 (USD)" column={column} />
      </div>
    ),
    cell: ({ row }) => formatInt(row.original.total),
    meta: numericMeta,
  },
  {
    accessorKey: 'avgPrice',
    header: () => <div className="text-right">평균가</div>,
    cell: ({ row }) => formatInt(row.original.avgPrice),
    meta: numericMeta,
  },
  {
    accessorKey: 'firstSeen',
    header: '최초',
  },
  {
    accessorKey: 'lastSeen',
    header: '최근',
  },
  {
    accessorKey: 'mainCurrency',
    header: '주통화',
  },
];

const currencyConfig = {
  twd: { label: 'TWD', color: 'var(--chart-1)' },
  krw: { label: 'KRW', color: 'var(--chart-2)' },
  usd: { label: 'USD', color: 'var(--chart-3)' },
  jpy: { label: 'JPY', color: 'var(--chart-4)' },
  eur: { label: 'EUR', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const currencyData = [
  { currency: 'twd', share: 4120, fill: 'var(--color-twd)' },
  { currency: 'krw', share: 1856, fill: 'var(--color-krw)' },
  { currency: 'usd', share: 1484, fill: 'var(--color-usd)' },
  { currency: 'jpy', share: 1113, fill: 'var(--color-jpy)' },
  { currency: 'eur', share: 705, fill: 'var(--color-eur)' },
];

const priceConfig = {
  count: { label: '건수', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const priceData = [
  { bucket: '<$1', count: 2890 },
  { bucket: '$1–5', count: 2410 },
  { bucket: '$5–10', count: 1680 },
  { bucket: '$10–20', count: 1120 },
  { bucket: '$20–50', count: 740 },
  { bucket: '$50–100', count: 298 },
  { bucket: '$100+', count: 140 },
];

const paidProducts = [
  { name: '스타터 젬 60', value: 2140 },
  { name: '스타터 젬 300', value: 1680 },
  { name: '데일리 패스', value: 1320 },
  { name: '주간 패스', value: 980 },
  { name: '성장 팩 S', value: 740 },
  { name: '성장 팩 M', value: 520 },
  { name: '시즌 티켓', value: 410 },
  { name: '기타 저가', value: 380 },
];

const targetProducts = [
  { name: '프리미엄 젬 5000', value: 1980 },
  { name: '시즌 패스+', value: 1640 },
  { name: '성장 팩 XL', value: 1420 },
  { name: '한정 스킨 세트', value: 1180 },
  { name: '프리미엄 젬 2500', value: 960 },
  { name: '길드 부스트', value: 720 },
  { name: '월간 구독', value: 580 },
  { name: '기타 고가', value: 420 },
];

const frequencyConfig = {
  abusers: { label: '어뷰저 수', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const frequencyData = [
  { band: '1회', abusers: 312 },
  { band: '2–3', abusers: 98 },
  { band: '4–10', abusers: 54 },
  { band: '11–30', abusers: 27 },
  { band: '31+', abusers: 12 },
];

const habitConfig = {
  once: { label: '1회성', color: 'var(--chart-1)' },
  repeat: { label: '상습', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const habitData = [
  { kind: 'once', share: 312, fill: 'var(--color-once)' },
  { kind: 'repeat', share: 191, fill: 'var(--color-repeat)' },
];

const monthConfig = {
  cases: { label: '어뷰징 건수', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const monthData = [
  { month: '2025-12', cases: 620 },
  { month: '2026-01', cases: 880 },
  { month: '2026-02', cases: 1120 },
  { month: '2026-03', cases: 1480 },
  { month: '2026-04', cases: 1760 },
  { month: '2026-05', cases: 1890 },
  { month: '2026-06', cases: 1528 },
];

const hourConfig = {
  cases: { label: '건수', color: 'var(--chart-4)' },
} satisfies ChartConfig;

// KST 24시 — 심야와 출근 직전 피크, 합 9278
const hourData = [
  { hour: '00', cases: 410 },
  { hour: '01', cases: 580 },
  { hour: '02', cases: 680 },
  { hour: '03', cases: 480 },
  { hour: '04', cases: 290 },
  { hour: '05', cases: 180 },
  { hour: '06', cases: 140 },
  { hour: '07', cases: 160 },
  { hour: '08', cases: 210 },
  { hour: '09', cases: 280 },
  { hour: '10', cases: 320 },
  { hour: '11', cases: 350 },
  { hour: '12', cases: 390 },
  { hour: '13', cases: 370 },
  { hour: '14', cases: 340 },
  { hour: '15', cases: 310 },
  { hour: '16', cases: 300 },
  { hour: '17', cases: 330 },
  { hour: '18', cases: 380 },
  { hour: '19', cases: 450 },
  { hour: '20', cases: 590 },
  { hour: '21', cases: 660 },
  { hour: '22', cases: 610 },
  { hour: '23', cases: 468 },
];

export default function App() {
  return (
    <Report
      title="게임 결제 어뷰징 분석"
      kicker="분석 리포트, 2026-06, 가상 데이터"
      layout="article"
      numbered
    >
      <Standfirst>
        2025-12부터 2026-06까지 집계한 가상 결제 로그에서 어뷰징 9,278건이 확인됐다.
        유니크 어뷰저 503명 중 상습 191명이 전체 건수의 71%를 차지하며, 실결제 상품은
        최저가 tier에 75.2% 집중된 뒤 고가 tier로 바꿔치기되는 패턴이 반복된다.
      </Standfirst>

      <Section id="summary" title="요약">
        <KpiRow
          items={[
            {
              label: '총 어뷰징 건수',
              value: formatInt(9278),
              unit: '건',
            },
            {
              label: '유니크 어뷰저',
              value: formatInt(503),
              unit: '명',
            },
            {
              label: '평균 배수',
              value: '42.4',
              unit: 'x',
              compare: '중앙값 30.0x, 최대 109.1x',
            },
            {
              label: '추정 손실 (TWD)',
              value: 'NT$18.4M',
              compare: '실결제 대비 바꿔치기 차액',
            },
            {
              label: '추정 손실 (USD)',
              value: '$568K',
              compare: 'TWD 환산, 2026-06 기준',
            },
          ]}
        />
        <Claims
          items={[
            {
              text: '실결제 상품의 75.2%가 최저가 tier 집중 — 고가 tier로 바꿔치기 패턴이 22.5%',
              evidence: '9,278건 중 6,980건이 <$10 실결제 후 고가 수령',
              badge: '핵심',
            },
            {
              text: '상습 어뷰저 191명이 전체 건수의 71.2%를 만든다',
              evidence: '1회성 312명 vs 상습 191명, 상습 평균 34.6회',
              badge: '집중',
            },
            {
              text: 'TWD 통화가 전체의 44.4% — 대만 스토어프론트 편중이 뚜렷하다',
              evidence: 'TWD 4,120건, 이어서 KRW 20.0%, USD 16.0%',
            },
            {
              text: '심야(01–03시 KST)와 저녁(20–22시)에 피크가 겹친다',
              evidence: '01–03시 합 1,740건, 20–22시 합 1,860건',
            },
          ]}
        />
      </Section>

      <Section
        id="basics"
        title="기초 통계"
        lede="통화와 가격대 분포로 어뷰징이 어디서 시작되는지 본다."
      >
        <Columns>
          <Panel title="통화별 분포" description="어뷰징 건수, 5개 통화">
            <ChartContainer
              id="abuse-currency"
              config={currencyConfig}
              className="mx-auto aspect-square max-h-[280px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="currency" hideLabel />}
                />
                <Pie
                  data={currencyData}
                  dataKey="share"
                  nameKey="currency"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {currencyData.map((item) => (
                    <Cell key={item.currency} fill={item.fill} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="currency" />}
                />
              </PieChart>
            </ChartContainer>
          </Panel>
          <Panel title="가격대 분포" description="실결제 금액 구간, 7 bucket">
            <ChartContainer
              id="abuse-price"
              config={priceConfig}
              className="min-h-[280px] w-full"
            >
              <BarChart accessibilityLayer data={priceData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>

      <Section
        id="products"
        title="상품 패턴"
        lede="실결제는 저가, 타겟은 고가 — 바꿔치기의 양쪽 끝."
      >
        <Columns>
          <Panel title="실결제 상품 TOP 8" description="실제 청구된 상품">
            <BarList items={paidProducts} />
          </Panel>
          <Panel title="타겟 상품 TOP 8" description="수령으로 잡힌 상품">
            <BarList items={targetProducts} />
          </Panel>
        </Columns>
      </Section>

      <Section
        id="habitual"
        title="상습 어뷰저"
        lede="1회성보다 상습 소수가 손실을 키운다."
      >
        <Columns>
          <Panel title="횟수 분포" description="유니크 어뷰저 503명">
            <ChartContainer
              id="abuse-frequency"
              config={frequencyConfig}
              className="min-h-[260px] w-full"
            >
              <BarChart accessibilityLayer data={frequencyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="band"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="abusers"
                  fill="var(--color-abusers)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </Panel>
          <Panel title="1회성 vs 상습" description="유니크 기준 2-slice">
            <ChartContainer
              id="abuse-habit"
              config={habitConfig}
              className="mx-auto aspect-square max-h-[260px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="kind" hideLabel />}
                />
                <Pie
                  data={habitData}
                  dataKey="share"
                  nameKey="kind"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {habitData.map((item) => (
                    <Cell key={item.kind} fill={item.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="kind" />} />
              </PieChart>
            </ChartContainer>
          </Panel>
        </Columns>
        <Panel
          title="상위 어뷰저 TOP 10"
          description="마스킹 MID, 합계는 USD 환산"
        >
          <DataTable columns={abuserColumns} data={abuserRows} />
        </Panel>
      </Section>

      <Section
        id="timing"
        title="시간 패턴"
        lede="월별 증가 추세와 KST 시간대 피크."
      >
        <Columns>
          <Panel title="월별 추이" description="2025-12 ~ 2026-06">
            <ChartContainer
              id="abuse-month"
              config={monthConfig}
              className="min-h-[280px] w-full"
            >
              <AreaChart accessibilityLayer data={monthData}>
                <defs>
                  <linearGradient id="fillCases" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-cases)"
                      stopOpacity={0.28}
                    />
                    <stop offset="95%" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="cases"
                  type="monotone"
                  fill="url(#fillCases)"
                  stroke="var(--color-cases)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </Panel>
          <Panel
            title="시간대별 분포(KST)"
            description="24 bucket, 심야와 저녁 피크"
          >
            <ChartContainer
              id="abuse-hour"
              config={hourConfig}
              className="min-h-[280px] w-full"
            >
              <BarChart accessibilityLayer data={hourData} barCategoryGap={2}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="hour"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  interval={3}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={36}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cases" fill="var(--color-cases)" radius={2} />
              </BarChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>

      <Section id="recommendations" title="결론과 권고">
        <Findings
          items={[
            {
              severity: 'critical',
              title: '저가 실결제 → 고가 수령 바꿔치기를 실시간으로 차단해야 한다',
              detail:
                '실결제 <$10 이후 동일 세션에서 고가 수령이 관측되면 즉시 hold.',
            },
            {
              severity: 'warning',
              title: '상습 MID 191명을 우선 감시 목록에 올린다',
              detail:
                'TOP 10만으로도 합계 손실의 약 38%를 설명한다. 반복 임계값 4회부터 단계 제재.',
            },
            {
              severity: 'info',
              title: 'TWD 스토어프론트와 심야 구간에 탐지 가중치를 둔다',
              detail:
                '통화와 시간대 피처를 룰 엔진에 넣고 false positive를 주간 리뷰한다.',
            },
          ]}
        />
        <Claims
          items={[
            {
              text: '4회 이상 반복 MID에 단계 제재를 적용하면 예상 손실의 55%를 줄일 수 있다',
              evidence: '상습 191명 × 평균 34.6회 기준으로 시뮬',
              badge: '권고',
            },
            {
              text: '가격 tier 불일치 탐지를 결제 승인 직후에 붙이면 바꿔치기 22.5%를 선제 차단한다',
              evidence: '실결제–수령 상품 SKU 매칭 지연을 2초 이내로',
            },
          ]}
        />
        <Sources
          items={[
            {
              label: '가상 결제 어뷰징 로그 (마스킹)',
              note: '2025-12-01 ~ 2026-06-18',
            },
            {
              label: '스토어프론트 통화, 가격 tier 매핑',
              note: '내부 카탈로그 스냅샷',
            },
            {
              label: '환산 환율',
              note: 'TWD→USD, 2026-06 평균',
            },
          ]}
        />
      </Section>
    </Report>
  );
}
