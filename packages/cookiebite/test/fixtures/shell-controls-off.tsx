import { Report, Section } from '../../src/v3.ts';

export default function App() {
  return (
    <Report title="Controls Off" controls={false} toc={false}>
      <Section id="only" title="Only Section">
        <p>body</p>
      </Section>
    </Report>
  );
}
