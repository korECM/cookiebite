'use client';

import { useState } from 'react';
import { Check, ChevronRight, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tokenizeSql, type SqlTokenKind } from '@/lib/sql-highlight';

export interface ResultQuery {
  text: string;
  /** `'sql'` gets keyword weighting; anything else renders as plain code. */
  language?: 'sql' | 'text';
}

export interface ResultMeta {
  engine?: string;
  ranAt?: string;
  duration?: string;
}

export interface ResultProvenanceProps {
  query?: ResultQuery;
  source?: string;
  meta?: ResultMeta;
  totalRows: number;
  queryOpen: boolean;
  onToggleQuery: () => void;
  onDownloadCsv: () => void;
  onCopyMarkdown: () => Promise<void> | void;
  onCopyQuery: () => Promise<void> | void;
  onDownloadPng?: () => void;
}

// Weight and muting carry the syntax instead of a palette — the theme's color
// tokens are contrast-gated for text on surfaces, not for a rainbow of spans.
const TOKEN_CLASS: Record<SqlTokenKind, string> = {
  keyword: 'font-semibold text-foreground',
  string: 'text-primary',
  number: 'text-foreground',
  comment: 'text-muted-foreground/70 italic',
  plain: '',
};

/** Copy button that confirms itself, then goes quiet again. */
function CopyButton({
  label,
  onCopy,
}: {
  label: string;
  onCopy: () => Promise<void> | void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={async () => {
        await onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? '복사됨' : label}
    </Button>
  );
}

/**
 * Footer strip: where the numbers came from, and how to take them with you.
 * The query sits collapsed here rather than in the body — it answers "where is
 * this from", which is provenance, not content.
 */
export function ResultProvenance({
  query,
  source,
  meta,
  totalRows,
  queryOpen,
  onToggleQuery,
  onDownloadCsv,
  onCopyMarkdown,
  onCopyQuery,
  onDownloadPng,
}: ResultProvenanceProps) {
  const facts = [meta?.engine, meta?.ranAt, meta?.duration].filter(Boolean);
  const caption = source ?? facts.join(' · ');
  const tokens =
    query && query.language !== 'text' ? tokenizeSql(query.text) : null;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {query ? (
          <button
            type="button"
            data-cb-controls
            aria-expanded={queryOpen}
            onClick={onToggleQuery}
            className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground print:hidden"
          >
            <ChevronRight
              aria-hidden
              className={cn('size-3.5 transition-transform', queryOpen && 'rotate-90')}
            />
            쿼리
          </button>
        ) : null}
        {caption ? <span>{caption}</span> : null}

        <div className="ml-auto flex flex-wrap items-center gap-1 print:hidden">
          <span className="tabular-nums">{totalRows.toLocaleString()}행</span>
          <Button variant="ghost" size="xs" onClick={onDownloadCsv}>
            <Download aria-hidden />
            CSV (전체 {totalRows.toLocaleString()}행)
          </Button>
          <CopyButton label="표 복사" onCopy={onCopyMarkdown} />
          {onDownloadPng ? (
            <Button variant="ghost" size="xs" onClick={onDownloadPng}>
              <Download aria-hidden />
              PNG
            </Button>
          ) : null}
        </div>
      </div>

      {query ? (
        <div
          data-cb-reveal
          className={cn('mt-2', !queryOpen && 'hidden')}
        >
          <div className="mb-1 flex justify-end print:hidden">
            <CopyButton label="쿼리 복사" onCopy={onCopyQuery} />
          </div>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed">
            <code>
              {tokens
                ? tokens.map((token, index) => (
                    <span key={index} className={TOKEN_CLASS[token.kind]}>
                      {token.text}
                    </span>
                  ))
                : query.text}
            </code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
