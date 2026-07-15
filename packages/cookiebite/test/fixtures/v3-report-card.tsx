import { Report, Section, Standfirst } from 'cookiebite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default function App() {
  return (
    <Report title="결제 성공률 리포트" kicker="주간">
      <Standfirst>배포 롤백 후 기준선을 회복했다.</Standfirst>
      <Section id="summary" title="요약">
        <Card>
          <CardHeader>
            <CardTitle>성공률</CardTitle>
          </CardHeader>
          <CardContent>99.2%</CardContent>
        </Card>
      </Section>
    </Report>
  );
}
