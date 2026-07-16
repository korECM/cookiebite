import {
  Report,
  Standfirst,
  Section,
  Sources,
  Glossary,
  KpiRow,
  Claims,
  Findings,
  Matrix,
} from 'cookiebite';
import { stripe } from 'cookiebite/themes';

// prose-first article — 결제 인프라 전환 판단을 문서형 리포트로
export const __theme = stripe;

export default function App() {
  return (
    <Report
      title="Q2 플랫폼 전략 리뷰 — 결제 인프라 전환 판단"
      kicker="전략 리뷰 · 2026 Q2 · Acme Platform"
      layout="article"
    >
      <Standfirst>
        Q2에 우리는 자체 결제 스택을 유지할지, 전문 PSP로 이전할지, 하이브리드로
        나누어 운영할지를 결정해야 한다. 거래량 성장은 유지됐지만 실패율과 운영
        부담이 동시에 커졌고, 이 조합은 제품 로드맵보다 인프라 선택이 먼저 막혀
        있다는 신호다. 본 리뷰는 세 선택지의 비용·통제력·실행 위험을 같은 기준으로
        비교한 뒤, Q3에 실행할 권고를 고정한다.
      </Standfirst>

      <Section id="background" title="배경">
        <p>
          Acme Platform은 B2B SaaS 구독과 사용량 과금을 한 결제 파이프라인으로
          처리한다. 지난 18개월 동안 월간 결제 건수는 약 2.1배 늘었고, 신규 시장
          진출로 통화·세금·환불 규칙이 늘어났다. 이 구간에서 제품팀은 요금제와
          청구 UX에 집중했고, 결제 인프라는 “당장 깨지지 않으면 유지”하는 쪽으로
          미뤄 왔다.
        </p>
        <p>
          그 공백이 Q1 말부터 숫자로 드러났다. 카드 승인은 유지됐지만 soft decline
          이후 재시도 성공률이 떨어지고, 수동 정산·분쟁 대응에 쓰는 엔지니어 시간이
          주당 40시간을 넘었다. 고객 성공팀은 “결제 실패가 이탈 사유로 찍힌다”는
          피드백을 반복해서 올렸고, 재무는 수수료 변동을 예측하기 어렵다는 점을
          문제로 올렸다.
        </p>
        <p>
          경영진은 Q2 전략 회의에서 인프라 결정을 제품 백로그와 분리해 다루기로
          했다. 목표는 단기 비용 절감이 아니라, 다음 12개월 거래량 성장을
          흡수할 운영 상한을 확보하는 것이다. 아래 진단과 선택지 평가는 그 상한을
          기준으로 작성했다.
        </p>
      </Section>

      <Section id="diagnosis" title="현황 진단">
        <p>
          현재 스택은 승인 경로는 버티고 있으나, 실패 복구와 정산 운영에서 한계가
          보인다. 아래 KPI는 Q2 마지막 4주 평균이며, 전분기 대비 방향만으로도
          우선순위가 드러난다.
        </p>
        <KpiRow
          items={[
            {
              label: '승인 성공률',
              value: '97.4',
              unit: '%',
              delta: { value: '0.6pp', direction: 'down', good: false },
              compare: '전분기 98.0% 대비',
              caption: 'soft decline 재시도 구간에서 하락',
            },
            {
              label: '결제 운영 공수',
              value: 42,
              unit: '시간/주',
              delta: { value: '18시간', direction: 'up', good: false },
              compare: '전분기 24시간/주 대비',
              caption: '정산·분쟁·수동 환불이 대부분',
            },
            {
              label: '실효 수수료',
              value: '2.9',
              unit: '%',
              delta: { value: '0.3pp', direction: 'up', good: false },
              compare: '전분기 2.6% 대비',
              caption: '통화 분산과 재시도 비용이 합쳐진 값',
            },
          ]}
        />
        <p>
          승인률 하락폭은 작아 보이지만, 같은 기간 거래량이 19% 늘어 실패 절대
          건수는 더 크게 늘었다. 운영 공수와 실효 수수료가 함께 오른 것은 실패를
          사람이 메우고 있다는 뜻이다. 제품 기능을 더 넣기 전에 이 구조를 바꾸지
          않으면 Q3 성장분이 그대로 운영 부채로 쌓인다.
        </p>
      </Section>

      <Section id="options" title="선택지 평가">
        <p>
          선택지는 세 가지다. 자체 스택을 보강하는 경로, 주력 결제를 전문 PSP로
          이전하는 경로, 핵심 구간만 자체로 두고 나머지는 PSP에 맡기는
          하이브리드다. 아래 매트릭스는 통제력·출시 속도·운영 부담·12개월 비용을
          같은 척도로 비교한다.
        </p>
        <Matrix
          cols={['통제력', '출시 속도', '운영 부담', '12개월 비용']}
          rows={[
            {
              label: '자체 보강',
              cells: ['높음', '느림', '높음', '중간'],
            },
            {
              label: 'PSP 이전',
              cells: ['낮음', '빠름', '낮음', '높음'],
            },
            {
              label: '하이브리드',
              cells: ['중간', '중간', '중간', '중간'],
            },
          ]}
          caption="점수 대신 상대 등급. 비용은 수수료+인건비 합산 기준."
        />
        <p>
          <strong>자체 보강</strong>은 데이터와 라우팅 규칙을 우리가 쥐는 장점이
          있다. 다만 재시도·분쟁·다통화 정산을 내부에서 다시 쌓아야 하고, Q3
          안에 운영 공수를 유의미하게 줄이기 어렵다. 엔지니어링 헤드카운트를
          결제에 고정하면 제품 로드맵이 밀린다.
        </p>
        <p>
          <strong>PSP 이전</strong>은 실패 복구와 정산을 가장 빨리 바깥으로 넘긴다.
          대신 요금제 실험·사용량 과금·커스텀 환불 정책을 PSP 제약에 맞추게 되고,
          장기 수수료가 거래량과 함께 올라간다. 통제력을 잃는 비용이 단기 운영
          완화보다 클 수 있다.
        </p>
        <p>
          <strong>하이브리드</strong>는 국내 카드·구독 갱신을 자체로 두고, 해외
          결제와 분쟁 비중이 큰 구간만 PSP로 보낸다. 통합면은 늘지만, Q3에 운영
          공수를 줄이면서도 핵심 과금 로직을 잃지 않는 균형점이 여기다.
        </p>
      </Section>

      <Section id="risks" title="리스크">
        <Findings
          items={[
            {
              severity: 'critical',
              title: '이관 중 이중 청구·누락 청구',
              detail:
                '고객 단위 컷오버 없이 채널만 바꾸면 갱신 구독이 양쪽에 찍힌다. 계정 단위 플래그와 읽기 전용 대조 기간이 필요하다.',
            },
            {
              severity: 'warning',
              title: 'PSP SLA와 내부 장애 대응 공백',
              detail:
                'PSP 장애 시 우리가 할 수 있는 조치가 제한된다. 상태 페이지 연동과 고객 공지 템플릿을 이관 전에 준비해야 한다.',
            },
            {
              severity: 'info',
              title: '재무 리포트 스키마 불일치',
              detail:
                '자체 정산 필드와 PSP 정산 필드를 맞추지 않으면 Q3 마감에서 수동 매핑이 다시 늘어난다.',
            },
          ]}
        />
        <p>
          위 리스크는 선택지를 기각하는 이유가 아니라, 실행 계획에 넣어야 할
          가드다. 특히 이중 청구는 한 번만 터져도 신뢰 비용이 수수료 절감분을
          삼킨다. 하이브리드를 택하더라도 컷오버 설계를 권고의 전제로 둔다.
        </p>
      </Section>

      <Section id="recommendation" title="권고">
        <Claims
          items={[
            {
              text: 'Q3에는 하이브리드로 간다. 해외·분쟁 비중 구간만 PSP로 넘긴다.',
              evidence:
                '운영 공수 42시간/주와 soft decline 하락이 동시에 있고, 전면 이전은 과금 통제력을 과도하게 포기한다.',
              badge: '결정',
            },
            {
              text: '8주 안에 계정 단위 컷오버와 대조 대시보드를 먼저 만든다.',
              evidence:
                '이중 청구 리스크가 critical이며, 채널 전환보다 계정 플래그가 선행되어야 한다.',
              badge: '선행',
            },
            {
              text: '자체 보강은 보류하고, PSP 전면 이전은 12개월 뒤 재평가한다.',
              evidence:
                '자체 보강은 Q3 상한을 못 열고, 전면 이전은 수수료·제약 비용이 성장 곡선과 맞물린다.',
              badge: '범위',
            },
          ]}
        />
        <p>
          이번 결정의 성공 기준은 수수료율 한 줄이 아니다. Q3 말까지 결제 운영
          공수를 주 25시간 아래로 내리고, 승인 성공률을 98%대로 되돌리며, 고객
          이탈 사유에서 결제 실패 비중을 줄이는 것이다. 그 세 지표가 움직이면
          하이브리드를 유지하고, 움직이지 않으면 Q4에 PSP 비중을 늘리는 쪽으로
          다시 판단한다.
        </p>
      </Section>

      <Section id="sources" title="출처">
        <Sources
          items={[
            {
              label: 'Payments ops weekly (내부)',
              note: 'Q2 W10–W13 운영 공수·실패 분류',
            },
            {
              label: 'Billing ledger export',
              note: '실효 수수료·통화별 거래량',
            },
            {
              label: 'CS churn reason codes',
              note: '결제 실패 관련 이탈 태그',
            },
            {
              label: 'PSP vendor RFP summary',
              note: '수수료·SLA·과금 API 제약 비교',
            },
          ]}
        />
      </Section>

      <Section id="glossary" title="용어">
        <Glossary
          terms={[
            {
              term: 'PSP',
              def: 'Payment Service Provider. 승인·정산·분쟁을 대행하는 결제 사업자.',
            },
            {
              term: 'soft decline',
              def: '잔액·한도 등 일시 사유로 거절된 승인. 재시도로 회복 가능한 경우가 많다.',
            },
            {
              term: '실효 수수료',
              def: '명목 수수료에 재시도·환불·통화 환전 비용을 더한 거래 대비 비율.',
            },
          ]}
        />
      </Section>
    </Report>
  );
}
