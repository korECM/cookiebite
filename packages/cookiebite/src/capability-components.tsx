// 컴포넌트 인덱스: Table({ columns, rows, sortable?, caption? }) — 정렬 표 (sortable이면 table capability 등록)
//                Glossary({ term, definition }) — 용어 정의 (glossary capability 등록)
import { useId, type ReactNode } from 'react';
import { registerCall, registerCss } from './collect.ts';

export interface TableColumn {
  header: string;
  numeric?: boolean;
}

export interface TableProps {
  columns: TableColumn[];
  rows: (string | number)[][];
  sortable?: boolean;
  caption?: string;
}

// .cb-sort는 capability가 주입 — TW 스캔 불가, CSS 청크에서 스타일.
// 표 룩(헤더 muted, hover, 여백)은 마크업 TW 유틸.
const TABLE_CSS = `.cb-table-wrap { margin: 0; overflow: auto; }
.cb-table { border-collapse: collapse; }
.cb-table .cb-sort {
  appearance: none; background: none; border: none; font: inherit;
  font-weight: inherit; color: inherit; cursor: pointer; padding: 0;
  display: inline-flex; align-items: center; gap: 0.4em;
}
.cb-table .cb-sort::after { content: ''; opacity: 0.35; font-size: 0.85em; }
.cb-table th[aria-sort='ascending'] .cb-sort::after { content: '▲'; opacity: 1; }
.cb-table th[aria-sort='descending'] .cb-sort::after { content: '▼'; opacity: 1; }`;

/** 정렬 가능한 표. sortable이고 행이 있을 때만 table capability를 등록한다. */
export function Table({ columns, rows, sortable, caption }: TableProps): ReactNode {
  registerCss('table', TABLE_CSS);
  const id = useId();

  if (sortable && rows.length > 0) {
    const numericColumns = columns.flatMap((c, i) => (c.numeric ? [i] : []));
    registerCall({ capability: 'table', hostId: id, options: { numericColumns } });
  }

  return (
    // shadcn/ui Table 정적 서브셋 (MIT) — 카드 래핑 + header muted + row hover
    <div className="cb-table-wrap rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <table id={id} className="cb-table w-full caption-bottom text-sm">
        {caption === undefined ? null : (
          <caption className="mt-4 px-2 text-sm text-muted-foreground">{caption}</caption>
        )}
        <thead>
          <tr className="border-b hover:bg-muted/50">
            {columns.map((col, i) => (
              <th
                scope="col"
                key={i}
                className={`h-10 px-2 text-left align-middle font-medium text-muted-foreground ${col.numeric ? 'text-right' : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b transition-colors hover:bg-muted/50">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`p-2 align-middle text-card-foreground ${columns[ci]?.numeric ? 'text-right tabular-nums' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface GlossaryProps {
  term: string;
  definition: string;
}

/**
 * 용어 정의. .cb-glossary-def 팝오버 스타일은 vendor core CSS에 이미 있으므로
 * registerCss는 생략한다.
 * definition이 비어 있으면 render 시점에 throw — 조용한 skip 금지.
 */
export function Glossary({ term, definition }: GlossaryProps): ReactNode {
  if (definition.trim() === '') {
    throw new Error(
      'Glossary: definition이 비어 있습니다 — 용어 정의를 채우거나 컴포넌트를 제거하세요.',
    );
  }
  const id = useId();
  registerCall({ capability: 'glossary', hostId: id, options: { definition } });
  return (
    <dfn id={id} tabIndex={0} className="cb-glossary-term">
      {term}
    </dfn>
  );
}
