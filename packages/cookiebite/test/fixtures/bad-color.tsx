import { Report, Section } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export default (
  <Report theme={persimmon} title="색 리터럴 위반">
    <Section title="다이어그램">
      <svg viewBox="0 0 10 10" role="img" aria-label="예시">
        <rect width="10" height="10" fill="#FF0000" />
      </svg>
    </Section>
  </Report>
);
