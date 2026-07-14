// packages/cookiebite/lib/tw-compile.mjs
// 리포트 빌드 시점: 렌더된 마크업을 스캔해 사용된 Tailwind 유틸리티만 CSS로 산출한다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// preflight 제외(core reset과 충돌 방지). theme는 스페이싱 등 기본 스케일용,
// --color-*: initial 로 기본 팔레트를 지운 뒤 --cb-* 시맨틱만 노출한다.
const TW_INPUT = `
@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);

@theme {
  --color-*: initial;
  --color-background: var(--cb-background);
  --color-foreground: var(--cb-text);
  --color-primary: var(--cb-accent);
  --color-primary-foreground: var(--cb-on-accent);
  --color-muted: var(--cb-surface);
  --color-muted-foreground: var(--cb-text-muted);
  --color-border: var(--cb-divider);
  --color-card: var(--cb-surface);
  --color-card-foreground: var(--cb-text);
  --color-accent-strong: var(--cb-accent-strong);
  --radius: var(--cb-radius);
  /* shadcn rounded-md/xl이 테마 radius를 타도록 */
  --radius-md: calc(var(--radius) - 2px);
  --radius-xl: var(--radius);
}
`;

/**
 * @param {string} markup 렌더된 HTML 마크업
 * @returns {Promise<string>} 사용된 유틸리티 CSS. 없으면 빈 문자열.
 */
export async function compileTw(markup) {
  const candidates = new Scanner({}).scanFiles([{ content: markup, extension: 'html' }]);
  const { build } = await compile(TW_INPUT, {
    base: pkgRoot,
    onDependency() {},
  });
  const css = build(candidates);
  // 유틸 규칙이 없으면 `@layer utilities;` 배너만 남는다 — 블록 생략을 위해 빈 문자열.
  if (!css.includes('{')) return '';
  return css;
}
