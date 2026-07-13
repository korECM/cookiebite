import type { ThemeDocument } from '../src/themes.ts';

export interface ChartSpec {
  type: string;
  data: Array<Record<string, string | number>>;
  semanticTypes: Record<string, string>;
  encodings: Record<string, string | { field: string }>;
  width?: number;
  height?: number;
}

export declare function compileChartOptions(
  spec: ChartSpec,
  theme: ThemeDocument,
): { light: object; dark: object };

export declare class ChartCompileError extends Error {}
