import { Report, Section, Standfirst, Columns, Panel } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default function App() {
  return (
    <Report title="Columns fixture" controls={false} toc={false}>
      <Standfirst>Columns grid check.</Standfirst>
      <Section id="cols" title="Side by side">
        <Columns>
          <Panel title="Left">
            <p className="columns-left-marker">columns-left-marker</p>
          </Panel>
          <Panel title="Right">
            <p className="columns-right-marker">columns-right-marker</p>
          </Panel>
        </Columns>
      </Section>
    </Report>
  );
}
