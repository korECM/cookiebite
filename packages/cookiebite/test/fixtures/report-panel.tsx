import { Report, Section, Standfirst, Panel } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default function App() {
  return (
    <Report title="Panel fixture" controls={false} toc={false}>
      <Standfirst>Panel structure check.</Standfirst>
      <Section id="panel" title="Panel">
        <Panel title="Revenue mix" description="Inbound share this week">
          <p className="panel-body-marker">panel-body-marker</p>
        </Panel>
      </Section>
    </Report>
  );
}
