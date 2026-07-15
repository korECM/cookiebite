import { Report, Page, Standfirst, Sources } from '../../src/v3.ts';

export default function App() {
  return (
    <Report
      layout="paged"
      title="Paged 리포트"
      kicker="Task 8"
      theme={{ seed: { accent: '#FA4D02' } }}
      controls={false}
    >
      <Standfirst>페이지 레이아웃 스모크 픽스처.</Standfirst>
      <Page id="overview" title="개요">
        <p>개요 본문 overview-body</p>
      </Page>
      <Page id="evidence" title="근거">
        <p>근거 본문 evidence-body</p>
      </Page>
      <Page id="next" title="다음">
        <p>다음 본문 next-body</p>
      </Page>
      <Sources items={[{ label: '내부 집계' }]} />
    </Report>
  );
}
