// packages/cookiebite/lib/tw-compile.mjs
// 리포트 빌드 시점: Tailwind 유틸리티 CSS 산출 (소스 스캔 + shadcn @theme).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const THEME_INLINE = `
@theme inline {
  --color-*: initial;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
`;

/** @param {string} sourcesRoot 패키지 소스 루트 (@source 대상) */
function buildV3Input(sourcesRoot) {
  // node_modules resolve는 항상 이 패키지 기준. @source만 sourcesRoot를 가리킨다.
  const src = (pattern) => {
    if (sourcesRoot === pkgRoot) return `@source "./src/${pattern}";`;
    return `@source "${path.join(sourcesRoot, 'src', pattern)}";`;
  };
  // theme → preflight(base) → utilities. shadcn border/body override는
  // preflight 뒤에 같은 @layer base로 두어 currentColor를 var(--border)로 덮는다.
  // (assemble의 #cookiebite-base는 SHELL_CSS만 — preflight보다 앞에 오면 override가 진다.)
  return `
@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/preflight" layer(base);
@import "tailwindcss/utilities" layer(utilities);
@import "tw-animate-css";

${src('ui/**/*.tsx')}
${src('lib/**/*.ts')}
${src('shell/**/*.tsx')}
${src('report/**/*.tsx')}

${THEME_INLINE}

@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    border-color: var(--border);
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
  }
}
`;
}

/**
 * 레거시 슬롯. shadcn border/body는 tw compile 입력의 @layer base(preflight 뒤)로 옮김.
 * assemble #cookiebite-base는 SHELL_CSS(density/print)만 담는다.
 */
export const BASE_CSS = '';

/**
 * 리포트 디렉토리의 로컬 shadowing 파일(components/, lib/)을 재귀 수집.
 * @param {string} dir
 * @param {string[]} out
 */
function collectFilesRecursive(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursive(full, out);
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(full);
  }
}

/**
 * @param {string} filePath
 * @returns {{ content: string, extension: string } | null}
 */
function toScanFile(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  const ext = path.extname(filePath).slice(1) || 'tsx';
  return { content: fs.readFileSync(filePath, 'utf8'), extension: ext };
}

/**
 * 소스 스캔 → shadcn @theme 유틸리티 CSS.
 * 스캔 대상: 사용자 TSX + reportDir/components|lib shadowing + 패키지 src/{ui,lib,shell,report}.
 * @param {{ tsxPath: string, packageRoot?: string }} opts
 *   packageRoot — 테스트용(빈 트리로 '' 분기 검증). 기본은 이 패키지 루트.
 * @returns {Promise<string>} 유틸리티 CSS. `@layer utilities {` 규칙이 없으면 ''.
 */
export async function compileTwSources({ tsxPath, packageRoot = pkgRoot }) {
  const absTsx = path.resolve(tsxPath);
  const reportDir = path.dirname(absTsx);

  const localFiles = [absTsx];
  collectFilesRecursive(path.join(reportDir, 'components'), localFiles);
  collectFilesRecursive(path.join(reportDir, 'lib'), localFiles);

  const scanFiles = [];
  for (const file of localFiles) {
    const entry = toScanFile(file);
    if (entry) scanFiles.push(entry);
  }

  const { build, sources } = await compile(buildV3Input(packageRoot), {
    base: pkgRoot,
    onDependency() {},
  });

  const packageCandidates = new Scanner({ sources: sources ?? [] }).scan();
  const localCandidates = scanFiles.length
    ? new Scanner({}).scanFiles(scanFiles)
    : [];
  const candidates = [...new Set([...packageCandidates, ...localCandidates])];

  const css = build(candidates);
  // tw-animate-css가 @property {…}를 넣으므로 `{`만으로는 비어 있는지 판별 불가.
  // 실제 유틸 규칙이 있을 때만 `@layer utilities {` 블록이 생긴다.
  if (!/@layer utilities\s*\{/.test(css)) return '';
  return css;
}
