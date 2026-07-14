import { Report, Section } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export default (
  <Report theme={persimmon} title="임의값 색 유틸 위반">
    <Section title="배경">
      <div className="bg-[#ff0000]">x</div>
    </Section>
  </Report>
);
