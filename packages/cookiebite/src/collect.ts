export type CapabilityName = 'table' | 'glossary' | 'chart';

export interface CapabilityCall {
  capability: CapabilityName;
  hostId: string;
  options: unknown;
}

let calls: CapabilityCall[] = [];
let css: Map<string, string> = new Map();

export function resetCollected(): void {
  calls = [];
  css = new Map();
}

export function registerCall(call: CapabilityCall): void {
  calls.push(call);
}

/** 같은 컴포넌트의 CSS는 한 번만 실린다 — name이 dedupe 키. */
export function registerCss(name: string, chunk: string): void {
  if (!css.has(name)) css.set(name, chunk);
}

export function getCollected(): { calls: CapabilityCall[]; css: string } {
  return { calls: [...calls], css: [...css.values()].join('\n') };
}
