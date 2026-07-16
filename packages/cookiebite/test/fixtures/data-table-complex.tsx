import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Section,
  Standfirst,
  DataTable,
  DataTableColumnHeader,
} from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

type Row = {
  channel: string;
  transactions: number;
  successRate: number;
  mrr: number;
};

const data: Row[] = [
  { channel: 'card', transactions: 120, successRate: 99.1, mrr: 40 },
  { channel: 'wallet', transactions: 90, successRate: 98.6, mrr: 30 },
  { channel: 'bank', transactions: 40, successRate: 97.4, mrr: 20 },
];

const totalTx = data.reduce((s, r) => s + r.transactions, 0);
const totalMrr = data.reduce((s, r) => s + r.mrr, 0);

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'channel',
    header: '채널',
    footer: () => '합계',
  },
  {
    id: '거래',
    header: '거래',
    columns: [
      {
        accessorKey: 'transactions',
        header: ({ column }) => (
          <DataTableColumnHeader title="거래수" column={column} />
        ),
        footer: () => String(totalTx),
      },
      {
        accessorKey: 'successRate',
        header: '성공률',
        cell: ({ row }) => `${row.original.successRate}%`,
      },
    ],
  },
  {
    id: '수익',
    header: '수익',
    columns: [
      {
        accessorKey: 'mrr',
        header: ({ column }) => (
          <DataTableColumnHeader title="MRR" column={column} />
        ),
        footer: () => String(totalMrr),
      },
    ],
  },
];

export default function App() {
  return (
    <Report title="Complex DataTable fixture">
      <Standfirst>Grouped headers and footer totals.</Standfirst>
      <Section id="table" title="채널별 실적">
        <DataTable columns={columns} data={data} />
      </Section>
    </Report>
  );
}
