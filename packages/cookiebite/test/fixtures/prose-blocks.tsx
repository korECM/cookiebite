import { Report, Section, Standfirst, Prose, Verdict, Aside, Steps, Panel } from 'cookiebite';
import { persimmon } from 'cookiebite/themes';

export const __theme = persimmon;

export default function App() {
  return (
    <Report title="산문 블록 픽스처" kicker="테스트">
      <Standfirst>세 산문 컨테이너가 렌더되는지 확인한다.</Standfirst>

      <Section id="verdict" title="판정은 데이터 뒤에 온다">
        <Prose>
          <p>첫 문단이다. 캡션이 아니라 문단으로 쓰는 자리를 확인한다.</p>
          <p>두 번째 문단은 space-y로 벌어져야 한다.</p>
        </Prose>
        <Verdict label="판정">
          <p>노드 shape가 3.89 GiB/core인데 클러스터 request 비율은 2.24 GiB/core다.</p>
        </Verdict>
        <Verdict label="주의" tone="caution">
          문자열 자식은 문단으로 감싼다.
        </Verdict>
      </Section>

      <Section id="aside" title="산문과 데이터가 나란히 선다">
        <Aside
          prose={
            <>
              <p>왼쪽은 산문이고 오른쪽은 데이터다.</p>
              <p>md 아래에서는 산문이 먼저 쌓인다.</p>
            </>
          }
        >
          <Panel title="증거">데이터 자리</Panel>
        </Aside>
        <Aside side="right" prose={<p>산문을 오른쪽에 둔 경우다.</p>}>
          <Panel title="증거 2">데이터 자리</Panel>
        </Aside>
      </Section>

      <Section id="steps" title="순서가 논지일 때는 단계로 쌓는다">
        <Steps
          items={[
            {
              kicker: '0단계 · 선행',
              title: '차단 해소',
              summary: '노드 1대 · 월 $161',
              children: <p>이걸 먼저 하지 않으면 뒤 단계 회수분이 노드 감소로 이어지지 않는다.</p>,
            },
            {
              kicker: '1단계 · 즉시',
              title: '플랫폼 오버헤드',
              summary: '+11.1 cores',
              children: (
                <>
                  <p>사이드카와 DaemonSet만 건드린다. 앱 동작에 영향이 없다.</p>
                  <p>적용 후 한 주 관찰한다.</p>
                </>
              ),
            },
          ]}
        />
      </Section>
    </Report>
  );
}
