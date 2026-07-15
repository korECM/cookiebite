import { Report, Standfirst, Glossary } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default (
  <Report title="빈 Glossary 정의">
    <Standfirst headline="정의가 비어 있으면 빌드가 실패해야 한다">
      <Glossary term="중복 승인" definition="   " />
    </Standfirst>
  </Report>
);
