import { Report, Standfirst, Section, Chart } from 'cookiebite';
import { persimmon, type ThemeDocument } from 'cookiebite/themes';

// surface: tonal — 컴파일러가 border/shadow면 --cb-surface=#FFFFFF로 두어
// bg-card + text-card-foreground 다크 대비가 깨진다 (deriveDarkSeed와 동일).
const darkTheme: ThemeDocument = {
  ...persimmon,
  dark: { background: '#111111', text: '#EDEDED', surface: 'tonal' },
};

export default (
  <Report theme={darkTheme} title="다크 테마 검증 리포트" lang="ko">
    <Standfirst kicker="verify dark pass" headline="다크 선언 테마 측정">
      cookiebite-theme JSON에 dark가 선언되면 verifier가 1280 다크 패스를 추가로 측정한다.
    </Standfirst>

    <Section title="차단 규칙별 건수">
      <Chart
        type="Bar Chart"
        data={[
          { rule: 'geo-block', count: 120 },
          { rule: 'rate-limit', count: 75 },
          { rule: 'ja4-block', count: 30 },
        ]}
        semanticTypes={{ rule: 'Category', count: 'Quantity' }}
        encodings={{ x: 'rule', y: 'count' }}
        ariaLabel="차단 규칙별 건수 막대 차트"
      />
    </Section>
  </Report>
);
