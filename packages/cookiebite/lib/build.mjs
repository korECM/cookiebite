// packages/cookiebite/lib/build.mjs
import { renameSync, writeFileSync } from 'node:fs';
import { assembleDocument } from './assemble.mjs';
import { lintTokens } from './lint.mjs';
import { BuildError, renderReport } from './render.mjs';
import { typecheckReport } from './typecheck.mjs';

function parseArgs(args) {
  const positional = [];
  let out;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '-o' || args[i] === '--out') {
      if (args[i + 1] === undefined) throw new BuildError('사용법: cookiebite build <report.tsx> [-o out.html]');
      out = args[i + 1];
      i += 1;
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length !== 1) throw new BuildError('사용법: cookiebite build <report.tsx> [-o out.html]');
  const report = positional[0];
  if (!report.endsWith('.tsx')) throw new BuildError(`${report}: .tsx 파일만 빌드할 수 있습니다`);
  return { report, out: out ?? report.replace(/\.tsx$/, '.html') };
}

export async function buildCommand(args) {
  const { report, out } = parseArgs(args);

  const diagnostics = typecheckReport(report);
  if (diagnostics.length > 0) {
    throw new BuildError(`typecheck 실패 (${diagnostics.length}건):\n${diagnostics.join('\n')}`);
  }

  const { markup, theme, title, lang } = await renderReport(report);

  const violations = lintTokens(markup);
  if (violations.length > 0) {
    const lines = violations.map((v) => `  [${v.source}] ${v.literal} — ${v.context}`);
    throw new BuildError(
      `색 리터럴 ${violations.length}건 — 테마 토큰(var(--cb-*))만 허용합니다:\n${lines.join('\n')}`,
    );
  }

  const html = assembleDocument({ markup, theme, title, lang });
  const tmp = `${out}.tmp`;
  writeFileSync(tmp, html);
  renameSync(tmp, out); // 원자적 교체: 부분 산출물이 배포되는 사고를 막는다
  process.stdout.write(`${out}\n`);
}
