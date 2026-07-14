// packages/cookiebite/lib/typecheck.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveReactTypesPaths() {
  const fallback = {
    react: [path.join(pkgRoot, 'node_modules/@types/react/index.d.ts')],
    'react/jsx-runtime': [path.join(pkgRoot, 'node_modules/@types/react/jsx-runtime.d.ts')],
  };
  try {
    // pkgRoot 기준 resolve — bun/npm flat에서는 상위 node_modules, 개발 repo에서는 중첩 경로.
    const pkgRequire = createRequire(path.join(pkgRoot, 'package.json'));
    const typesDir = path.dirname(pkgRequire.resolve('@types/react/package.json'));
    return {
      react: [path.join(typesDir, 'index.d.ts')],
      'react/jsx-runtime': [path.join(typesDir, 'jsx-runtime.d.ts')],
    };
  } catch {
    return fallback;
  }
}

export function typecheckReport(reportPath) {
  const reactPaths = resolveReactTypesPaths();
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
    paths: {
      cookiebite: ['./src/index.ts'],
      'cookiebite/themes': ['./src/themes.ts'],
      react: reactPaths.react,
      'react/jsx-runtime': reactPaths['react/jsx-runtime'],
    },
  };
  const program = ts.createProgram([path.resolve(reportPath)], options);
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
