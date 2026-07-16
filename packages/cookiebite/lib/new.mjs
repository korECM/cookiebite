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

function writeScaffoldIfMissing(filePath, data) {
  if (existsSync(filePath)) return false;
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
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

  process.stdout.write(`${target}\n다음: cookiebite build ${target}\n`);
}
