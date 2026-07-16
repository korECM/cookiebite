import { Check, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { koGlue } from '@/lib/ko-text';

export interface MatrixRow {
  label: string;
  cells: (boolean | string)[];
}

export interface MatrixProps {
  rows: MatrixRow[];
  cols: string[];
  caption?: string;
  className?: string;
}

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto size-4 text-foreground" aria-label="yes" />
    ) : (
      <Minus
        className="mx-auto size-4 text-muted-foreground/50"
        aria-label="no"
      />
    );
  }
  return <span className="text-sm text-foreground">{koGlue(value)}</span>;
}

export function Matrix({ rows, cols, caption, className }: MatrixProps) {
  return (
    <Table className={cn(className)}>
      {caption ? <TableCaption>{caption}</TableCaption> : null}
      <TableHeader>
        <TableRow>
          <TableHead className="w-[8rem]" />
          {cols.map((col) => (
            <TableHead key={col} className="text-center">
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell className="font-medium text-foreground">
              {koGlue(row.label)}
            </TableCell>
            {row.cells.map((cell, i) => (
              <TableCell key={`${row.label}-${cols[i] ?? i}`} className="text-center">
                <CellValue value={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
