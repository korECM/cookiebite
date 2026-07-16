import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BuildError } from './render.mjs';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const COMPONENTS_JSON = {
  $schema: 'https://ui.shadcn.com/schema.json',
  style: 'new-york',
  rsc: false,
  tsx: true,
  tailwind: {
    config: '',
    css: '',
    baseColor: 'neutral',
    cssVariables: true,
  },
  aliases: {
    components: '@/components',
    utils: '@/lib/utils',
    ui: '@/components/ui',
    lib: '@/lib',
  },
};

/** shadcn CLI가 paths를 읽을 때 쓰는 최소 tsconfig — cookiebite 빌드는 자체 typecheck를 쓴다. */
const TSCONFIG_JSON = {
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    jsx: 'react-jsx',
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    baseUrl: '.',
    paths: {
      '@/*': ['./*'],
      '@/components/ui/*': ['./components/ui/*'],
      '@/lib/*': ['./lib/*'],
    },
  },
  include: ['./**/*.ts', './**/*.tsx'],
};

/** 공식 shadcn MCP — AI가 레지스트리를 검색하고 설치하게 한다. */
const MCP_JSON = {
  mcpServers: {
    shadcn: {
      command: 'npx',
      args: ['shadcn@latest', 'mcp'],
    },
  },
};

/** 프로젝트 레벨 AI 지침 — 컴포넌트 선택 루틴을 강제한다. */
const CLAUDE_MD = `# cookiebite 리포트 저작 지침

이 디렉토리는 cookiebite 리포트다. TSX 리포트를 작성해 단일 HTML로 빌드한다.

## 빌드와 검증

\`\`\`bash
cookiebite build report.tsx          # typecheck + lint → SSG → HTML
cookiebite verify report.html --runs 3
\`\`\`

작업을 마치면 build와 verify를 반드시 돌리고, hard finding이 없어야 한다.

## 컴포넌트 선택 루틴 (반드시 이 순서로)

1. **cookiebite 내장에서 먼저 찾는다.** 셸/데이터 컴포넌트(Report, Section, Panel,
   KpiRow, Claims, Findings, Matrix, RangeDot, BarList, Tracker, CategoryBar,
   DataTable, Columns)와 \`@/components/ui/*\` 18종(accordion, alert, badge,
   breadcrumb, button, card, chart, collapsible, hover-card, progress, scroll-area,
   separator, skeleton, table, tabs, toggle, toggle-group, tooltip)에 있으면 그대로 쓴다.
2. **없으면 즉시 레지스트리를 검색한다.** 손으로 새 UI를 만들지 말고 먼저
   \`npx shadcn@latest search <키워드>\`로 찾은 뒤 \`npx shadcn@latest view <이름>\`으로
   확인하고 \`npx shadcn@latest add <이름>\`으로 받는다(components.json 설정 완료).
   손으로 만드는 것은 마지막 수단이다.
3. **받은 파일은 \`@/\` 경로로 자동 인식된다.** 리포트 디렉토리 우선 해석이라 손질 없이
   import된다. 단 색 리터럴(hex, rgb, hsl, oklch)은 빌드 lint가 거부하므로 시맨틱 토큰
   (\`var(--chart-1)\`, \`bg-card\`, \`text-muted-foreground\` 등)으로 치환한다.
4. **추가 npm 의존성**이 필요한 블록은 리포트 디렉토리에서 \`pnpm add\`로 설치한다
   (로컬 node_modules 해석 지원).
5. **JSX 산문은 하드랩하지 않는다.** 한 문단(또는 한 문장)을 한 줄로 쓰고 에디터 soft wrap을
   쓴다. JSX는 줄바꿈을 공백 하나로 합치므로 한국어를 중간에서 하드랩하면 렌더 결과에
   의도치 않은 공백이 끼어든다. \`{expr}\` 표현식과 텍스트를 같은 줄에 인접시키는 것도
   하이드레이션 오류(#418)를 만드니 템플릿 리터럴 하나로 합친다.
6. **마지막에 build와 verify를 반드시 돌린다.**
`;

function writeScaffoldIfMissing(filePath, data) {
  if (existsSync(filePath)) return false;
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  return true;
}

function writeTextIfMissing(filePath, text) {
  if (existsSync(filePath)) return false;
  writeFileSync(filePath, text);
  return true;
}

export async function newCommand(args) {
  const [target] = args;
  if (!target) throw new BuildError('사용법: cookiebite new <report.tsx>');
  if (existsSync(target)) throw new BuildError(`${target}: 이미 있습니다. 덮어쓰지 않습니다.`);
  copyFileSync(path.join(pkgRoot, 'templates/starter.tsx'), target);

  const reportDir = path.dirname(path.resolve(target));
  writeScaffoldIfMissing(path.join(reportDir, 'components.json'), COMPONENTS_JSON);
  writeScaffoldIfMissing(path.join(reportDir, 'tsconfig.json'), TSCONFIG_JSON);
  writeScaffoldIfMissing(path.join(reportDir, '.mcp.json'), MCP_JSON);
  writeTextIfMissing(path.join(reportDir, 'CLAUDE.md'), CLAUDE_MD);

  process.stdout.write(`${target}\n다음: cookiebite build ${target}\n`);
}
