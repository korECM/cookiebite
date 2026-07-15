import { Report, Section, Standfirst } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default (
  <Report title="controls off" controls={false}>
    <Standfirst headline="토글 없음">controls prop이 꺼지면 클러스터가 없다.</Standfirst>
    <Section title="본문">
      <p>본문만.</p>
    </Section>
  </Report>
);
