import { Report, Section, Standfirst, Sources } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export default (
  <Report theme={persimmon} title="결제 성공률 리포트">
    <Standfirst kicker="주간 리포트" headline="결제 성공률 99.2%로 회복">
      배포 롤백 후 이틀 만에 기준선을 되찾았다.
    </Standfirst>
    <Section title="원인">
      <p>7월 8일 배포에 포함된 재시도 로직이 중복 승인을 만들었다.</p>
    </Section>
    <Sources>집계 기준: pay-gateway 로그, 2026-07-06 ~ 07-12</Sources>
  </Report>
);
