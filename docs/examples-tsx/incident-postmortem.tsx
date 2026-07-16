import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Page,
  Standfirst,
  Sources,
  KpiRow,
  Claims,
  Findings,
  Glossary,
  RangeDot,
  Tracker,
  DataTable,
  DataTableColumnHeader,
  Panel,
} from 'cookiebite';
import { sentry } from 'cookiebite/themes';

// legacy docs/examples/incident-postmortem.html 서사를 paged 레이아웃으로 이식
// 설정 오타 → 풀 고갈 → 체크아웃 타임아웃
export const __theme = sentry;

type TimelineRow = {
  time_utc: string;
  event: string;
  detail: string;
};

const timelineColumns: ColumnDef<TimelineRow>[] = [
  {
    accessorKey: 'time_utc',
    header: ({ column }) => (
      <DataTableColumnHeader title="시각 (UTC)" column={column} />
    ),
  },
  {
    accessorKey: 'event',
    header: ({ column }) => (
      <DataTableColumnHeader title="사건" column={column} />
    ),
  },
  {
    accessorKey: 'detail',
    header: ({ column }) => (
      <DataTableColumnHeader title="상세" column={column} />
    ),
  },
];

const timelineData: TimelineRow[] = [
  {
    time_utc: '09:12',
    event: 'v2.31 배포',
    detail: '새 커넥션 풀 설정이 전 API 파드에 실린다',
  },
  {
    time_utc: '09:20',
    event: 'p99가 1초를 넘김',
    detail: '배포 8분 만에 지연이 기준선 180ms에서 급등, 아직 알람 없음',
  },
  {
    time_utc: '09:34',
    event: 'PagerDuty 알람',
    detail: 'error_rate > 5% 임계 돌파, 배포 22분 뒤 온콜 호출',
  },
  {
    time_utc: '09:51',
    event: '근본 원인 확인',
    detail: '설정 diff에서 max-connections=10 발견, 풀 완전 포화',
  },
  {
    time_utc: '10:15',
    event: 'v2.30 롤백 시작',
    detail: '핫패치 대신 알려진 정상 상태로 되돌리기로 결정',
  },
  {
    time_utc: '10:48',
    event: '기준선 복구, 인시던트 종료',
    detail: '풀 100 복귀, 대기 해소, p99가 180ms로 안정',
  },
];

type ActionRow = {
  id: number;
  action: string;
  owner: string;
  due: string;
  status: string;
};

const actionColumns: ColumnDef<ActionRow>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader title="#" column={column} />
    ),
  },
  {
    accessorKey: 'action',
    header: ({ column }) => (
      <DataTableColumnHeader title="조치" column={column} />
    ),
  },
  {
    accessorKey: 'owner',
    header: ({ column }) => (
      <DataTableColumnHeader title="담당" column={column} />
    ),
  },
  {
    accessorKey: 'due',
    header: ({ column }) => (
      <DataTableColumnHeader title="마감" column={column} />
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader title="상태" column={column} />
    ),
  },
];

const actionData: ActionRow[] = [
  {
    id: 1,
    action: '풀 설정을 max-connections=100으로 복구',
    owner: 'SRE 온콜',
    due: '2026-06-10',
    status: '완료',
  },
  {
    id: 2,
    action: '풀 포화 알람 추가 (사용률 80% 초과)',
    owner: '플랫폼',
    due: '2026-06-17',
    status: '대기',
  },
  {
    id: 3,
    action: '배포에 설정 diff 리뷰 게이트 추가',
    owner: '인프라',
    due: '2026-06-24',
    status: '대기',
  },
  {
    id: 4,
    action: '스테이징에서 풀 변경 부하 테스트',
    owner: '플랫폼',
    due: '미정',
    status: '진행 중',
  },
];

// 09:00–11:00 UTC, 10분 블록. 배포 전 success → 장애 error → 롤백 warning → 복구 success
const timelineTracker = [
  { status: 'success' as const, label: '09:00 정상' },
  { status: 'success' as const, label: '09:10 정상' },
  { status: 'error' as const, label: '09:12 배포 · 풀 고갈 시작' },
  { status: 'error' as const, label: '09:20 p99 급등' },
  { status: 'error' as const, label: '09:30 알람 직전' },
  { status: 'error' as const, label: '09:40 온콜 대응' },
  { status: 'error' as const, label: '09:50 근본 원인 확인' },
  { status: 'warning' as const, label: '10:00 롤백 준비' },
  { status: 'warning' as const, label: '10:10 롤백 진행' },
  { status: 'warning' as const, label: '10:20 롤백 진행' },
  { status: 'warning' as const, label: '10:30 롤백 진행' },
  { status: 'success' as const, label: '10:40 지연 하강' },
  { status: 'success' as const, label: '10:48 기준선 복구' },
];

