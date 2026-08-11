import type { ColumnDef } from '@tanstack/react-table';
import {
  Report,
  Standfirst,
  Section,
  Sources,
  Prose,
  Verdict,
  Aside,
  Steps,
  KpiRow,
  Panel,
  DataTable,
  DataTableColumnHeader,
  Claims,
} from 'cookiebite';
import { neutral } from 'cookiebite/themes';

export const __theme = neutral;

const numericMeta = { className: 'text-right tabular-nums' } as const;

type UtilRow = {
  workload: string;
  request: string;
  avg: string;
  max: string;
  utilization: string;
};

const utilRows: UtilRow[] = [
  { workload: 'kube-system / proxy', request: '100m', avg: '0.4m', max: '41.7m', utilization: '0.4%' },
  { workload: 'mesh / control-plane', request: '1000m', avg: '6.9m', max: '1954m', utilization: '0.7%' },
  { workload: 'mesh / ingress ×2', request: '1000m', avg: '13.1m', max: '707m', utilization: '1.3%' },
  { workload: 'mesh / sidecar ×98', request: '100m', avg: '3.3m', max: '2233m', utilization: '3.3%' },
  { workload: 'logging / shipper ×15', request: '250m', avg: '13.9m', max: '1534m', utilization: '5.6%' },
  { workload: 'telemetry / collector ×15', request: '300m', avg: '111.6m', max: '988m', utilization: '37%' },
];

const utilColumns: ColumnDef<UtilRow>[] = [
  {
    accessorKey: 'workload',
    header: ({ column }) => <DataTableColumnHeader title="워크로드" column={column} />,
  },
  {
    accessorKey: 'request',
    header: ({ column }) => <DataTableColumnHeader title="request" column={column} />,
    meta: numericMeta,
  },
  {
    accessorKey: 'avg',
    header: ({ column }) => <DataTableColumnHeader title="30일 avg" column={column} />,
    meta: numericMeta,
  },
  {
    accessorKey: 'max',
    header: ({ column }) => <DataTableColumnHeader title="30일 max" column={column} />,
    meta: numericMeta,
  },
  {
    accessorKey: 'utilization',
    header: ({ column }) => <DataTableColumnHeader title="활용률" column={column} />,
    meta: numericMeta,
  },
];

type FactorRow = { item: string; value: string; meaning: string };

const factorRows: FactorRow[] = [
  { item: '노드 1대 allocatable', value: '3.92 cores', meaning: '스케줄러에 내주는 CPU' },
  { item: '− DaemonSet 고정 점유', value: '0.87 cores', meaning: '노드가 늘 때 같이 느는 몫' },
  { item: '= 앱이 쓸 수 있는 몫', value: '3.05 cores', meaning: '실질 가용분' },
  { item: 'CPU 1 core 절감', value: '월 $54', meaning: 'CPU가 병목인 동안만 유효' },
  { item: '메모리 1 GiB 절감', value: '월 $0', meaning: '병목 아님. 하한 도달 후 $11' },
];

const factorColumns: ColumnDef<FactorRow>[] = [
  {
    accessorKey: 'item',
    header: ({ column }) => <DataTableColumnHeader title="항목" column={column} />,
  },
  {
    accessorKey: 'value',
    header: ({ column }) => <DataTableColumnHeader title="값" column={column} />,
    meta: numericMeta,
  },
  { accessorKey: 'meaning', header: '의미' },
];

