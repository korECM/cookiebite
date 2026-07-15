import { Report, Section, Standfirst, Sources } from 'cookiebite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default function App() {
  return (
    <Report title="결제 성공률 주간 리포트" kicker="주간 리포트, 2026-07-06 ~ 07-12">
      <Standfirst>
        7월 8일 배포를 롤백한 뒤 이틀 만에 기준선을 되찾았다. 재시도 로직이 만든 중복
        승인 건수도 빠르게 줄었다.
      </Standfirst>

      <Section id="kpis" title="이번 주 지표">
        <Card>
          <CardHeader>
            <CardTitle>결제 성공률</CardTitle>
          </CardHeader>
          <CardContent>99.2%</CardContent>
        </Card>
      </Section>

      <Section id="detail" title="상세">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>metric</TableHead>
              <TableHead>value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>success_rate</TableCell>
              <TableCell>99.2%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>duplicate_auth</TableCell>
              <TableCell>12</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Sources
        items={[
          { label: 'pay-gateway logs', note: '2026-07-06 ~ 07-12' },
          { label: 'incident ticket INC-442' },
        ]}
      />
    </Report>
  );
}
