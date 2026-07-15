import { Report, Standfirst, Section } from 'cookiebite';
import { Card, CardContent } from '@/components/ui/card';
import { persimmon, type ThemeDocument } from 'cookiebite/themes';

const darkTheme: ThemeDocument = {
  ...persimmon,
  dark: { background: '#111111', text: '#EDEDED', surface: 'tonal' },
};

export const __theme = darkTheme;

export default function App() {
  return (
    <Report title="다크 테마 검증 리포트" kicker="verify dark pass">
      <Standfirst>다크 선언 테마 측정용 픽스처.</Standfirst>
      <Section id="summary" title="요약">
        <Card>
          <CardContent>다크 패스 확인</CardContent>
        </Card>
      </Section>
    </Report>
  );
}
