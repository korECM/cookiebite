import { Report, Section, registerCall, registerCss } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

function Probe() {
  registerCall({ capability: 'table', hostId: 'probe-table', options: { numericColumns: [1] } });
  registerCss('probe', '.cb-probe { color: var(--cb-text-muted); }');
  registerCss('probe', '.cb-probe { color: SHOULD-BE-DEDUPED; }');
  return <p className="cb-probe">probe</p>;
}

export default (
  <Report theme={persimmon} title="수집기 프로브">
    <Section title="프로브">
      <Probe />
    </Section>
  </Report>
);
