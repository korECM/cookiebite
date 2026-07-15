// 의도적 타입 에러 픽스처 — typecheck 실패 경로 테스트용
import { Report, Section } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default function App() {
  return (
    // title에 number를 넘긴다 — typecheck가 잡아야 한다
    <Report theme={persimmon} title={42}>
      <Section id="a" title="근거">
        <p>본문</p>
      </Section>
    </Report>
  );
}