export default function App() {
  return (
    <Report
      title="예약한 CPU의 9%만 쓰고 있다"
      kicker="클러스터 rightsizing 검토, 스테이징 환경, 2026-08"
      numbered
    >
      <Standfirst>
        노드 15대가 CPU 41.8 cores를 예약해두고 평상시 3.9 cores를 쓴다. 남은 몫의 대부분은 애플리케이션이 아니라 플랫폼 계층이 잡고 있다. 30일 관측과 클러스터 실측으로 확인한 뒤, 각 권고를 반증하고 살아남은 것만 남겼다.
      </Standfirst>

      <Section id="waste" title="낭비는 앱이 아니라 플랫폼 계층에 있다">
        <Prose>
          <p>비용 검토는 보통 "무엇을 얼마나 줄일까"로 시작하지만, 그 전에 답해야 할 질문이 하나 있다. 무엇을 줄여야 노드가 실제로 줄어드는가. 예약량을 아무리 깎아도 스케줄러가 노드를 회수하지 않으면 청구서는 그대로다.</p>
        </Prose>
        <KpiRow
          items={[
            {
              label: 'CPU 활용률',
              value: '9',
              unit: '%',
              compare: 'request 41.8 cores 대비 사용 3.9 cores',
              caption: '평상시 기준, 부하테스트 구간 제외',
            },
            {
              label: '메모리 활용률',
              value: '34',
              unit: '%',
              compare: 'request 98.9 GiB 대비 34 GiB',
              caption: '병목이 아니라 절감액은 현재 0원',
            },
            {
              label: '플랫폼 오버헤드 비중',
              value: '61',
              unit: '%',
              compare: '전체 request 중 25.4 cores',
              caption: '메시 사이드카와 노드 에이전트 합',
            },
          ]}
        />
      </Section>

      <Section id="binding" title="노드 수를 결정하는 건 CPU다, 메모리가 아니다">
        <Aside
          prose={
            <>
              <p>노드 shape는 3.89 GiB/core인데 클러스터 request 비율은 2.24 GiB/core다. CPU가 먼저 고갈되고 메모리는 절반 가까이 남는다. 노드 12대를 개별로 봐도 예외 없이 CPU 커밋률이 메모리보다 높았다.</p>
              <p>이 판정이 계획 전체의 우선순위를 정한다. 병목이 아닌 쪽을 깎으면 노드는 한 대도 줄지 않고 절감액은 0원이다. 오른쪽 표가 아래 모든 절감액의 환산 근거다.</p>
            </>
          }
        >
          <Panel title="환산 계수" description="이 표가 아래 모든 절감액의 근거다">
            <DataTable columns={factorColumns} data={factorRows} />
          </Panel>
        </Aside>
        <Verdict label="판정">
          <p>메모리 request 절감은 지금 전부 $0이다. 12~14 GiB 규모의 메모리 항목이 후보 목록에 올라와 있었지만 전부 뒤로 뺐다. CPU가 병목인 동안에는 메모리를 아무리 정리해도 노드 대수에 영향이 없고, 절감액을 합산해 보고하면 실현되지 않을 숫자를 약속하는 셈이 된다.</p>
        </Verdict>
      </Section>

      <Section id="gap" title="예약량과 실사용의 격차는 두 자릿수 배수다">
        <Prose>
          <p>워크로드별로 30일 평균과 최대를 놓고 보면 격차의 성격이 드러난다. 활용률이 낮은 항목 대부분은 평균이 아니라 최대치를 기준으로 request를 잡아 둔 것들이고, 그 최대치는 대개 분기 한 번 도는 부하테스트 구간에서 나왔다.</p>
        </Prose>
        <Panel title="30일 실사용 대 request" description="활용률이 낮은 순. max 스파이크는 대부분 부하테스트 구간이다">
          <DataTable columns={utilColumns} data={utilRows} />
        </Panel>
        <Verdict label="판정">
          <p>proxy가 100m을 잡고 0.4m을 쓴다. 244배다. 다만 max 열을 같이 봐야 한다 — 사이드카는 순간 2233m까지 튄다. 그래서 하향 폭은 평균이 아니라 최대치와 여유를 함께 보고 정했고, 최대 관측치가 현재 request를 넘긴 항목은 하향 목록에서 제외했다.</p>
        </Verdict>
      </Section>

      <Section id="plan" title="3단계로 나눈다, 앞 단계일수록 앱에 손대지 않는다">
        <Prose>
          <p>순서가 논지다. 뒤 단계를 먼저 하면 회수한 CPU가 노드 감소로 이어지지 않고, 앞 단계를 건너뛰면 뒤 단계의 관측 기준선이 흔들린다.</p>
        </Prose>
        <Steps
          items={[
            {
              kicker: '0단계 · 선행',
              title: '차단 해소',
              summary: '노드 1대 · 월 $161',
              children: (
                <>
                  <p>replica가 1인데 PodDisruptionBudget이 최소 1을 요구하는 워크로드가 하나 있다. 이 파드는 evict가 영구히 불가능하고, 오토스케일러는 이 파드가 올라간 노드를 드레인하지 못한다.</p>
                  <p>replica를 2로 올려 PDB를 충족시킨다. CPU 100m(월 약 $5)을 더 써서 노드 1대(월 $161)를 회수한다. 이 항목 하나가 2단계 전체 절감액보다 크다.</p>
                </>
              ),
            },
            {
              kicker: '1단계 · 즉시',
              title: '플랫폼 오버헤드',
              summary: '+11.1 cores · 월 $320~485',
              children: (
                <>
                  <p>사이드카, 게이트웨이, 노드 에이전트만 건드린다. 앱 코드와 앱 동작에 영향이 없어 롤백 판단도 쉽다.</p>
                  <p>다만 CPU 기반 오토스케일러가 68개다. 사이드카 request를 내리면 분모가 줄어 활용률이 부풀어 보이므로, 적용 후 1주는 스케일 이력만 관찰하고 2단계에 손대지 않는다.</p>
                </>
              ),
            },
            {
              kicker: '2단계 · 관찰 후',
              title: '앱별 하향',
              summary: '+2.2 cores · 월 약 $120',
              children: (
                <p>1단계 관찰이 끝난 뒤 착수한다. 실측 최대치를 기준으로 내리되, 역방향 항목 둘은 오히려 올린다 — request가 없어 BestEffort로 떠 있던 워크로드는 CPU를 조금 더 쓰지만 예측 가능성을 산다.</p>
              ),
            },
          ]}
        />
      </Section>

      <Section id="rejected" title="검증이 걸러낸 것들">
        <Prose>
          <p>각 권고를 반증했다. 아래는 그 과정에서 죽은 안들이다. 왜 빠졌는지 남겨 둔다 — 같은 제안이 다음 분기에 또 올라올 수 있고, 그때 같은 검증을 반복할 이유가 없다.</p>
        </Prose>
        <Claims
          items={[
            {
              text: 'geoip 갱신 잡 1 core → 500m',
              evidence: '30일 max가 1.26~1.55 cores로 이미 현재 request를 초과한다. 하향은 방향 자체가 반대다.',
              badge: '기각',
            },
            {
              text: '메시 컨트롤플레인 1000m → 300m',
              evidence: 'HPA target 80%에 최근 실제 스케일 이력이 있다. 300m이면 활용률이 651%가 되어 레플리카가 늘고 각각 2Gi를 잡는다. 절감이 아니라 증가다.',
              badge: '기각',
            },
            {
              text: '메시지 브로커 replicas 3 → 1',
              evidence: '절감의 대부분이 메모리라 병목 차원이 아니다. CPU 절감은 0.2 cores. $8/월을 위해 quorum 재생성과 오프셋 유실을 감수할 수 없다.',
              badge: '기각',
            },
          ]}
        />
        <Verdict label="한계" tone="caution">
          <p>단가는 온디맨드 목록가 기준 추정이라 ±10% 오차가 있고, 약정 할인은 반영하지 않았다. 재패킹 실현율 60~70%도 가정이다 — 오토스케일러에 consolidation이 없어 조각난 여유는 즉시 회수되지 않는다. 절감액을 확정 수치로 인용하지 말고 구간으로 다루기 바란다.</p>
        </Verdict>
      </Section>

      <Sources
        items={[
          {
            label: '30일 리소스 관측 + 클러스터 실측',
            note: '집계 기준 2026-08-10. 수치는 예시다.',
          },
        ]}
      />
    </Report>
  );
}
