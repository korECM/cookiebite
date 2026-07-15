import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Section,
  Standfirst,
  KpiRow,
  Claims,
  Findings,
  Matrix,
  RangeDot,
  DataTable,
  DataTableColumnHeader,
} from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

type ChannelRow = {
  channel: string;
  success_rate: number;
  volume: number;
};

const channelColumns: ColumnDef<ChannelRow>[] = [
  {
    accessorKey: 'channel',
    header: ({ column }) => (
      <DataTableColumnHeader title="Channel" column={column} />
    ),
  },
  {
    accessorKey: 'success_rate',
    header: ({ column }) => (
      <DataTableColumnHeader title="Success rate" column={column} />
    ),
    cell: ({ row }) => `${row.getValue('success_rate')}%`,
  },
  {
    accessorKey: 'volume',
    header: ({ column }) => (
      <DataTableColumnHeader title="Volume" column={column} />
    ),
  },
];

const channelData: ChannelRow[] = [
  { channel: 'card', success_rate: 99.1, volume: 12040 },
  { channel: 'bank_transfer', success_rate: 97.4, volume: 3820 },
  { channel: 'wallet', success_rate: 98.6, volume: 9012 },
];

export default function App() {
  return (
    <Report title="결제 성공률 주간 리포트" kicker="주간 리포트">
      <Standfirst>배포 롤백 이틀 만에 기준선을 되찾았다.</Standfirst>

      <Section id="kpis" title="지표">
        <KpiRow
          items={[
            {
              label: 'Success rate',
              value: '99.2',
              unit: '%',
              delta: { value: '+3.1pp', direction: 'up' },
              caption: 'Recovered after rollback',
            },
            {
              label: 'Duplicate charges',
              value: 12,
              unit: '건',
              delta: { value: '-88%', direction: 'down', good: true },
            },
            {
              label: 'Refund backlog',
              value: '3.4',
              unit: '만원',
              delta: { value: '+12%', direction: 'up', good: false },
              caption: 'Still elevated',
            },
          ]}
        />
      </Section>

      <Section id="claims" title="핵심 주장">
        <Claims
          items={[
            {
              text: 'Retry loop caused duplicate charges',
              evidence: 'pay-gateway retry queue logs',
              badge: 'confirmed',
            },
            {
              text: 'Rollback restored baseline success rate',
              evidence: 'hourly success_rate series',
            },
          ]}
        />
      </Section>

      <Section id="findings" title="발견">
        <Findings
          items={[
            {
              severity: 'critical',
              title: 'Retry queue does not await approval',
              detail: 'Timeout re-approves the same order.',
            },
            {
              severity: 'warning',
              title: 'Refund batch runs overnight only',
              detail: 'Daytime refunds accumulate.',
            },
            {
              severity: 'info',
              title: 'Alert fired within five minutes',
            },
          ]}
        />
      </Section>

      <Section id="matrix" title="채널 커버리지">
        <Matrix
          cols={['card', 'bank', 'wallet']}
          rows={[
            { label: 'Retry guard', cells: [true, true, false] },
            { label: 'Idempotency', cells: [true, false, true] },
            { label: 'Owner', cells: ['payments', 'treasury', 'growth'] },
          ]}
          caption="Coverage by payment channel"
        />
      </Section>

      <Section id="latency" title="응답 시간">
        <RangeDot
          domain={{ min: 0, max: 1000 }}
          items={[
            { label: 'approve_api', min: 80, max: 420, value: 500, unit: 'ms' },
            { label: 'retry_queue', min: 120, max: 980, value: 640, unit: 'ms' },
          ]}
        />
      </Section>

      <Section id="table" title="채널별 실적">
        <DataTable columns={channelColumns} data={channelData} />
      </Section>
    </Report>
  );
}
