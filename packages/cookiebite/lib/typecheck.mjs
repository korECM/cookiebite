// packages/cookiebite/lib/typecheck.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function typecheckReport(reportPath) {
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
      react: ['./node_modules/@types/react/index.d.ts'],
      'react/jsx-runtime': ['./node_modules/@types/react/jsx-runtime.d.ts'],
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
  return ts
    .getPreEmitDiagnostics(program)
    .map((d) => ts.formatDiagnosticsWithColorAndContext([d], host).trimEnd());
}
