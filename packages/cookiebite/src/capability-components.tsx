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

const TABLE_CSS = `.cb-table { border-collapse: collapse; width: 100%; }
.cb-table th, .cb-table td {
  text-align: start;
  padding: calc(var(--cb-space-unit) * 2px) calc(var(--cb-space-unit) * 3px);
  border-bottom: 1px solid var(--cb-divider);
}
.cb-table th { font-weight: 600; }`;

/** 정렬 가능한 표. sortable이고 행이 있을 때만 table capability를 등록한다. */
export function Table({ columns, rows, sortable, caption }: TableProps): ReactNode {
  registerCss('table', TABLE_CSS);
  const id = useId();

  if (sortable && rows.length > 0) {
    const numericColumns = columns.flatMap((c, i) => (c.numeric ? [i] : []));
    registerCall({ capability: 'table', hostId: id, options: { numericColumns } });
  }

  return (
    <table id={id} className="cb-table">
      {caption === undefined ? null : <caption>{caption}</caption>}
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th scope="col" key={i}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export interface GlossaryProps {
  term: string;
  definition: string;
}

/**
 * 용어 정의. .cb-glossary-def 팝오버 스타일은 vendor core CSS에 이미 있으므로
 * registerCss는 생략한다.
 */
export function Glossary({ term, definition }: GlossaryProps): ReactNode {
  const id = useId();
  registerCall({ capability: 'glossary', hostId: id, options: { definition } });
  return (
    <dfn id={id} tabIndex={0} className="cb-glossary-term">
      {term}
    </dfn>
  );
}
