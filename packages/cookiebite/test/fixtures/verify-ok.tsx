import { Report, Section, Standfirst, KpiRow } from 'cookiebite';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { persimmon } from 'cookiebite/themes';
import { Bar, BarChart, XAxis } from 'recharts';

export const __theme = persimmon;

const chartConfig = {
  count: { label: 'Count', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const chartData = [
  { rule: 'geo', count: 120 },
  { rule: 'rate', count: 75 },
  { rule: 'ja4', count: 30 },
];

export default function App() {
  return (
    <Report title="Verify ok fixture" kicker="Task 10">
      <Standfirst>Hydration, KPI, and Recharts bar chart for the verify gate.</Standfirst>
      <Section id="metrics" title="Metrics">
        <KpiRow
          items={[
            {
              label: 'Success rate',
              value: '99.2',
              unit: '%',
              delta: { value: '+3.1pp', direction: 'up', good: true },
              caption: 'Post-rollback',
            },
          ]}
        />
        <ChartContainer id="verify-bars" config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <XAxis dataKey="rule" tickLine={false} axisLine={false} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Section>
    </Report>
  );
}
