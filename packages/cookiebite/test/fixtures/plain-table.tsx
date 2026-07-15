import { Report, Section, Table } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default (
  <Report title="채널별 건수">
    <Section title="채널별 건수">
      <Table
        columns={[{ header: '채널' }, { header: '건수', numeric: true }]}
        rows={[
          ['카드', 1280],
          ['계좌이체', 640],
        ]}
        caption="정렬 없이 표시하는 표"
      />
    </Section>
  </Report>
);
