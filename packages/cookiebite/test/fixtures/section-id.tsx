import { Report, Section } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default (
  <Report title="Section id 앵커">
    <Section id="cause" title="원인">
      <p>재시도 로직이 중복 승인을 만들었다.</p>
    </Section>
  </Report>
);
