export type CapabilityName = 'table' | 'glossary' | 'chart';

export interface CapabilityCall {
  capability: CapabilityName;
  hostId: string;
  options: unknown;
}

let calls: CapabilityCall[] = [];
let css: Map<string, string> = new Map();
let flags: Set<string> = new Set();

export function resetCollected(): void {
  calls = [];
  css = new Map();
  flags = new Set();
}

export function registerCall(call: CapabilityCall): void {
  calls.push(call);
}

/** 같은 컴포넌트의 CSS는 한 번만 실린다 — name이 dedupe 키. */
export function registerCss(name: string, chunk: string): void {
  if (!css.has(name)) css.set(name, chunk);
}

/** 문서 플래그(예: controls) — assemble이 정적 자산 방출 조건으로 쓴다. */
export function registerFlag(name: string): void {
  flags.add(name);
}

export function getCollected(): { calls: CapabilityCall[]; css: string; flags: string[] } {
  return { calls: [...calls], css: [...css.values()].join('\n'), flags: [...flags].sort() };
}
