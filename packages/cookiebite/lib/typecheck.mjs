// packages/cookiebite/lib/typecheck.mjs
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function pkgRequire() {
  return createRequire(path.join(pkgRoot, 'package.json'));
}

function resolveReactTypesPaths() {
  const fallback = {
    react: [path.join(pkgRoot, 'node_modules/@types/react/index.d.ts')],
    'react/jsx-runtime': [path.join(pkgRoot, 'node_modules/@types/react/jsx-runtime.d.ts')],
  };
  try {
    // pkgRoot 기준 resolve — bun/npm flat에서는 상위 node_modules, 개발 repo에서는 중첩 경로.
    const typesDir = path.dirname(pkgRequire().resolve('@types/react/package.json'));
    return {
      react: [path.join(typesDir, 'index.d.ts')],
      'react/jsx-runtime': [path.join(typesDir, 'jsx-runtime.d.ts')],
    };
  } catch {
    return fallback;
  }
}

/** 리포트가 패키지 밖(tmp, docs/)에 있어도 저작면 deps를 pkg node_modules에서 해석. */
function resolveAuthorDepPaths() {
  const req = pkgRequire();
  const out = {};
  for (const name of ['@tanstack/react-table', 'recharts', 'lucide-react']) {
    try {
      const dir = path.dirname(req.resolve(`${name}/package.json`));
      out[name] = [dir];
      out[`${name}/*`] = [`${dir}/*`];
    } catch {
      // optional — 해당 dep 미설치 시 저작 소스가 직접 실패 메시지를 낸다
    }
  }
  return out;
}

/**
 * `@/` 해석은 esbuild와 동일: 리포트 로컬 우선, 내장 ui/lib는 특수 매핑.
 * TS는 longest-prefix 패턴이 이기므로 ui/lib 배열에 로컬 후보를 앞에 둔다.
 */
function atAliasPaths(reportDir) {
  const local = (sub) => path.join(reportDir, sub);
  return {
    '@/*': [local('*')],
    '@/components/ui/*': [local('components/ui/*'), './src/ui/*'],
    '@/lib/*': [local('lib/*'), './src/lib/*'],
  };
}

export function typecheckReport(reportPath) {
  const absolute = path.resolve(reportPath);
  const reportDir = path.dirname(absolute);
  const reactPaths = resolveReactTypesPaths();
  const typeRoots = [path.join(pkgRoot, 'node_modules/@types')];
  const reportNmTypes = path.join(reportDir, 'node_modules/@types');
  if (existsSync(reportNmTypes)) typeRoots.unshift(reportNmTypes);

  const options = {
    noEmit: true,
    strict: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    resolveJsonModule: true,
    allowImportingTsExtensions: true,
    skipLibCheck: true,
    baseUrl: pkgRoot,
    typeRoots,
    paths: {
      cookiebite: ['./src/index.ts'],
      'cookiebite/themes': ['./src/themes.ts'],
      ...atAliasPaths(reportDir),
      react: reactPaths.react,
      'react/jsx-runtime': reactPaths['react/jsx-runtime'],
      ...resolveAuthorDepPaths(),
    },
  };
  const program = ts.createProgram([absolute], options);
  const host = {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  };
  // ...WithColorAndContext emits the source line and prop declaration, so a JSX
  // attribute mismatch names the offending prop — the plain message would not.
  return ts.getPreEmitDiagnostics(program).map((d) =>
    ts.formatDiagnosticsWithColorAndContext([d], host).replace(/\x1b\[[0-9;]*m/g, '').trimEnd(),
  );
}
