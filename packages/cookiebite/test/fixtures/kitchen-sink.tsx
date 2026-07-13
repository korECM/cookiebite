import {
  Report,
  Standfirst,
  Section,
  Sources,
  KpiRow,
  Claims,
  Findings,
  Matrix,
  RangeDot,
  Table,
  Glossary,
} from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export default (
  <Report theme={persimmon} title="결제 성공률 주간 리포트" lang="ko">
    <Standfirst kicker="주간 리포트, 2026-07-06 ~ 07-12" headline="결제 성공률 99.2%로 회복">
      7월 8일 배포를 롤백한 뒤 이틀 만에 기준선을 되찾았다. 재시도 로직이 만든{' '}
      <Glossary
        term="중복 승인"
        definition="같은 주문에 대해 결제 게이트웨이가 두 번 이상 승인을 내려 금액이 이중으로 청구되는 상태."
      />{' '}
      건수도 빠르게 줄었다.
    </Standfirst>

    <Section title="이번 주 지표">
      <KpiRow
        items={[
          {
            label: '결제 성공률',
            value: '99.2',
            unit: '%',
            delta: { dir: 'up', text: '지난주 대비 3.1%p', tone: 'success' },
            note: '롤백 직후 회복',
          },
          {
            label: '중복 승인 건수',
            value: 12,
            unit: '건',
            delta: { dir: 'down', text: '어제 대비 88% 감소', tone: 'neutral' },
          },
          {
            label: '환불 대기',
            value: '3.4',
            unit: '만원',
            delta: { dir: 'flat', text: '변동 없음', tone: 'neutral' },
          },
        ]}
      />
    </Section>

    <Section title="핵심 주장">
      <Claims
        title="이번 주 우리가 확인한 사실"
        items={[
          {
            claim: '재시도 로직이 중복 승인을 만들었다',
            evidence: 'https://logs.example.com/pay-gateway/retry',
            value: '중복 12건',
            tone: 'critical',
          },
          {
            claim: '롤백 후 성공률이 기준선으로 복귀했다',
            value: '99.2%',
            tone: 'success',
          },
          {
            claim: '환불 자동화는 예정대로 진행 중이다',
            tone: 'info',
          },
        ]}
      />
    </Section>

    <Section title="발견">
      <Findings
        items={[
          {
            tone: 'critical',
            title: '재시도 큐가 승인 응답을 기다리지 않는다',
            where: 'pay-gateway/retry.ts:88',
            note: '타임아웃 시 같은 주문을 다시 승인한다.',
          },
          {
            tone: 'warning',
            title: '환불 배치가 야간에만 돈다',
            where: 'refund-worker',
            note: '낮 시간 대기 환불이 쌓인다.',
          },
          {
            tone: 'success',
            title: '모니터링 알람이 5분 안에 울렸다',
            label: '잘된 점',
          },
        ]}
      />
    </Section>

    <Section title="채널별 요일 실패율">
      <Matrix
        rows={['카드', '계좌이체', '간편결제']}
        cols={['월', '화', '수']}
        data={[
          [12, 18, 9],
          [22, 41, 15],
          [8, 11, 62],
        ]}
        max={100}
        format={(v) => `${v}%`}
        ariaLabel="채널별 요일 실패율"
        caption="간편결제 수요일 실패율이 특히 높다"
      />
    </Section>

    <Section title="응답 시간 분포">
      <RangeDot
        rows={[
          { label: '승인 API', min: 80, max: 420, value: 190 },
          { label: '재시도 큐', min: 120, max: 980, value: 640 },
          { label: '환불 워커', min: 200, max: 760, value: 410 },
        ]}
        domain={[0, 1000]}
        format={(v) => String(v)}
        unit="ms"
        ariaLabel="서비스별 응답 시간 범위와 중앙값"
      />
    </Section>

    <Section title="채널별 거래량">
      <Table
        sortable
        caption="헤더를 눌러 정렬할 수 있다"
        columns={[
          { header: '채널' },
          { header: '거래 건수', numeric: true },
          { header: '성공률' },
        ]}
        rows={[
          ['카드', 12840, '99.4%'],
          ['계좌이체', 6420, '98.9%'],
          ['간편결제', 9150, '97.1%'],
          ['포인트', 2100, '99.8%'],
        ]}
      />
    </Section>

    <Sources>집계 기준: pay-gateway 로그, 환불 워커 메트릭 (2026-07-06 ~ 07-12)</Sources>
  </Report>
);
