import {
  Report,
  Section,
  Standfirst,
  Sources,
  Glossary,
} from '../../src/v3.ts';

export const __theme = { seed: { accent: '#FA4D02' } };

export default function App() {
  return (
    <Report
      title="결제 성공률 회복"
      kicker="주간 리포트"
    >
      <Standfirst>
        배포 롤백 이후 이틀 만에 기준선 성공률을 회복했다.
      </Standfirst>
      <Section id="cause" title="원인" lede="재시도 로직이 중복 승인을 만들었다.">
        <p>7월 8일 배포에 포함된 재시도 경로가 원인이다.</p>
      </Section>
      <Section id="next-steps" title="다음 단계">
        <p>재시도 상한을 낮추고 모니터링 알림을 추가한다.</p>
      </Section>
      <Sources
        items={[
          { label: 'pay-gateway logs', href: '#cause', note: '2026-07-06 ~ 07-12' },
          { label: 'incident ticket INC-442' },
        ]}
      />
      <Glossary
        terms={[
          { term: 'success_rate', def: '승인 건수 / 시도 건수' },
          { term: 'retry_cap', def: '단일 결제 요청의 최대 재시도 횟수' },
        ]}
      />
    </Report>
  );
}
