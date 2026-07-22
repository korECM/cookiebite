'use client';

import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ResultColumn } from '@/lib/tabular';

export type ResultView = 'chart' | 'table';

export interface ResultToolbarProps {
  /** Only `'toggle'` draws the chart/table switch. */
  mode: 'none' | 'both' | 'toggle';
  view: ResultView;
  onViewChange: (view: ResultView) => void;
  axis?: {
    categorical: ResultColumn[];
    numeric: ResultColumn[];
    x: string;
    y: string;
    onXChange: (key: string) => void;
    onYChange: (key: string) => void;
    /** False once the reader has moved off the author's chosen axes. */
    isDefault: boolean;
    onReset: () => void;
  };
  search?: {
    value: string;
    onChange: (value: string) => void;
  };
  labelId: string;
}

const SELECT_CLASS =
  'h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs';

function ViewSwitch({
  view,
  onViewChange,
  labelId,
}: {
  view: ResultView;
  onViewChange: (view: ResultView) => void;
  labelId: string;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="inline-flex overflow-hidden rounded-md border border-input"
    >
      {(['chart', 'table'] as const).map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={view === candidate}
          onClick={() => onViewChange(candidate)}
          className={cn(
            'px-2.5 py-1 text-xs transition-colors',
            view === candidate
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {candidate === 'chart' ? '차트' : '표'}
        </button>
      ))}
    </div>
  );
}

/**
 * Control strip above the data. Marked `data-cb-controls` so print drops it —
 * a paper report should carry the numbers, not the buttons.
 */
export function ResultToolbar({
  mode,
  view,
  onViewChange,
  axis,
  search,
  labelId,
}: ResultToolbarProps) {
  const showAxis = axis && (mode === 'both' || view === 'chart');
  if (mode !== 'toggle' && !showAxis && !search) return null;

  return (
    <div
      data-cb-controls
      className="mb-3 flex flex-wrap items-center gap-2 print:hidden"
    >
      {mode === 'toggle' ? (
        <ViewSwitch view={view} onViewChange={onViewChange} labelId={labelId} />
      ) : null}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {showAxis ? (
          <>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              X
              <select
                className={SELECT_CLASS}
                value={axis.x}
                onChange={(event) => axis.onXChange(event.target.value)}
              >
                {axis.categorical.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              Y
              <select
                className={SELECT_CLASS}
                value={axis.y}
                onChange={(event) => axis.onYChange(event.target.value)}
              >
                {axis.numeric.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>
            {!axis.isDefault ? (
              <Button variant="ghost" size="xs" onClick={axis.onReset}>
                <RotateCcw aria-hidden />
                기본 축
              </Button>
            ) : null}
          </>
        ) : null}

        {search ? (
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              placeholder="행 검색"
              aria-label="행 검색"
              className="h-7 w-36 rounded-md border border-input bg-background pr-2 pl-7 text-xs text-foreground shadow-xs placeholder:text-muted-foreground"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
