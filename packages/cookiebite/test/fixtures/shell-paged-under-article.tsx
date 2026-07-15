import { Report, Page, Section } from '../../src/v3.ts';

/** article 기본 레이아웃에서 Page를 써도 깨지지 않는지(관용). */
export default function App() {
  return (
    <Report title="Article + Page" controls={false} toc={false}>
      <Section id="sec" title="섹션">
        <p>section-body</p>
      </Section>
      <Page id="orphan-page" title="고아 페이지">
        <p>orphan-page-body</p>
      </Page>
    </Report>
  );
}
