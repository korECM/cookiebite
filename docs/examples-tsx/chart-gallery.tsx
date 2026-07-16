import {
  Report,
  Standfirst,
  Section,
  Columns,
  Panel,
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
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts';

// 컴포넌트 카탈로그 — shadcn chart 모양을 한 페이지에서 검증
export const __theme = stripe;

const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월'] as const;

const areaData = months.map((month, i) => ({
  month,
  visitors: [420, 480, 510, 460, 540, 590, 620, 610][i]!,
}));

const stackedAreaData = months.map((month, i) => ({
  month,
  desktop: [186, 205, 237, 173, 209, 214, 240, 228][i]!,
  mobile: [80, 120, 140, 160, 130, 150, 170, 165][i]!,
}));

const groupedBarData = months.slice(0, 6).map((month, i) => ({
  month,
  desktop: [186, 305, 237, 173, 209, 214][i]!,
  mobile: [80, 200, 120, 190, 130, 140][i]!,
}));

const stackedBarData = groupedBarData;

const horizontalBarData = [
  { channel: '검색', value: 420 },
  { channel: '소셜', value: 310 },
  { channel: '직접', value: 260 },
  { channel: '이메일', value: 180 },
  { channel: '제휴', value: 120 },
  { channel: '기타', value: 90 },
];

const negativeBarData = months.slice(0, 6).map((month, i) => ({
  month,
  delta: [42, -18, 31, -27, 55, -12][i]!,
}));

const multiLineData = months.map((month, i) => ({
  month,
  desktop: [186, 205, 237, 173, 209, 214, 240, 228][i]!,
  mobile: [80, 120, 140, 160, 130, 150, 170, 165][i]!,
  tablet: [45, 52, 61, 58, 70, 74, 80, 77][i]!,
}));

const stepLineData = months.slice(0, 6).map((month, i) => ({
  month,
  signups: [40, 55, 48, 72, 68, 90][i]!,
}));

const donutData = [
  { channel: 'search', share: 38, fill: 'var(--color-search)' },
  { channel: 'social', share: 24, fill: 'var(--color-social)' },
  { channel: 'direct', share: 18, fill: 'var(--color-direct)' },
  { channel: 'email', share: 12, fill: 'var(--color-email)' },
  { channel: 'other', share: 8, fill: 'var(--color-other)' },
];

const labeledPieData = [
  { region: 'kr', share: 42, fill: 'var(--color-kr)' },
  { region: 'jp', share: 22, fill: 'var(--color-jp)' },
  { region: 'tw', share: 16, fill: 'var(--color-tw)' },
  { region: 'us', share: 12, fill: 'var(--color-us)' },
  { region: 'other', share: 8, fill: 'var(--color-other)' },
];

const radarData = [
  { skill: '속도', alpha: 120, beta: 98 },
  { skill: '안정', alpha: 98, beta: 110 },
  { skill: '전환', alpha: 86, beta: 92 },
  { skill: '유지', alpha: 99, beta: 85 },
  { skill: '지원', alpha: 85, beta: 102 },
  { skill: '확장', alpha: 110, beta: 94 },
];

const radialData = [
  { tier: 'gold', score: 92, fill: 'var(--color-gold)' },
  { tier: 'silver', score: 74, fill: 'var(--color-silver)' },
  { tier: 'bronze', score: 58, fill: 'var(--color-bronze)' },
];

const composedData = months.slice(0, 6).map((month, i) => ({
  month,
  revenue: [210, 240, 230, 280, 300, 320][i]!,
  orders: [42, 48, 45, 55, 58, 62][i]!,
}));

const areaConfig = {
  visitors: { label: '방문자', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const stackedAreaConfig = {
  desktop: { label: '데스크톱', color: 'var(--chart-1)' },
  mobile: { label: '모바일', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const groupedBarConfig = {
  desktop: { label: '데스크톱', color: 'var(--chart-1)' },
  mobile: { label: '모바일', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const horizontalBarConfig = {
  value: { label: '유입', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const negativeBarConfig = {
  delta: { label: '증감' },
  positive: { label: '증가', color: 'var(--chart-1)' },
  negative: { label: '감소', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const multiLineConfig = {
  desktop: { label: '데스크톱', color: 'var(--chart-1)' },
  mobile: { label: '모바일', color: 'var(--chart-2)' },
  tablet: { label: '태블릿', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const stepLineConfig = {
  signups: { label: '가입', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const donutConfig = {
  share: { label: '비중' },
  search: { label: '검색', color: 'var(--chart-1)' },
  social: { label: '소셜', color: 'var(--chart-2)' },
  direct: { label: '직접', color: 'var(--chart-3)' },
  email: { label: '이메일', color: 'var(--chart-4)' },
  other: { label: '기타', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const labeledPieConfig = {
  share: { label: '비중' },
  kr: { label: '한국', color: 'var(--chart-1)' },
  jp: { label: '일본', color: 'var(--chart-2)' },
  tw: { label: '대만', color: 'var(--chart-3)' },
  us: { label: '미국', color: 'var(--chart-4)' },
  other: { label: '기타', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const radarConfig = {
  alpha: { label: '알파', color: 'var(--chart-1)' },
  beta: { label: '베타', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const radialConfig = {
  score: { label: '점수' },
  gold: { label: '골드', color: 'var(--chart-1)' },
  silver: { label: '실버', color: 'var(--chart-2)' },
  bronze: { label: '브론즈', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const composedConfig = {
  revenue: { label: '매출', color: 'var(--chart-1)' },
  orders: { label: '주문', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export default function ChartGallery() {
  return (
    <Report
      title="차트 갤러리"
      kicker="컴포넌트 카탈로그, 가상 데이터"
      layout="article"
      numbered
      width="default"
    >
      <Standfirst>
        shadcn chart + Recharts 조합을 한 페이지에서 돌린다. 각 Panel은
        chart-empty gate를 통과해야 하고, 색은 chartConfig 토큰만 쓴다.
      </Standfirst>

      <Section id="area" title="Area" lede="그라데이션 단색과 stacked 2-series.">
        <Columns>
          <Panel title="Area" description="기본 gradient area, monotone">
            <ChartContainer
              id="gallery-area"
              config={areaConfig}
              className="min-h-[240px] w-full"
            >
              <AreaChart accessibilityLayer data={areaData}>
                <defs>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-visitors)"
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
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="visitors"
                  type="monotone"
                  fill="url(#fillVisitors)"
                  stroke="var(--color-visitors)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </Panel>
          <Panel title="Stacked Area" description="stackId로 desktop + mobile 누적">
            <ChartContainer
              id="gallery-area-stacked"
              config={stackedAreaConfig}
              className="min-h-[240px] w-full"
            >
              <AreaChart accessibilityLayer data={stackedAreaData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="desktop"
                  type="monotone"
                  stackId="a"
                  fill="var(--color-desktop)"
                  stroke="var(--color-desktop)"
                  fillOpacity={0.4}
                />
                <Area
                  dataKey="mobile"
                  type="monotone"
                  stackId="a"
                  fill="var(--color-mobile)"
                  stroke="var(--color-mobile)"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>

      <Section
        id="bar"
        title="Bar"
        lede="grouped, stacked, horizontal, 양음 혼합."
      >
        <Columns>
          <Panel title="Grouped Bar" description="2-series 나란히, radius 4">
            <ChartContainer
              id="gallery-bar-grouped"
              config={groupedBarConfig}
              className="min-h-[240px] w-full"
            >
              <BarChart accessibilityLayer data={groupedBarData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Panel>
          <Panel title="Stacked Bar" description="stackId로 누적 막대">
            <ChartContainer
              id="gallery-bar-stacked"
              config={groupedBarConfig}
              className="min-h-[240px] w-full"
            >
              <BarChart accessibilityLayer data={stackedBarData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="desktop"
                  stackId="a"
                  fill="var(--color-desktop)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="mobile"
                  stackId="a"
                  fill="var(--color-mobile)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </Panel>
        </Columns>
        <Columns>
          <Panel
            title="Horizontal Bar"
            description="layout=vertical, YAxis category"
          >
            <ChartContainer
              id="gallery-bar-horizontal"
              config={horizontalBarConfig}
              className="min-h-[240px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={horizontalBarData}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="channel"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={48}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" fill="var(--color-value)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Panel>
          <Panel
            title="Negative Bar"
            description="양음 혼합, Cell fill chart-1 / chart-5"
          >
            <ChartContainer
              id="gallery-bar-negative"
              config={negativeBarConfig}
              className="min-h-[240px] w-full"
            >
              <BarChart accessibilityLayer data={negativeBarData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="delta" radius={4}>
                  {negativeBarData.map((item) => (
                    <Cell
                      key={item.month}
                      fill={
                        item.delta > 0
                          ? 'var(--color-positive)'
                          : 'var(--color-negative)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>

      <Section id="line" title="Line" lede="멀티 시리즈와 dots + step.">
        <Columns>
          <Panel title="Multi Line" description="3-series stroke, 점 없음">
            <ChartContainer
              id="gallery-line-multi"
              config={multiLineConfig}
              className="min-h-[240px] w-full"
            >
              <LineChart accessibilityLayer data={multiLineData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="desktop"
                  type="monotone"
                  stroke="var(--color-desktop)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="mobile"
                  type="monotone"
                  stroke="var(--color-mobile)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="tablet"
                  type="monotone"
                  stroke="var(--color-tablet)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </Panel>
          <Panel title="Step + Dots" description="type=step, fill 있는 점">
            <ChartContainer
              id="gallery-line-step"
              config={stepLineConfig}
              className="min-h-[240px] w-full"
            >
              <LineChart accessibilityLayer data={stepLineData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="signups"
                  type="step"
                  stroke="var(--color-signups)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-signups)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>

      <Section id="pie" title="Pie" lede="donut + legend, labelLine 라벨 파이.">
        <Columns>
          <Panel title="Donut" description="innerRadius + ChartLegend">
            <ChartContainer
              id="gallery-donut"
              config={donutConfig}
              className="mx-auto aspect-square max-h-[280px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="channel" hideLabel />}
                />
                <Pie
                  data={donutData}
                  dataKey="share"
                  nameKey="channel"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {donutData.map((item) => (
                    <Cell key={item.channel} fill={item.fill} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="channel" />}
                />
              </PieChart>
            </ChartContainer>
          </Panel>
          <Panel title="Pie Labels" description="label + labelLine 외곽 라벨">
            <ChartContainer
              id="gallery-pie-labels"
              config={labeledPieConfig}
              className="mx-auto aspect-square max-h-[280px] w-full [&_.recharts-pie-label-text]:fill-foreground"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="region" hideLabel />}
                />
                <Pie
                  data={labeledPieData}
                  dataKey="share"
                  nameKey="region"
                  label
                  labelLine
                  strokeWidth={2}
                >
                  {labeledPieData.map((item) => (
                    <Cell key={item.region} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>

      <Section id="radar" title="Radar" lede="2-series PolarGrid + PolarAngleAxis.">
        <Columns>
          <Panel title="Radar" description="alpha / beta 2-series fillOpacity">
            <ChartContainer
              id="gallery-radar"
              config={radarConfig}
              className="mx-auto aspect-square max-h-[280px] w-full"
            >
              <RadarChart data={radarData}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <PolarAngleAxis dataKey="skill" />
                <PolarGrid />
                <Radar
                  dataKey="alpha"
                  fill="var(--color-alpha)"
                  fillOpacity={0.35}
                  stroke="var(--color-alpha)"
                />
                <Radar
                  dataKey="beta"
                  fill="var(--color-beta)"
                  fillOpacity={0.35}
                  stroke="var(--color-beta)"
                />
              </RadarChart>
            </ChartContainer>
          </Panel>
          <Panel title="Radar (lines)" description="fillOpacity 0, stroke만">
            <ChartContainer
              id="gallery-radar-lines"
              config={radarConfig}
              className="mx-auto aspect-square max-h-[280px] w-full"
            >
              <RadarChart data={radarData}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <PolarAngleAxis dataKey="skill" />
                <PolarGrid radialLines={false} />
                <Radar
                  dataKey="alpha"
                  fill="var(--color-alpha)"
                  fillOpacity={0}
                  stroke="var(--color-alpha)"
                  strokeWidth={2}
                />
                <Radar
                  dataKey="beta"
                  fill="var(--color-beta)"
                  fillOpacity={0}
                  stroke="var(--color-beta)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>

      <Section id="radial" title="Radial" lede="RadialBarChart + background.">
        <Columns>
          <Panel title="Radial Bar" description="3 bars, RadialBar background">
            <ChartContainer
              id="gallery-radial"
              config={radialConfig}
              className="mx-auto aspect-square max-h-[280px] w-full"
            >
              <RadialBarChart
                data={radialData}
                innerRadius={30}
                outerRadius={110}
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="tier" />}
                />
                <RadialBar dataKey="score" background />
              </RadialBarChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>

      <Section
        id="composed"
        title="조합"
        lede="shadcn 문서엔 없지만 Recharts ComposedChart 지원 확인."
      >
        <Columns>
          <Panel title="Composed" description="Bar + Line 혼합 1개">
            <ChartContainer
              id="gallery-composed"
              config={composedConfig}
              className="min-h-[240px] w-full"
            >
              <ComposedChart accessibilityLayer data={composedData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={4}
                  barSize={28}
                />
                <Line
                  dataKey="orders"
                  type="monotone"
                  stroke="var(--color-orders)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-orders)' }}
                />
              </ComposedChart>
            </ChartContainer>
          </Panel>
        </Columns>
      </Section>
    </Report>
  );
}
