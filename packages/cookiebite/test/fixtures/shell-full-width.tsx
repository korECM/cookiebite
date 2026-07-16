import { Report, Section } from '../../src/v3.ts';

export const __theme = { seed: { accent: '#FA4D02' } };

export default function App() {
  return (
    <Report title="전체 너비" width="full">
      <Section id="main" title="본문">
        <p>가장자리까지 유동 너비.</p>
      </Section>
    </Report>
  );
}
