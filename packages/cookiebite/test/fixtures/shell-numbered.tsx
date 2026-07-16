import { Report, Section, Standfirst } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default function App() {
  return (
    <Report
      title="Numbered fixture"
      kicker="테스트"
      numbered
      controls={false}
    >
      <Standfirst>Numbered section headings and TOC.</Standfirst>
      <Section id="alpha" title="알파">
        <p>first body</p>
      </Section>
      <Section id="beta" title="베타">
        <p>second body</p>
      </Section>
    </Report>
  );
}
