import { Report, Section, Chart } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default (
  <Report title="비균질 차트">
    <Section title="누락 키">
      <Chart
        type="Bar Chart"
        data={[
          { rule: 'geo-block', count: 120 },
          { rule: 'rate-limit' },
        ]}
        semanticTypes={{ rule: 'Category', count: 'Quantity' }}
        encodings={{ x: 'rule', y: 'count' }}
        ariaLabel="비균질 행 차트"
      />
    </Section>
  </Report>
);
