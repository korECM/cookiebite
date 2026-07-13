import { Report, Section, Chart } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export default (
  <Report theme={persimmon} title="차단 규칙 차트">
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
        ariaLabel="차단 규칙별 건수 막대 차트"
      />
    </Section>
  </Report>
);
