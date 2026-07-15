import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Section,
  Standfirst,
  Sources,
  KpiRow,
  DataTable,
  DataTableColumnHeader,
} from 'cookiebite';
import { persimmon } from 'cookiebite/themes';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

// 테마는 export const __theme 로 빌드가 읽는다 — Report theme prop 과 같은 객체를 쓴다
export const __theme = persimmon;

// 차트 config 키는 영어, label 만 한글 — 색은 var(--chart-N) 만
const chartConfig = {
  count: { label: '건수', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const chartData = [
  { rule: 'geo', count: 120 },
  { rule: 'rate', count: 75 },
  { rule: 'ja4', count: 30 },
];

type Row = { channel: string; success_rate: number };

// DataTable 컬럼: accessorKey 영어, header 한글
const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'channel',
    header: ({ column }) => (
      <DataTableColumnHeader title="채널" column={column} />
    ),
  },
  {
    accessorKey: 'success_rate',
    header: ({ column }) => (
      <DataTableColumnHeader title="성공률" column={column} />
    ),
    cell: ({ row }) => `${row.getValue('success_rate')}%`,
  },
];

const tableData: Row[] = [
  { channel: 'card', success_rate: 99.1 },
  { channel: 'wallet', success_rate: 98.6 },
  { channel: 'bank', success_rate: 97.4 },
];

export default function App() {
  return (
    <Report theme={persimmon} title="리포트 제목" kicker="리포트 종류, 기간">
      <Standfirst>
        결론을 뒷받침하는 한두 문장. 독자의 첫 질문에 먼저 답한다.
      </Standfirst>

      {/* KPI 는 KpiRow 한 줄 — delta.good 으로 상승이 나쁜 지표를 표시한다 */}
      <Section id="metrics" title="핵심 지표">
        <KpiRow
          items={[
            {
              label: '성공률',
              value: '99.2',
              unit: '%',
              delta: { value: '+3.1pp', direction: 'up', good: true },
              caption: '롤백 이후',
            },
            {
              label: '중복 청구',
              value: 12,
              unit: '건',
              delta: { value: '-88%', direction: 'down', good: true },
            },
          ]}
        />
      </Section>

      {/* shadcn ChartContainer + Recharts — fill 은 var(--color-KEY) */}
      <Section id="breakdown" title="규칙별 차단">
        <Card>
          <CardHeader>
            <CardTitle>차단 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              id="starter-bars"
              config={chartConfig}
              className="min-h-[220px] w-full"
            >
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="rule"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </Section>

      {/* 정렬 가능한 표 — ColumnDef + DataTableColumnHeader */}
      <Section id="channels" title="채널별 실적">
        <DataTable columns={columns} data={tableData} />
      </Section>

      <Sources
        items={[{ label: '출처', note: '방법과 집계 기준을 적는다' }]}
      />
    </Report>
  );
}
