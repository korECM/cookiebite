import { Report, Section } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

// A deliberate horizontal-overflow violation the token lint cannot catch: the
// width uses no color literal, so the build passes, but the report scrolls
// sideways at every viewport. The verifier must flag this at runtime as a hard
// horizontal-overflow finding.
export default (
  <Report theme={persimmon} title="오버플로우 위반 픽스처">
    <Section title="가로 스크롤을 만드는 블록">
      <pre style={{ width: '200vw' }}>
        이 블록은 뷰포트 두 배 너비라 문서가 가로로 스크롤된다.
      </pre>
    </Section>
  </Report>
);
