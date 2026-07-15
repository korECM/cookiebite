import { Report, Section, Chart } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default (
  <Report title="빈 ariaLabel 차트">
    <Section title="차단 규칙별 건수">
      <Chart
        type="Bar Chart"
        data={[
          { rule: 'geo-block', count: 120 },
          { rule: 'rate-limit', count: 75 },
          { rule: 'ja4-block', count: 30 },
        ]}
        semanticTypes={{ rule: 'Category', count: 'Quantity' }}
        encodings={{ x: 'rule', y: 'count' }}
        ariaLabel=""
      />
    </Section>
  </Report>
);