export default function App() {
  return (
    <Report
      layout="paged"
      title="API 지연 인시던트 포스트모템 (SEV-2)"
      kicker="SEV-2 포스트모템, 2026-06-10, 09:12~10:48 UTC, 1시간 36분, 복구됨"
    >
      <Standfirst>
        설정 오타 한 줄이 커넥션 풀을 굶겨 체크아웃을 무너뜨렸다. v2.31 배포가
        데이터베이스 커넥션 풀 최대 연결 수를 100에서 10으로 잘못 낮췄다. 평상
        트래픽에도 풀이 즉시 포화됐고, 요청이 줄을 서다 체크아웃 호출이
        타임아웃됐다. v2.30으로 롤백하자 지연은 기준선으로 돌아왔다.
      </Standfirst>

      <Page id="summary" title="요약">
        <KpiRow
          items={[
            {
              label: '지속 시간',
              value: 96,
              unit: '분',
              caption: '09:12 → 10:48 UTC, 감지까지 22분',
            },
            {
              label: 'p99 지연 정점',
              value: '4.2',
              unit: '초',
              delta: {
                value: '기준선 180ms의 23배',
                direction: 'up',
                good: false,
              },
            },
            {
              label: '추정 손실 주문',
              value: '$23K',
              delta: {
                value: '체크아웃 14% 타임아웃',
                direction: 'up',
                good: false,
              },
            },
            {
              label: '영향받은 사용자',
              value: '2,100',
              caption: '오류 또는 1초 초과 체크아웃 경험',
            },
          ]}
        />
        <Panel title="타임라인 상태" description="09:00–10:48 UTC, 10분 블록">
          <Tracker data={timelineTracker} />
        </Panel>
        <Findings
          items={[
            {
              severity: 'critical',
              title: '한 줄 오타가 큰 피해를 냈다',
              detail:
                '숫자 하나를 100에서 10으로 바꾼 변경이 전체 API를 무너뜨리고 약 $23K 주문을 잃게 했다. 작은 설정 수정도 저위험이 아니다.',
            },
            {
              severity: 'warning',
              title: '리소스 한도는 리뷰보다 가드레일이 낫다',
              detail:
                '코드 리뷰는 이 변경을 잡지 못했다. 한도 수정에는 diff 게이트, 포화 알람, 스테이징 부하 테스트 같은 기계 가드레일이 필요하다.',
            },
            {
              severity: 'info',
              title: '모니터링 알람이 22분 만에 울렸다',
              detail:
                '직접적인 풀 포화 알람은 없었지만 error_rate 모니터가 첫 신호를 냈다.',
            },
          ]}
        />
        <Glossary
          terms={[
            {
              term: '커넥션 풀',
              def: '요청들이 공유해 재사용하는 소수 데이터베이스 연결 묶음. 상한을 너무 낮게 잡으면 요청이 빈 연결을 기다리며 줄을 서고, 그 대기 시간이 곧 지연으로 드러난다.',
            },
          ]}
        />
      </Page>

      <Page id="timeline" title="타임라인">
        <p>
          모든 시각은 UTC다. 헤더를 눌러 정렬할 수 있다. 감지가 배포보다 22분
          늦었고 롤백이 해결책이었다.
        </p>
        <Panel title="사건 타임라인">
          <DataTable columns={timelineColumns} data={timelineData} />
        </Panel>
      </Page>

      <Page id="cause" title="원인 분석">
        <p>
          잘못 입력한 숫자 하나가 고객이 겪는 타임아웃으로 번졌다. 각 단계가
          다음을 낳았다.
        </p>
        <Claims
          items={[
            {
              text: '설정 오타가 풀 상한을 100에서 10으로 낮췄다',
              evidence: '의도치 않은 변경',
              badge: '근본 원인',
            },
            {
              text: '평상 트래픽만으로 풀이 즉시 포화됐다',
              badge: '연쇄',
            },
            {
              text: '요청이 빈 연결을 기다리며 대기 큐에 쌓였다',
              badge: '연쇄',
            },
            {
              text: '대기 시간이 요청 지연으로 드러나 p99가 4.2초까지 올랐다',
              evidence: '지연 곡선',
              badge: '영향',
            },
            {
              text: '쿼리를 세 번 쓰는 체크아웃이 가장 먼저 타임아웃됐다',
              evidence: '체크아웃 14% 실패',
              badge: '고객 영향',
            },
          ]}
        />
        <p className="text-sm text-muted-foreground">
          구간별 p99 지연 (ms). 막대는 관측 범위, 점은 해당 시각의 값이다.
        </p>
        <RangeDot
          domain={{ min: 0, max: 4500 }}
          items={[
            { label: '09:00 기준', min: 160, max: 200, value: 180, unit: 'ms' },
            { label: '09:20 SLO 돌파', min: 180, max: 1200, value: 1080, unit: 'ms' },
            { label: '09:51 정점', min: 2600, max: 4200, value: 4200, unit: 'ms' },
            { label: '10:48 복구', min: 170, max: 220, value: 185, unit: 'ms' },
          ]}
        />
      </Page>

      <Page id="actions" title="후속 조치">
        <p>설정 복구는 배포됐고, 재발을 막을 가드레일을 아래에 추적한다.</p>
        <Panel title="후속 조치">
          <DataTable columns={actionColumns} data={actionData} />
        </Panel>
        <Sources
          items={[
            {
              label: 'API 파드 접근 로그, PagerDuty 타임라인, 배포 파이프라인',
              note: '집계 기준 2026-06-10. 수치는 예시다.',
            },
          ]}
        />
      </Page>
    </Report>
  );
}
