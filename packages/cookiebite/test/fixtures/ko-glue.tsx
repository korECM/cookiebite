import { Report, Section, Sources } from '../../src/v3.ts';

export const __theme = { seed: { accent: '#FA4D02' } };

export default function App() {
  return (
    <Report title="한국어 조사 글루" kicker="타이포그래피">
      <Section id="glue" title="줄바꿈 처리" lede="조사가 줄 머리로 떨어지지 않게 붙인다.">
        <p>본문 산문은 soft wrap에 맡긴다.</p>
      </Section>
      <Sources
        items={[
          {
            label:
              'trace.grpc.server.hits — 호출자 분해(reception, devplay-admin-server)와 result:error 집계',
          },
          { label: 'incident ticket INC-442' },
        ]}
      />
    </Report>
  );
}
