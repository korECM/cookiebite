import { Report, Section, Standfirst, Sources } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

// Interim starter (Task 7): Report + Section shell only.
// Task 11 replaces this with the full v3 template.
export const __theme = persimmon;

export default function App() {
  return (
    <Report theme={persimmon} title="리포트 제목" kicker="리포트 종류, 기간">
      <Standfirst>
        결론을 뒷받침하는 한두 문장. 독자의 첫 질문에 먼저 답한다.
      </Standfirst>

      <Section id="evidence-1" title="근거 1">
        <p>주장을 증거로 잇는 본문. 색이 필요하면 테마 시맨틱 클래스만 쓴다.</p>
      </Section>

      <Section id="evidence-2" title="근거 2">
        <p>두 번째 근거.</p>
      </Section>

      <Sources items={[{ label: '출처, 방법, 집계 기준' }]} />
    </Report>
  );
}
