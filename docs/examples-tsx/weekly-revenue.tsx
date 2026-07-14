import {
  Report,
  Standfirst,
  Section,
  Sources,
  KpiRow,
  Findings,
  Matrix,
  Chart,
  Table,
  Glossary,
} from 'cookiebite';
import { stripe } from 'cookiebite/themes';

// legacy docs/examples/weekly-revenue.html을 TSX 관용구로 다시 쓴 리포트.
// 서사(성장 엔진은 신규 로고가 아니라 확장과 유지)를 KPI, 워터폴, 추세,
// 퍼널, 코호트 히트맵, 플랜 구성, 계정 표로 재구성한다.
export default (
  <Report theme={stripe} title="성장과 매출 주간 리뷰" lang="ko">
    <Standfirst
      kicker="주간 리뷰, 24주차, 2026-06-09 ~ 06-15, Acme Cloud"
      headline="MRR이 $1.42M을 넘겼지만 성장 엔진은 신규 로고가 아니라 확장이다"
    >
      확장(+$71K)이 축소와 이탈을 상쇄해 순증 MRR을 +$43K로 끌어올렸다.{' '}
      <Glossary
        term="NRR"
        definition="순수익유지율. 신규 로고를 뺀 기존 고객의 확장, 축소, 이탈을 반영한 수익 지표. 100%를 넘으면 기존 고객만으로도 매출이 자란다."
      />{' '}
      은 112%를 유지했지만 신규 로고 속도는 둔화됐고 총이탈은 늘었다.
    </Standfirst>

    <Section title="핵심 지표">
      <KpiRow
        items={[
          {
            label: 'MRR',
            value: '$1.42M',
            delta: { dir: 'up', text: '전주 대비 3.1%', tone: 'success' },
          },
          {
            label: '신규 MRR',
            value: '$58K',
            delta: { dir: 'down', text: '8.2%', tone: 'critical' },
          },
          {
            label: '이탈 MRR',
            value: '$28K',
            delta: { dir: 'up', text: '14.0%', tone: 'critical' },
          },
          {
            label: '순신규 로고',
            value: 34,
            delta: { dir: 'down', text: '전주 대비 5', tone: 'critical' },
          },
          {
            label: 'NRR',
            value: '112',
            unit: '%',
            delta: { dir: 'up', text: '2pp', tone: 'success' },
          },
          {
            label: '활성화율',
            value: '62.4',
            unit: '%',
            delta: { dir: 'up', text: '1.8pp', tone: 'success' },
            note: '신규 가입 중 7일 내 아하 순간 도달 비율',
          },
        ]}
      />
    </Section>

    <Section id="bridge" title="MRR 브리지">
      <p>
        $1.377M에서 출발해 확장(+$71K)이 모든 신규 사업보다 큰 지렛대였고, 축소(-$18K)와 이탈(-$28K)이 일부를 되돌려 순효과 +$43K로 $1.420M에 마감했다.
      </p>
      <Chart
        type="Bar Chart"
        data={[
          { component: '신규 사업', delta: 58 },
          { component: '확장', delta: 71 },
          { component: '재활성', delta: 9 },
          { component: '축소', delta: -18 },
          { component: '이탈', delta: -28 },
        ]}
        semanticTypes={{ component: 'Category', delta: 'Quantity' }}
        encodings={{ x: 'component', y: 'delta' }}
        ariaLabel="MRR 구성 요소별 증감 막대"
        height={340}
      />
    </Section>

    <Section id="trend" title="MRR 추세">
      <p>
        26주 복리 성장. 현재 속도라면 $1.5M 목표는 약 3주 앞이다.
      </p>
      <Chart
        type="Area Chart"
        data={[
          { week: 'W14', mrr: 1221 },
          { week: 'W15', mrr: 1238 },
          { week: 'W16', mrr: 1252 },
          { week: 'W17', mrr: 1268 },
          { week: 'W18', mrr: 1281 },
          { week: 'W19', mrr: 1305 },
          { week: 'W20', mrr: 1332 },
          { week: 'W21', mrr: 1351 },
          { week: 'W22', mrr: 1372 },
          { week: 'W23', mrr: 1389 },
          { week: 'W24', mrr: 1402 },
          { week: 'W25', mrr: 1411 },
          { week: 'W26', mrr: 1420 },
        ]}
        semanticTypes={{ week: 'Category', mrr: 'Quantity' }}
        encodings={{ x: 'week', y: 'mrr' }}
        ariaLabel="주간 MRR 추세 영역 차트"
        height={320}
      />
    </Section>

    <Section id="funnel" title="획득 퍼널">
      <p>
        가입에서 활성화로 넘어가는 구간이 누수다. 38%가 활성화 지점에 닿지 못한다. 이 단계를 고치면 유료 전환이 따라온다.
      </p>
      <Chart
        type="Funnel Chart"
        data={[
          { stage: '방문', count: 48200 },
          { stage: '가입', count: 6140 },
          { stage: '활성화', count: 3830 },
          { stage: '유료', count: 1420 },
          { stage: '확장', count: 540 },
        ]}
        semanticTypes={{ stage: 'Category', count: 'Quantity' }}
        encodings={{ x: 'stage', y: 'count' }}
        ariaLabel="방문에서 확장까지 전환 퍼널"
        height={320}
      />
    </Section>

    <Section id="cohort" title="코호트 유지율">
      <p>
        가입 코호트별 로고 유지율. 최근 코호트(3~5월)는 3개월차에 약 84%로 예전 코호트(약 71%)보다 잘 남는다. Q1 온보딩 개선이 효과를 낸다. 빈 칸은 아직 오지 않은 달이다.
      </p>
      <Matrix
        rows={['12월', '1월', '2월', '3월', '4월', '5월']}
        cols={['M0', 'M1', 'M2', 'M3', 'M4', 'M5']}
        data={[
          [100, 88, 80, 71, 66, 62],
          [100, 90, 82, 74, 69, 0],
          [100, 91, 84, 77, 0, 0],
          [100, 93, 86, 84, 0, 0],
          [100, 94, 88, 0, 0, 0],
          [100, 95, 0, 0, 0, 0],
        ]}
        max={100}
        format={(v) => (v === 0 ? '—' : `${v}%`)}
        ariaLabel="가입 월별 코호트 유지율, 가입 후 경과 월 기준 잔존 비율"
        caption="최근 코호트가 3개월차 유지율에서 앞선다"
      />
    </Section>

    <Section id="plans" title="플랜별 매출">
      <p>
        엔터프라이즈가 이제 MRR의 약 48%를 이끌며 가장 빠르게 자란다. 스타터에서 프로로 가는 셀프서브 경로는 여전히 물량 엔진이다.
      </p>
      <Chart
        type="Stacked Bar Chart"
        data={[
          { week: 'W23', plan: '엔터프라이즈', mrr: 618 },
          { week: 'W23', plan: '프로', mrr: 460 },
          { week: 'W23', plan: '팀', mrr: 225 },
          { week: 'W23', plan: '스타터', mrr: 68 },
          { week: 'W24', plan: '엔터프라이즈', mrr: 635 },
          { week: 'W24', plan: '프로', mrr: 468 },
          { week: 'W24', plan: '팀', mrr: 228 },
          { week: 'W24', plan: '스타터', mrr: 41 },
          { week: 'W25', plan: '엔터프라이즈', mrr: 654 },
          { week: 'W25', plan: '프로', mrr: 475 },
          { week: 'W25', plan: '팀', mrr: 231 },
          { week: 'W25', plan: '스타터', mrr: 49 },
          { week: 'W26', plan: '엔터프라이즈', mrr: 682 },
          { week: 'W26', plan: '프로', mrr: 483 },
          { week: 'W26', plan: '팀', mrr: 168 },
          { week: 'W26', plan: '스타터', mrr: 87 },
        ]}
        semanticTypes={{ week: 'Category', plan: 'Category', mrr: 'Quantity' }}
        encodings={{ x: 'week', y: 'mrr', color: 'plan' }}
        ariaLabel="4주간 플랜별 MRR 누적 막대"
        height={340}
      />
    </Section>

    <Section title="분기 목표와 건강도">
      <p>2주 남은 시점에 Q2 순증 MRR 목표의 82%에 있다. 확장이 유지되면 궤도에 있다.</p>
      <Findings
        items={[
          {
            tone: 'success',
            title: '확장이 성장 엔진이다',
            label: '강점',
            note: '$71K 확장이 모든 신규 사업 합계를 넘었다. NRR 112%.',
          },
          {
            tone: 'warning',
            title: '신규 로고 속도가 둔화된다',
            note: '순신규 로고 34, 전주 대비 5 감소. 유료 전환 3.6%로 0.4pp 하락.',
          },
          {
            tone: 'critical',
            title: '이탈이 기어오른다',
            note: '11개 계정 이탈($28K, 전주 대비 14% 증가). 둘은 엔터프라이즈로 세이브 플레이를 검토한다.',
          },
        ]}
      />
    </Section>

    <Section id="accounts" title="순 MRR 증감 상위 계정">
      <p>정렬과 검색이 된다. 확장은 집중돼 있어 상위 4개 계정이 이번 주 $71K 확장의 절반 이상을 이끌었다.</p>
      <Table
        sortable
        caption="순 증감으로 정렬할 수 있다"
        columns={[
          { header: '계정' },
          { header: '플랜' },
          { header: '세그먼트' },
          { header: 'MRR ($K)', numeric: true },
          { header: '순 증감 ($K)', numeric: true },
          { header: '건강도' },
        ]}
        rows={[
          ['Globex Corp', '엔터프라이즈', '엔터프라이즈', 121, 9, '양호'],
          ['Northwind Trading', '엔터프라이즈', '미드마켓', 84, 12, '양호'],
          ['Umbrella Co', '엔터프라이즈', '엔터프라이즈', 96, 4, '양호'],
          ['Stark Industries', '엔터프라이즈', '엔터프라이즈', 142, 1, '양호'],
          ['Initech', '프로', 'SMB', 22, 6, '양호'],
          ['Wonka Labs', '프로', '미드마켓', 31, 3, '양호'],
          ['Soylent Inc', '팀', 'SMB', 14, 5, '주의'],
          ['Hooli', '프로', '미드마켓', 27, -2, '주의'],
          ['Pied Piper', '팀', 'SMB', 9, -4, '위험'],
          ['Vandelay Ind.', '프로', 'SMB', 18, -6, '위험'],
          ['Bluth Company', '스타터', 'SMB', 4, -7, '위험'],
        ]}
      />
    </Section>

    <Section title="용어">
      <Findings
        items={[
          {
            tone: 'info',
            title: 'MRR / ARR',
            label: '용어',
            note: '월간, 연간 반복 매출. 정규화한 구독 매출이며 ARR = MRR × 12.',
          },
          {
            tone: 'info',
            title: '이탈',
            label: '용어',
            note: '다운그레이드와 해지로 잃는 매출이나 로고. 총이탈은 손실만, 순이탈은 확장에서 손실을 뺀 값.',
          },
          {
            tone: 'info',
            title: '활성화',
            label: '용어',
            note: "7일 안에 아하 순간(프로젝트 생성과 팀원 초대)에 닿는 가입 비율.",
          },
        ]}
      />
    </Section>

    <Sources>집계 기준: Acme Cloud 빌링과 제품 분석 웨어하우스 (2026-06-15). 수치는 예시다.</Sources>
  </Report>
);
