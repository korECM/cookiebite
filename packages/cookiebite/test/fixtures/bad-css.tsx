import { Report, Section, registerCss } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

function BadCssProbe() {
  registerCss('bad-css', '.cb-bad { color: #FF0000; }');
  return <p className="cb-bad">색 리터럴 CSS</p>;
}

export default (
  <Report theme={persimmon} title="collected.css 색 리터럴">
    <Section title="프로브">
      <BadCssProbe />
    </Section>
  </Report>
);
