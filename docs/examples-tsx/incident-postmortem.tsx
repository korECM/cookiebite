import {
  Report,
  Standfirst,
  Section,
  Sources,
  KpiRow,
  Claims,
  Findings,
  Chart,
  Table,
  Glossary,
} from 'cookiebite';
import { sentry } from 'cookiebite/themes';

// legacy docs/examples/incident-postmortem.html을 TSX 관용구로 다시 쓴 리포트.
// 마크업 이식이 아니라 서사(설정 오타 → 풀 고갈 → 체크아웃 타임아웃)를
// KPI, 근거 앵커, 발견, 차트, 정렬 표로 재구성한다.
export default (
  <Report theme={sentry} title="API 지연 인시던트 포스트모템 (SEV-2)" lang="ko">
    <Standfirst
      kicker="SEV-2 포스트모템, 2026-06-10, 09:12~10:48 UTC, 1시간 36분, 복구됨"
      headline="설정 오타 한 줄이 커넥션 풀을 굶겨 체크아웃을 무너뜨렸다"
    >
      v2.31 배포가 데이터베이스{' '}
      <Glossary
        term="커넥션 풀"
        definition="요청들이 공유해 재사용하는 소수 데이터베이스 연결 묶음. 상한을 너무 낮게 잡으면 요청이 빈 연결을 기다리며 줄을 서고, 그 대기 시간이 곧 지연으로 드러난다."
      />{' '}
      최대 연결 수를 100에서 10으로 잘못 낮췄다. 평상 트래픽에도 풀이 즉시 포화됐고, 요청이 줄을 서다 체크아웃 호출이 타임아웃됐다. v2.30으로 롤백하자 지연은 기준선으로 돌아왔다.
    </Standfirst>

    <Section title="영향">
      <KpiRow
        items={[
          {
            label: '지속 시간',
            value: 96,
            unit: '분',
            note: '09:12 → 10:48 UTC, 감지까지 22분',
          },
          {
            label: 'p99 지연 정점',
            value: '4.2',
            unit: '초',
            delta: { dir: 'up', text: '기준선 180ms의 23배', tone: 'critical' },
          },
          {
            label: '추정 손실 주문',
            value: '$23K',
            delta: { dir: 'up', text: '체크아웃 14% 타임아웃', tone: 'critical' },
          },
          {
            label: '영향받은 사용자',
            value: '2,100',
            note: '오류 또는 1초 초과 체크아웃 경험',
          },
        ]}
      />
      <Claims
        title="영향은 체크아웃에 집중됐다"
        items={[
          {
            claim: '체크아웃은 요청당 쿼리를 세 번 실행해 굶은 풀을 가장 먼저 소진했다',
            evidence: '#cause',
            value: '실패 14%',
            tone: 'critical',
          },
          {
            claim: '지연 급등은 배포 8분 만에 1초 SLO를 넘겼다',
            evidence: '#latency',
            value: 'p99 4.2초',
            tone: 'warning',
          },
        ]}
      />
    </Section>

    <Section id="timeline" title="타임라인">
      <Table
        sortable
        caption="모든 시각 UTC. 헤더를 눌러 정렬할 수 있다. 감지가 배포보다 22분 늦었고 롤백이 해결책이었다."
        columns={[
          { header: '시각 (UTC)' },
          { header: '사건' },
          { header: '상세' },
        ]}
        rows={[
          ['09:12', 'v2.31 배포', '새 커넥션 풀 설정이 전 API 파드에 실린다'],
          ['09:20', 'p99가 1초를 넘김', '배포 8분 만에 지연이 기준선 180ms에서 급등, 아직 알람 없음'],
          ['09:34', 'PagerDuty 알람', 'error_rate > 5% 임계 돌파, 배포 22분 뒤 온콜 호출'],
          ['09:51', '근본 원인 확인', '설정 diff에서 max-connections=10 발견, 풀 완전 포화'],
          ['10:15', 'v2.30 롤백 시작', '핫패치 대신 알려진 정상 상태로 되돌리기로 결정'],
          ['10:48', '기준선 복구, 인시던트 종료', '풀 100 복귀, 대기 해소, p99가 180ms로 안정'],
        ]}
      />
    </Section>

    <Section id="latency" title="지연 곡선">
      <p>
        p99는 09:12 배포 직후 급등해 09:20에 1초 SLO를 넘겼고, 10:15 롤백 뒤에야 180ms 기준선으로 내려왔다.
      </p>
      <Chart
        type="Line Chart"
        data={[
          { time: '09:00', p99: 180 },
          { time: '09:12', p99: 195 },
          { time: '09:20', p99: 1080 },
          { time: '09:34', p99: 2600 },
          { time: '09:51', p99: 4200 },
          { time: '10:05', p99: 4150 },
          { time: '10:15', p99: 3800 },
          { time: '10:30', p99: 1500 },
          { time: '10:40', p99: 520 },
          { time: '10:48', p99: 185 },
          { time: '11:00', p99: 180 },
        ]}
        semanticTypes={{ time: 'Category', p99: 'Quantity' }}
        encodings={{ x: 'time', y: 'p99' }}
        ariaLabel="인시던트 구간 p99 지연 곡선"
        height={340}
      />
    </Section>

    <Section id="cause" title="근본 원인: 인과 사슬">
      <p>잘못 입력한 숫자 하나가 고객이 겪는 타임아웃으로 번졌다. 각 단계가 다음을 낳았다.</p>
      <Claims
        items={[
          {
            claim: '1. 설정 오타가 풀 상한을 100에서 10으로 낮췄다',
            value: '의도치 않은 변경',
            tone: 'critical',
          },
          {
            claim: '2. 평상 트래픽만으로 풀이 즉시 포화됐다',
            tone: 'warning',
          },
          {
            claim: '3. 요청이 빈 연결을 기다리며 대기 큐에 쌓였다',
            tone: 'warning',
          },
          {
            claim: '4. 대기 시간이 요청 지연으로 드러나 p99가 4.2초까지 올랐다',
            evidence: '#latency',
            tone: 'warning',
          },
          {
            claim: '5. 쿼리를 세 번 쓰는 체크아웃이 가장 먼저 타임아웃됐다',
            value: '체크아웃 14% 실패',
            tone: 'critical',
          },
        ]}
      />
    </Section>

    <Section id="actions" title="조치 항목">
      <p>설정 복구는 배포됐고, 재발을 막을 가드레일을 아래에 추적한다.</p>
      <Table
        sortable
        caption="담당과 마감으로 정렬할 수 있다"
        columns={[
          { header: '#', numeric: true },
          { header: '조치' },
          { header: '담당' },
          { header: '마감' },
          { header: '상태' },
        ]}
        rows={[
          [1, '풀 설정을 max-connections=100으로 복구', 'SRE 온콜', '2026-06-10', '완료'],
          [2, '풀 포화 알람 추가 (사용률 80% 초과)', '플랫폼', '2026-06-17', '대기'],
          [3, '배포에 설정 diff 리뷰 게이트 추가', '인프라', '2026-06-24', '대기'],
          [4, '스테이징에서 풀 변경 부하 테스트', '플랫폼', '미정', '진행 중'],
        ]}
      />
    </Section>

    <Section title="교훈">
      <Findings
        items={[
          {
            tone: 'critical',
            title: '한 줄 오타가 큰 피해를 냈다',
            note: '숫자 하나를 100에서 10으로 바꾼 변경이 전체 API를 무너뜨리고 약 $23K 주문을 잃게 했다. 작은 설정 수정도 저위험이 아니다.',
          },
          {
            tone: 'warning',
            title: '리소스 한도는 리뷰보다 가드레일이 낫다',
            note: '코드 리뷰는 이 변경을 잡지 못했다. 한도 수정에는 diff 게이트, 포화 알람, 스테이징 부하 테스트 같은 기계 가드레일이 필요하다.',
          },
          {
            tone: 'success',
            title: '모니터링 알람이 22분 만에 울렸다',
            label: '잘된 점',
            note: '직접적인 풀 포화 알람은 없었지만 error_rate 모니터가 첫 신호를 냈다.',
          },
        ]}
      />
    </Section>

    <Sources>집계 기준: API 파드 접근 로그, PagerDuty 타임라인, 배포 파이프라인 (2026-06-10). 수치는 예시다.</Sources>
  </Report>
);
