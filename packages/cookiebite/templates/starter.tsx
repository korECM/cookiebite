import { Report, Section, Standfirst, Sources } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

// 주장과 근거를 먼저 정리한다: 주장 한 개에서 세 개, 각 주장의 증거,
// 독자의 첫 질문. 섹션은 목록이 아니라 논증 순서로 배치한다.
export default (
  <Report theme={persimmon} title="리포트 제목">
    <Standfirst kicker="리포트 종류, 기간" headline="한 문장으로 요약한 결론">
      결론을 뒷받침하는 한두 문장. 독자의 첫 질문에 먼저 답한다.
    </Standfirst>

    <Section title="근거 1">
      <p>주장을 증거로 잇는 본문. 색이 필요하면 var(--cb-accent)처럼 테마 토큰만 쓴다.</p>
    </Section>

    <Section title="근거 2">
      <p>두 번째 근거.</p>
    </Section>

    <Sources>출처, 방법, 집계 기준</Sources>
  </Report>
);
