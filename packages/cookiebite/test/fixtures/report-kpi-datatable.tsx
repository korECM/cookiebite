import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Section,
  Standfirst,
  KpiRow,
  DataTable,
  DataTableColumnHeader,
} from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

type Row = { channel: string; success_rate: number };

const columns: ColumnDef<Row>[] = [
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
  },
];

const data: Row[] = [
  { channel: 'card', success_rate: 99.1 },
  { channel: 'wallet', success_rate: 98.6 },
];

export default function App() {
  return (
    <Report title="KPI + DataTable e2e">
      <Standfirst>Build fixture for report data components.</Standfirst>
      <Section id="metrics" title="Metrics">
        <KpiRow
          items={[
            {
              label: 'Success rate',
              value: '99.2',
              unit: '%',
              delta: { value: '+3.1pp', direction: 'up' },
              caption: 'Post-rollback',
            },
          ]}
        />
        <DataTable columns={columns} data={data} />
      </Section>
    </Report>
  );
}
